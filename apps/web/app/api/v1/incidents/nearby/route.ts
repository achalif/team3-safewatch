/**
 * INCIDENT ROUTE - NEARBY INCIDENTS
 * Endpoint: /api/v1/incidents/nearby
 * 
 * What does this route do?
 *  - Returns the active incidents around the user's current location, so the app
 *    can draw them as pins on the live map.
 * -  Incidents are public, meaning everyone sees the same incidents for the same area.
 *    The user still comes from currentUserId(), so the route only answers logged in users
 * 
 * 
 * 1. GET /api/v1/incidents/nearby?latitude=40.71&longitude=-74.00
 *   - The query params are checked against ListNearbyIncidentsSchema first,
 *     bad input returns 400 VALIDATION_ERROR before it can touch the database.
 *   - radiusInMiles defaults to 10 (max 50) and limit defaults to 20 (max 100)
 *     if the client leaves them out.
 *   - Redis finds the incident ids inside the radius, then Prisma fetches their
 *     full records
 *   - Returns 200 with list of incidents (an empty list if none are nearby).
 * 
 *    Errors:
 *      - 401 no logged-in user | 500 anything unexpected
 *      - Always shaped as {error: {code, message}}
 * 
 *    Full details for ONE incident live in /api/v1/incidents/[id]
 *
 */
import {currentUserId} from "@project/auth";
import {ListNearbyIncidentsSchema, listNearbyIncidents} from "@project/domain";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        await currentUserId();
        // Read the user's location from the URL's query string (?latitude=...&longitude=...)
        const searchParams = new URL(request.url).searchParams;
        const parsed = ListNearbyIncidentsSchema.safeParse(Object.fromEntries(searchParams));
    
        if(!parsed.success) {
            return Response.json(
                {
                    error: {
                        code: "VALIDATION_ERROR",
                        message: parsed.error.issues[0]?.message ?? "Invalid location",
                },

            },
            {status: 400}
        );
    } 
    const incidents = await listNearbyIncidents(parsed.data);
    return Response.json(incidents);
    } catch (error) {
        console.error("incident-nearby-error", error);

        if (error instanceof Error && error.message.includes("Dev identity stub is disabled")) {
            return Response.json(
                {error: {code: "UNAUTHORIZED", message: "Authentication is required."}},
                {status: 401}
            );
        }

        return Response.json(
            {error: {code: "INTERNAL_ERROR", message: "Something went wrong."}},
            {status: 500},
        );
    }
}


