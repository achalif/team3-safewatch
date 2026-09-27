import {
  prisma,
  IncidentStatus,
  IncidentSeverity,
  IncidentCategory,
  Relationship,
  AlertSeverity,
  AlertLifecycleStatus,
  TargetAudience,
  DeliveryChannel,
  DeliveryStatus,
} from "@project/db";
import { z } from "zod";

export const incidentSeverityOrder: Record<IncidentSeverity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const listActiveIncidentsSchema = z.object({
  limit: z.number().int().positive().max(50).optional(),
});

export const emergencyContactRelationshipSchema = z
  .enum([
    Relationship.PARENT,
    Relationship.SPOUSE,
    Relationship.SIBLING,
    Relationship.FRIEND,
    Relationship.OTHER,
  ])
  .optional();

export const createEmergencyContactSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phoneNumber: z.string().trim().min(7).max(30),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  relationship: emergencyContactRelationshipSchema,
  isPrimary: z.boolean().default(false),
});

export const triggerSosAlertSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  message: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value ? value : undefined)),
});

// Thrown when the current user has no one to notify; the route maps it to 409.
export class NoEmergencyContactsError extends Error {
  readonly code = "NO_EMERGENCY_CONTACTS";

  constructor() {
    super("Add at least one emergency contact before triggering an SOS alert.");
  }
}

export type IncidentListItem = {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  category: IncidentCategory;
  address: string | null;
  createdAt: Date;
};

export async function listActiveIncidents(
  input: z.infer<typeof listActiveIncidentsSchema> = {}
): Promise<IncidentListItem[]> {
  const limit = input.limit ?? 25;

  const incidents = await prisma.incident.findMany({
    where: {
      status: { in: [IncidentStatus.ACTIVE, IncidentStatus.INVESTIGATING] },
    },
    select: {
      id: true,
      title: true,
      status: true,
      severity: true,
      category: true,
      address: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return incidents
    .sort((a, b) => {
      const severityDelta =
        incidentSeverityOrder[b.severity] - incidentSeverityOrder[a.severity];

      if (severityDelta !== 0) return severityDelta;

      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, limit);
}

export async function createEmergencyContact(
  userId: string,
  input: z.infer<typeof createEmergencyContactSchema>
) {
  return prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.emergencyContact.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    return tx.emergencyContact.create({
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phoneNumber: input.phoneNumber.trim(),
        email: input.email?.trim() || null,
        relationship: input.relationship ?? null,
        isPrimary: input.isPrimary,
        userId,
      },
    });
  });
}

export async function triggerSosAlert(
  userId: string,
  input: z.infer<typeof triggerSosAlertSchema>
) {
  return prisma.$transaction(async (tx) => {
    const contacts = await tx.emergencyContact.findMany({
      where: { userId },
      select: { id: true },
    });

    if (contacts.length === 0) {
      throw new NoEmergencyContactsError();
    }

    const coordinates = `${input.latitude}, ${input.longitude}`;
    const body = [
      `SOS triggered. Last known location: ${coordinates}`,
      `https://maps.google.com/?q=${input.latitude},${input.longitude}`,
      input.message,
    ]
      .filter(Boolean)
      .join("\n");

    return tx.alert.create({
      data: {
        title: "SOS alert",
        body,
        status: AlertLifecycleStatus.ACTIVE,
        severity: AlertSeverity.EMERGENCY,
        audience: TargetAudience.EMERGENCY_CONTACTS,
        logs: {
          create: contacts.map((contact) => ({
            emergencyContactId: contact.id,
            channel: DeliveryChannel.SMS,
            status: DeliveryStatus.PENDING,
          })),
        },
      },
      include: {
        logs: {
          select: { id: true, emergencyContactId: true, channel: true, status: true },
        },
      },
    });
  });
}
