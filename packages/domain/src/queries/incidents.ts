/** 
 * INCIDENT DATABASE QUERIES:
 * 
 * What this file does:
 * 
 * 1. listNearbyIncidents(input)
 *     - Finds the active incidents near the user so the app can show them as pins on the map.
 *     - Redis finds which incidents are close by, then Postgres gives us their details.
 * 
 * 2. getIncidentById(id)
 *      - Looks up one incident by its ID, for the detail view when a user taps a pin.
 * 
 * 3. listActiveIncidents(input)
 *      - Lists active incidents across the whole city, most severe first, for the home page.
 *
 */

import { prisma, IncidentStatus, IncidentSeverity, IncidentCategory } from "@project/db";
import { getIncidentIdsInRadius} from "@project/redis";
import { ListActiveIncidentsInput, ListNearbyIncidentsInput } from "../zod_schemas/incidents";


export const incidentSeverityOrder: Record<IncidentSeverity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export type IncidentListItem = {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  category: IncidentCategory;
  address: string | null;
  createdAt: Date;
};

export type IncidentPin = {
  id: string;
  title: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  createdAt: Date;
};

export async function listNearbyIncidents(
  input: ListNearbyIncidentsInput,
): Promise<IncidentPin[]> {

  // 1. Query Redis in-memory spatial index for incident IDs (nearest first)
  const nearbyIncidentIds = await getIncidentIdsInRadius(input.latitude, input.longitude, input.radiusInMiles * 1609.34);

  if(!nearbyIncidentIds || nearbyIncidentIds.length === 0) {
    return [];
  }

  // 2. Fetch active incidents from Postgres, the source of truth
  const incidentIds = nearbyIncidentIds.slice(0, input.limit).map((r) => r.member);

  const incidents = await prisma.incident.findMany({
    where: {
      id: {in: incidentIds},
      status: {in: [IncidentStatus.ACTIVE, IncidentStatus.INVESTIGATING]},
    },
    select: {
      id: true,
      title: true,
      category: true,
      severity: true,
      latitude: true,
      longitude: true,
      createdAt: true,
    }
  });

  // 3. Postgres doesn't keep Redis's order, so put them back in Redis's order (closest to the user first)
  return incidents.sort(
    (a, b) => incidentIds.indexOf(a.id) - incidentIds.indexOf(b.id)
  );
}

export async function getIncidentById(id: string) {
    return prisma.incident.findUnique({
        where : { id },
        include : { alerts : true, updates: true },
    });
}

export async function listActiveIncidents(
  input: ListActiveIncidentsInput = {}
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
