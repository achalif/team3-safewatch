import { prisma } from "@project/db";
import { z } from "zod";

export const incidentSeverityOrder = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
} as const;

export const listActiveIncidentsSchema = z.object({
  limit: z.number().int().positive().max(50).optional(),
});

export type IncidentListItem = {
  id: string;
  title: string;
  status: string;
  severity: string;
  category: string;
  address: string | null;
  createdAt: Date;
};

export async function listActiveIncidents(
  input: z.infer<typeof listActiveIncidentsSchema> = {}
): Promise<IncidentListItem[]> {
  const limit = input.limit ?? 25;

  const incidents = await prisma.incident.findMany({
    where: {
      status: { in: ["ACTIVE", "INVESTIGATING"] },
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
  });

  return incidents
    .sort((a, b) => {
      const severityDelta =
        (incidentSeverityOrder[b.severity as keyof typeof incidentSeverityOrder] ?? 0) -
        (incidentSeverityOrder[a.severity as keyof typeof incidentSeverityOrder] ?? 0);

      if (severityDelta !== 0) return severityDelta;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, limit)
    .map((incident) => ({
      ...incident,
      status: incident.status,
      severity: incident.severity,
      category: incident.category,
    }));
}