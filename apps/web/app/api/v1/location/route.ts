/**
 * USER LOCATION ROUTE
 * Endpoint: /api/v1/location
 *
 * PUT /api/v1/location
 *  - Saves the current user's location, replacing the previous one.
 *  - The user comes from currentUserId(), never from the body.
 *  - The body is checked against updateLocationSchema; bad input returns
 *    400 VALIDATION_ERROR before anything is stored.
 *  - Returns 200 with { latitude, longitude }.
 *
 * Spec: docs/specs/location/user-location.md
 */

import { currentUserId } from "@project/auth";
import { saveUserLocation, updateLocationSchema } from "@project/domain";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const userId = await currentUserId();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON." } },
        { status: 400 }
      );
    }

    const parsed = updateLocationSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid location payload.",
          },
        },
        { status: 400 }
      );
    }

    const location = await saveUserLocation(userId, parsed.data);
    return Response.json(location);
  } catch (error) {
    console.error("location-update-error", error);

    if (error instanceof Error && error.message.includes("Dev identity stub is disabled")) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication is required." } },
        { status: 401 }
      );
    }

    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
      { status: 500 }
    );
  }
}
