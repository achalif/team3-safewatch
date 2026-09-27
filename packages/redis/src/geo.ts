/**
 * GEOSPATIAL REDIS HELPERS (SafeWatch Real-Time Tracking Engine)
 * 
 * What does this file do?
 *  - This file provides helper functions to manage and query real-time GPS coordinates
 *    using Upstash Redis geospatial commands (GEOADD, GEOSEARCH, ZREM)
 * 
 * Why is this file needed?
 *  - Abstraction: Wraps raw Redis commands into TypeScript functions, so API route handlers
 *  dont need to write raw database queries.
 * 
 * - High-Performance: Leverages Redis in-memory spatial indexes to calculate user proximity in
 *    milliseconds for real-time tracking. 
 * 
 */

import {redis} from "./client.js";

// Redis key for tracking all live active user locations
const LOCATION_KEY = "safewatch:active_locations";

export interface UserLocation {
    userId: string;
    longitude: number;
    latitude: number;
}


 // This function adds and updates a user's real-time GPS coordinates in Redis

export async function updateUserLocation({
  userId,
  latitude,
  longitude,
}: UserLocation) {
  return await redis.geoadd(LOCATION_KEY, {
    latitude,
    longitude,
    member: userId,
  });
}


 // Fetches the current live GPS coordinates for a specific user.
 
export async function getUserLocation(userId: string) {
  const result = await redis.geopos(LOCATION_KEY, userId);

  if (!result || !result[0]) {
    return null;
  }

  const location = result[0];

  return {
    longitude: location.lng,
    latitude: location.lat,
  };
}


 // This function searches for users within a specified radius (meters) of a location

export async function getUsersInRadius(
  latitude: number,
  longitude: number,
  radiusMeters: number
) {
  return await redis.geosearch(
    LOCATION_KEY,
    {
      type: "FROMLONLAT",
      coordinate: { lat: latitude, lon: longitude },
    },
    {
      type: "BYRADIUS",
      radius: radiusMeters,
      radiusType: "M",
    },
    "ASC"
  );
}

// Removes a user's active tracking location when they go offline.

export async function removeUserLocation(userId: string) {
  return await redis.zrem(LOCATION_KEY, userId);
}

// Redis key for the spatial index of active incidents
const INCIDENT_KEY = "safewatch:incidents";

// Adds or updates an incident's coordinates in the spatial index
export async function indexIncident(incidentId: string, latitude: number, longitude: number) {
  return await redis.geoadd(INCIDENT_KEY, { latitude, longitude, member: incidentId });
}

// Returns incident IDs within radiusMeters of a point, nearest first
export async function getIncidentIdsInRadius(latitude: number, longitude: number, radiusMeters: number) {
  return await redis.geosearch<string>(
    INCIDENT_KEY,
    { type: "FROMLONLAT", coordinate: { lat: latitude, lon: longitude } },
    { type: "BYRADIUS", radius: radiusMeters, radiusType: "M" },
    "ASC"
  );
}

// Removes an incident from the index when it's resolved or deleted
export async function removeIncident(incidentId: string) {
  return await redis.zrem(INCIDENT_KEY, incidentId);
}

