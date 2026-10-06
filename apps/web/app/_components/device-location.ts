import type { UpdateLocationInput } from "@project/domain/src/zod_schemas/location";

export type Coordinates = UpdateLocationInput;

export type DeviceLocationFailure = "unsupported" | "denied" | "unavailable" | "timeout";

export class DeviceLocationError extends Error {
  constructor(readonly reason: DeviceLocationFailure) {
    super(`Device location failed: ${reason}`);
  }
}

// Shared by the location picker, the SOS button and the map. Call it only from
// a user action: browsers penalize permission prompts on page load.
export function getDeviceLocation(timeoutMs = 10_000): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    // Geolocation needs a secure context (localhost or HTTPS).
    if (typeof navigator === "undefined" || !navigator.geolocation || !window.isSecureContext) {
      reject(new DeviceLocationError("unsupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => {
        const reason: DeviceLocationFailure =
          error.code === error.PERMISSION_DENIED
            ? "denied"
            : error.code === error.TIMEOUT
              ? "timeout"
              : "unavailable";
        reject(new DeviceLocationError(reason));
      },
      { timeout: timeoutMs, maximumAge: 60_000 }
    );
  });
}
