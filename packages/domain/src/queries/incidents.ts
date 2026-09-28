import { prisma, IncidentStatus, IncidentSeverity, IncidentCategory } from "@project/db";
import { getIncidentIdsInRadius, getUserLocation } from "@project/redis";
import { ListActiveIncidentsInput } from "../zod_schemas/incidents";

// Alert radius used until profiles carry a per-user setting
const DEFAULT_RADIUS_METERS = 5 * 1609.34;

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


/**
 * INCIDENT DATABASE QUERIES:
 * 
 * What this file does:
 * 
 * 1. getActiveIncidentPins()
 *      - Pulls every live incident currently parsed from the CAD feed.
 *      
 * 2. getNearbyIncidentsForUserProfile()
 *      - Queries Redis for incident IDs inside the user's radius, then 
 *      fetches full incident records from Prisma.
 * 
 * 3. getIncidentById()
 *      - Looks up one exact CAD incident by its ID.
 */

export async function getActiveIncidentPins() {
    return prisma.incident.findMany({
        where : { status: { in: [IncidentStatus.ACTIVE,IncidentStatus.INVESTIGATING] } },
        select : {
            id: true,
            title: true,
            category: true,
            severity: true,
            latitude: true,
            longitude: true,
            createdAt: true,
        },
        orderBy : { createdAt : "desc"},
    });
}

/**
 * Retrieves active CAD incidents located within a user's configured alert radius
 */
export async function getNearbyIncidentsForUserProfile(userId: string) {
    // 1. Fetch the user's live location from Redis
    const location = await getUserLocation(userId);

    if (!location) {
        return [];
    }

    // 2. Query Redis in-memory spatial index for incident IDs
    const nearbyIncidentIds = await getIncidentIdsInRadius(
        location.latitude,
        location.longitude,
        DEFAULT_RADIUS_METERS
    );

    if (!nearbyIncidentIds || nearbyIncidentIds.length === 0) {
        return [];
    }

    // 3. Fetch full records from Postgres, the source of truth
    const incidentIds = nearbyIncidentIds.map((r) => r.member);

    return prisma.incident.findMany({
        where: {
            id: { in: incidentIds },
            status: { in: [IncidentStatus.ACTIVE, IncidentStatus.INVESTIGATING] },
        },
    });
}

export async function getIncidentById(id: string) {
    return prisma.incident.findUnique({
        where : { id },
        include : { alerts : true },
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
