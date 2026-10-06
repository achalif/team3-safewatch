"use client";

import { useRef, useState, type FormEvent } from "react";
import { updateLocationSchema } from "@project/domain/src/zod_schemas/location";
import {
  DeviceLocationError,
  getDeviceLocation,
  type Coordinates,
  type DeviceLocationFailure,
} from "./device-location";

// One status instead of several booleans, so "saving" and "error" can't both
// be true. The diagram is in docs/specs/location/user-location.md (UI states).
type Status = "idle" | "locating" | "manual" | "saving" | "saved" | "error";
type Source = "device" | "manual";

const FALLBACK_REASONS: Record<DeviceLocationFailure, string> = {
  denied: "Location permission was denied.",
  timeout: "Your device took too long to find your location.",
  unavailable: "Your device couldn't determine its location.",
  unsupported: "This browser can't share your location here.",
};

const SOURCE_LABELS: Record<Source, string> = {
  device: "Using your device location",
  manual: "Using the location you entered",
};

type SaveResult = { ok: true; location: Coordinates } | { ok: false; message: string };

async function putLocation(coordinates: Coordinates): Promise<SaveResult> {
  let response: Response;
  try {
    response = await fetch("/api/v1/location", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coordinates),
    });
  } catch {
    return { ok: false, message: "Couldn't reach the server. Check your connection and try again." };
  }

  const body = await response.json().catch(() => null);
  if (response.ok && body) {
    return { ok: true, location: body };
  }
  return { ok: false, message: body?.error?.message ?? "Something went wrong. Try again." };
}

// An empty field must not become 0, so it is sent to the schema as NaN.
function toNumber(value: string) {
  return value.trim() === "" ? Number.NaN : Number(value);
}

export function LocationPicker() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [attempt, setAttempt] = useState<{ coordinates: Coordinates; source: Source } | null>(null);
  const [saved, setSaved] = useState<{ coordinates: Coordinates; source: Source } | null>(null);

  // A device lookup the user walked away from must not overwrite later state.
  const locateRequest = useRef(0);

  async function save(coordinates: Coordinates, source: Source) {
    setAttempt({ coordinates, source });
    setMessage(null);
    setStatus("saving");

    const result = await putLocation(coordinates);
    if (result.ok) {
      setSaved({ coordinates: result.location, source });
      setStatus("saved");
    } else {
      setMessage(result.message);
      setStatus("error");
    }
  }

  async function useDevice() {
    const request = ++locateRequest.current;
    setMessage(null);
    setStatus("locating");

    try {
      const coordinates = await getDeviceLocation();
      if (request !== locateRequest.current) return;
      await save(coordinates, "device");
    } catch (error) {
      if (request !== locateRequest.current) return;
      const reason = error instanceof DeviceLocationError ? error.reason : "unavailable";
      setMessage(`${FALLBACK_REASONS[reason]} Enter your coordinates instead.`);
      setStatus("manual");
    }
  }

  function enterManually() {
    locateRequest.current++;
    setMessage(null);
    setStatus("manual");
  }

  function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = updateLocationSchema.safeParse({
      latitude: toNumber(latitude),
      longitude: toNumber(longitude),
    });

    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Check your coordinates.");
      return;
    }

    void save(parsed.data, "manual");
  }

  const busy = status === "locating" || status === "saving";

  return (
    <section
      aria-labelledby="location-heading"
      className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6"
    >
      <h2 id="location-heading" className="text-lg font-semibold">
        Your location
      </h2>

      <div aria-live="polite" className="space-y-1 text-sm">
        {status === "locating" && <p>Finding your location…</p>}
        {status === "saving" && <p>Saving your location…</p>}
        {status === "saved" && saved && (
          <p>
            <span className="font-medium">{SOURCE_LABELS[saved.source]}</span>:{" "}
            {saved.coordinates.latitude}, {saved.coordinates.longitude}
          </p>
        )}
        {message && (
          <p className={status === "error" ? "text-red-700" : "text-neutral-700"}>{message}</p>
        )}
      </div>

      {status === "manual" && (
        <form onSubmit={submitManual} noValidate className="space-y-3">
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col text-sm">
              Latitude
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                placeholder="40.7128"
                className="rounded border border-neutral-300 px-2 py-1"
              />
            </label>
            <label className="flex flex-col text-sm">
              Longitude
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                placeholder="-74.006"
                className="rounded border border-neutral-300 px-2 py-1"
              />
            </label>
          </div>
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            Save location
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        {status !== "locating" && !(status === "saved" && saved?.source === "device") && (
          <button
            type="button"
            onClick={useDevice}
            disabled={busy}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Use my location
          </button>
        )}
        {status !== "manual" && !(status === "saved" && saved?.source === "manual") && (
          <button
            type="button"
            onClick={enterManually}
            disabled={status === "saving"}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {status === "locating" ? "Enter coordinates instead" : "Enter coordinates"}
          </button>
        )}
        {status === "error" && attempt && (
          <button
            type="button"
            onClick={() => save(attempt.coordinates, attempt.source)}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            Retry
          </button>
        )}
      </div>
    </section>
  );
}
