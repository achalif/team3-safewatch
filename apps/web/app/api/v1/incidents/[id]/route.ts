/**
 * INCIDENT ROUTE - SINGLE INCIDENT
 * Endpoint: /api/v1/incidents/[id]
 * 
 * What does this route do?
 *  - Returns the full details for ONE incident, for the detail screen the app opens
 *    when a user taps a pin or a push notification.
 *  - The [id] in the URL says which incident (e.g. the pin they tapped).
 *  - Incidents are public, meaning every logged-in user can view any incident
 *    The user still comes from currentUserId(), so the route only answers logged in users
 * 
 * 1. `GET /api/v1/incidents/[id]`
 *    - The [id] is checked against GetIncidentByIdSchema first, a malformed
 *      id returns 400 VALIDATION_ERROR before it can touch the database.
 *    - Returns 200 with the incident, its timeline updates and its alerts.
 *    - 404 if no incident has that id.
 * 
 * Errors:
 *   - 401 no logged-in user | 500 anything unexpected
 *   - Always shaped as {error: {code, message}}
 * 
 * Nearby incidents for the map live in /api/v1/incidents/nearby
 */
import {currentUserId} from "@project/auth";
import {GetIncidentByIdSchema, getIncidentById } from "@project/domain";
export const dynamic = "force-dynamic";

export async function GET(_request: Request,
    {params}: {params: Promise<{id: string}>}
) {
    try {
        await currentUserId();

        const {id} = await params;
        const parsed = GetIncidentByIdSchema.safeParse({id});

        if(!parsed.success) {
            return Response.json(
                {error: {code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Incident ID does not exist."}},
                {status: 400},
            );
        }
        const incident = await getIncidentById(parsed.data.id);

        if(!incident) {
            return Response.json(
                {error: {code: "NOT_FOUND", message: "Incident not found."}},
                {status: 404},
            );
        }
        return Response.json(incident);
    } catch (error) {
        console.error("incident-get-error", error);

        if(error instanceof Error && error.message.includes("Dev identity stub is disabled")) {
            return Response.json(
                {error: {code: "UNAUTHORIZED", message: "Authentication is required."}},
                {status: 401},
            );
        }

        return Response.json(
            {error: {code: "INTERNAL_ERROR", message: "Something went wrong."}},
            {status: 500},
        );
    }

}

