import { updateUserLocation } from "@project/redis";
import type { UpdateLocationInput } from "../zod_schemas/location";

// Replaces the user's one stored location. No user-exists check yet; see
// docs/specs/location/user-location.md.
export async function saveUserLocation(userId: string, input: UpdateLocationInput) {
  await updateUserLocation({ userId, latitude: input.latitude, longitude: input.longitude });
  return { latitude: input.latitude, longitude: input.longitude };
}
