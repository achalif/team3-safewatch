import {
  prisma,
  AlertSeverity,
  AlertLifecycleStatus,
  TargetAudience,
  DeliveryChannel,
  DeliveryStatus,
} from "@project/db";
import { NoEmergencyContactsError, type TriggerSosAlertInput } from "../zod_schemas/alerts";

export async function triggerSosAlert(userId: string, input: TriggerSosAlertInput) {
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
