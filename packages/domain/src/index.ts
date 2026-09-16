import { prisma, IncidentStatus, IncidentSeverity, IncidentCategory } from "@project/db";
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