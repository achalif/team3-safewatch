import { prisma, IncidentCategory, IncidentSeverity } from "../client";
import { calculateBoundingBox } from "../utils/geo";
import { getDistance } from "geolib";

/**
 * INCIDENT DATABASE QUERIES:
 * 
 * What this file does:
 * 
 * 1. getActiveIncidents()
 *      - Pulls every live incident currently parsed from the CAD feed.
 *      Used mainly to debug live CAD stream ingestion and show a default map
 *      feed if a user turns off their GPS.
 * 
 * 2. getNearbyIncidentsForUserProfile()
 *      - Finds active CAD incidents within a specific user's alert radius
 *      (e.g 5 miles) using their current GPS location.
 * 
 * 3. getIncidentById()
 *      - Looks up one exact CAD incident by its ID to show full details
 *      when a user taps a map pin or opens a push notification.
 * 
 * 4. createIncident()
 *      - Creates and constructs a new incident row to be added to the
 *      PostgreSQL table. This is what maps the raw incoming CAD payload directly into
 *      the Prisma database model.
 */

export async function getActiveIncidents() {
    return prisma.incident.findMany({
        where : { status: { in: ["ACTIVE","INVESTIGATING"] } },
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
    // 1. Fetch the User Profile
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: {
            latitude: true,
            longitude: true,
            defaultRadiusMiles: true,
        },
    });

    // Guard to check that profile exists and has location data
    if(!profile || profile.latitude == null || profile.longitude == null) {
        return [];
    }

    // 2. Use helper function to calculate the bounding box
    const bounds = calculateBoundingBox(
        profile.latitude,
        profile.longitude,
        profile.defaultRadiusMiles
    )

    /**
     * Query PostgreSQL for active incidents inside the bounding box
     * The database index [latitude, longitude] makes the search super fast 
     * across thousands of statewide incidents.
    */ 
   const candidateIncidents = await prisma.incident.findMany({
        // Only search for active emergencies (or being investigated)
        where : {
            status : { in: ["ACTIVE", "INVESTIGATING"] },

            // Latitude must fall between the southern (min) and northern (max) edges
            latitude : { gte: bounds.minLat, lte: bounds.maxLat},

            // Longitude must fall between the western (min) and eastern (max) edges
            longitude : { gte: bounds.minLng, lte: bounds.maxLng},
        },
        select: {
            id: true,
            title: true,
            category: true,
            severity: true,
            latitude: true,
            longitude: true,
            createdAt: true,
        },
        orderBy: { createdAt : "desc"},
   });

   const radiusInMeters = profile.defaultRadiusMiles * 1609.34;
   return candidateIncidents.filter((incident) => {
        // Measure exact straight-line distance from user's location to an incident
        const distanceInMeters = getDistance(
            { latitude: profile.latitude!, longitude: profile.longitude! },
            { latitude: incident.latitude, longitude: incident.longitude }
        );
        // Only return incidents that fall within the user's circular radius
        return distanceInMeters <= radiusInMeters;
   });
}

export async function getIncidentById(id: string) {
    return prisma.incident.findUnique({
        where : { id },
            include : { alerts : true}

    })
}

export async function createIncident(data : {
    userId: string;
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
    return prisma.incident.create({ data });
}

