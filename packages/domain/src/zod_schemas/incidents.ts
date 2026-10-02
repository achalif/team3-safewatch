import {z} from "zod";
import { IncidentCategory, IncidentSeverity, IncidentStatus} from "@project/db"; // Enums needed
/**
 * INCIDENTS ZOD SCHEMAS (Public / Area-Wide Incident Domain)
 *
 * Scope and Domain Boundary:
 *    - Handles PUBLIC area-wide emergency incidents, map pins, and spatial hazard queries
 *    - Manages the lifecycle of incidents derived from police audio dispatches
 *    (AI monitors this)
 *
 * Note on Alerts:
 *      - An incident is the emergency itself (the pin on the map). An alert is the notification
 *      sent about it. The plan is for the worker to create them from an already validated incident, so they will not need their own schema.
 *      - Personal SOS button triggers and emergency contact notifcations do NOT
 *      belong in this file. A separate file will contain (`TriggerSosAlertSchema`)
 *      for targeted user-level alerts.
 *      - Recipient delivery receipts (SMS/Push logs) will be managed in `alert-logs.ts`
 *
 * 1. CreateIncidentSchema
 *    - Serves as a validation barrier when an AI agent/LLM extracts emergency metadata
 *    parsed from raw dispatch audio feeds.
 *
 *    Why is it passed to an AI framework?
 *    - When passing the schema in a call to the AI framework, it guarantees strict JSON output from the model.
 *    - Prevents AI hallucinations, invalid coordinate bounds, or invalid enum values from
 *    reaching the database or triggering false push alerts.
 *
 *    Execution and failure recovery:
 *    - Pipeline Type Safety: Infers TypeScript types (z.infer) to safely pass validated AI outputs
 *    to Redis geospatial search and push notification workers.
 *    - Error Recovery Loop: When safeParse() fails, the validation error list feeds back into the LLM retry
 *    loop to correct output errors automatically before failing out.
 *
 * 2. ListNearbyIncidentsSchema
 *    - Validates GET query parameters when a user's phone requests nearby incidents or active hazard data
 *    (`GET /api/v1/incidents/nearby`)
 *
 *    Why is it needed?
 *    - Validates user GPS coordinates before executing spatial lookup queries (Redis)
 *    - Enforces strict limit for returned items (max(100)) so large queries dont crash the database or lag mobile UI
 *    - Applies a default 10-mile search radius and 20-item limit if parameters are omitted by the client
 *
 *    Data flow:
 *    - Phone sends GPS coords to API (e.g. `GET /api/v1/incidents/nearby?latitude=40.71&longitude=-74.00`) ->
 *    - Zod schema validates query parameters in request ->
 *    - Redis (GEOSEARCH) scans in-memory GPS cache to find nearby incident IDs (e.g [incident_101, incident_102,..]) ->
 *    - Prisma fetches full records for those incidents (titles, categories, messages, times,...) ->
 *    - React renders a colored pin for those incidents on the live map. When a user taps the pin, they open a bottom card
 *    showing the title and message.
 *
 * 3. GetIncidentByIdSchema
 *      - Validates URL path parameters when the client requests full details for a specific incident
 *      (`GET /api/v1/incidents/[id]`)
 *
 *      Why is it needed?
 *      - Validates the [id] path parameter in memory before reaching Prisma, preventing malformed strings
 *      (`null`, `undefined`, garbage IDs) from causing unhandled 500 DB driver exceptions.
 *      - Blocks any injection attempts from reaching the DB
 *
 *      Note: The [id] is used to validate which specific incident record to get from the DB when the client sends
 *      a request
 *
 *      User triggers and Data Flow
 *      - User taps a push notification, clicks a pin's `View Full Report` button or opens a shared link ->
 *      - App sends GET request with the incident ID in the URL path (e.g., `GET /api/v1/incidents/clx123abc`) ->
 *      - GetIncidentByIdSchema validates the [id] parameter ->
 *      - Prisma fetches the single matching incident record from the PostgreSQL database
 *      - App opens the full detail view screen (timeline, official instructions, and status updates)
 *
 * 4. UpdateIncidentStatusSchema
 *    - Validates lifecycle status transitions when an active incident is resolved, expired, or cancelled
 *    (`PATCH /api/v1/incidents/[id]/status`)
 *
 *    Why is it needed?
 *    - Ensures states transitions strictly match Prisma's `IncidentStatus' enum
 *    ('ACTIVE', 'INVESTIGATING', 'RESOLVED', 'CANCELLED', 'EXPIRED')
 *    - When an incident's status changes to `RESOLVED` or `CANCELLED`, backend handlers will
 *    remove the incident from Redis spatial indexes so those pins are removed from the live map
 *
 * 5. AppendIncidentUpdateSchema
 *    - Validates real-time situational update entries extracted by the AI agent from the parsed
 *    dispatch audio feeds (`POST /api/v1/incidents/[id]/updates`)
 *
 *    Why is it needed?
 *    - As an emergency progresses, the AI agent continuously transcribes dispatch audio and creates
 *    timestamped timeline updates (e.g. `FDNY requesting 2nd alarm units`)
 *    - Allows AI to dynamically escalate severity or expand the geographical range if the
 *    hazard zone expands
 *
 */

export const listActiveIncidentsSchema = z.object({
    limit: z.coerce.number().int().positive().max(50).optional(),
});

export type ListActiveIncidentsInput = z.infer<typeof listActiveIncidentsSchema>;

export const CreateIncidentSchema = z.object({
    title: z.string().trim().min(1).max(100), // Title for the map pin card and mobile push notification banners
    category: z.nativeEnum(IncidentCategory), // Classification type, bound directly to the Prisma IncidentCategory enum
    severity: z.nativeEnum(IncidentSeverity),  // Severity level, bound directly to the Prisma IncidentSeverity enum
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    /**
     * Passed into Redis geospatial query (GEOSEARCH) to calculate which active user devices fall within the
     * affected zone and should receive push notifications
     */
    radiusInMiles: z.number().positive().max(25).default(5),
    message: z // Provides additional context or safety instructions when expanding alert banner or opening the app detail view
        .string()
        .trim()
        .max(500)
        .optional()
        .transform((value) => (value ? value: undefined))
});

export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;

export const ListNearbyIncidentsSchema = z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    radiusInMiles: z.coerce.number().positive().max(50).default(10),
    limit: z.coerce.number().int().positive().max(100).default(20),

});

export type ListNearbyIncidentsInput = z.infer<typeof ListNearbyIncidentsSchema>;

export const GetIncidentByIdSchema = z.object({id: z.string().cuid()});

export type GetIncidentByIdInput = z.infer<typeof GetIncidentByIdSchema>;

export const AppendIncidentUpdateSchema = z.object({
    updateText: z.string().trim().min(1).max(500),
    severityOverride: z.nativeEnum(IncidentSeverity).optional(), // AI can escalate severity if situation worsens
    radiusExpansionMiles: z.number().positive().max(25).optional(), // AI can expand radius if the situation zone grows
});

export type AppendIncidentUpdateInput = z.infer<typeof AppendIncidentUpdateSchema>;

export const UpdateIncidentStatusSchema = z.object({
    status: z.nativeEnum(IncidentStatus),
    resolutionNotes: z.string().trim().max(500).optional()
});

export type UpdateIncidentStatusInput = z.infer<typeof UpdateIncidentStatusSchema>;
