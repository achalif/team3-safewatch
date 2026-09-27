import { prisma, IncidentCategory, IncidentSeverity } from "@project/db";
import { indexIncident } from "@project/redis";

/**
 * Persists a new incident to PostgreSQL and indexes its coordinates in Redis.
 * Called by the scanner when the CAD feed reports a new event.
 */
export async function createIncident(data : {
    title: string;
    category: IncidentCategory;
    severity: IncidentSeverity;
    longitude: number;
    latitude: number;
    address?: string;
    description?: string;
    externalId?: string;
    source?: string;
}) {
    const incident = await prisma.incident.create({ data });

    await indexIncident(incident.id, incident.latitude, incident.longitude);

    return incident;
}
