---
type: feature
---
# A user can trigger an SOS alert to their emergency contacts

## Why
When a user is in danger they need one action that tells every trusted
person on their emergency-contact list where they are, without typing a
message or choosing recipients under stress.

## Where it lives
- `apps/web/app/api/v1/alerts/route.ts`
- `packages/domain/src/queries/alerts.ts` (`triggerSosAlert`)
- `packages/domain/src/zod_schemas/alerts.ts` (`triggerSosAlertSchema`, `NoEmergencyContactsError`)
- `packages/db/prisma/schema/alerts.prisma` (`Alert`, `AlertLog`)
- `packages/db/prisma/schema/emergencyContact.prisma`

## Behavior
- `POST /api/v1/alerts` triggers one SOS alert for the current user.
- The server derives the acting user via the identity seam (see
  [auth](../auth.md)); the client never supplies a user id or a recipient list.
- The payload is validated with a shared Zod schema: `latitude` (−90 to 90)
  and `longitude` (−180 to 180) are required numbers; `message` is optional,
  trimmed, at most 500 characters, and an empty string is treated as absent.
- Recipients are every emergency contact owned by the current user. Other users' contacts are not read.
- One `Alert` is created with `severity: EMERGENCY`, `audience:
  EMERGENCY_CONTACTS`, `status: ACTIVE`, and no linked incident. Its body
  states the coordinates, a map link, and the user's message when present.
- One `AlertLog` is created per recipient contact with `channel: SMS` and
  `status: PENDING`.
- The `Alert` and all of its `AlertLog` rows are written in one transaction:
  either every row exists or none does.
- Success returns `201` with the alert and its delivery logs.
- A user with no emergency contacts gets `409` with code
  `NO_EMERGENCY_CONTACTS`, and nothing is written.
- Validation failures and malformed JSON return `400` with
  `{ error: { code, message } }`, and nothing is written.
- Unknown or invalid auth state returns `401`.
- Raw Prisma errors and stack traces never reach the client.

## Examples

| State / input | Behavior |
|---|---|
| User has 2 contacts; `{ latitude: 40.7128, longitude: -74.006 }` | 201; one EMERGENCY alert, 2 SMS logs in PENDING, body contains `40.7128, -74.006` |
| Another user also has contacts | Only the current user's contacts receive logs |
| `{ latitude: 91, longitude: 0 }` | 400 `VALIDATION_ERROR`; no alert written |
| Body is not JSON | 400 `VALIDATION_ERROR`; no alert written |
| User has 0 contacts | 409 `NO_EMERGENCY_CONTACTS`; no alert written |
| `message: ""` | Treated as absent; body has coordinates only |

## Verify
- Run `pnpm vitest run tests/integration/sos-trigger.test.ts`.
- Manual check with `pnpm dev` running and a seeded user who has at least one
  contact:
  `curl -X POST localhost:3000/api/v1/alerts -H "content-type: application/json" -H "x-user-id: <id>" -d '{"latitude":40.7128,"longitude":-74.006}'`
  returns `201` and one log per contact.

## Constraints & decisions
- The route records delivery intent only (`PENDING` logs); it does not send
  SMS or push itself, so a slow or failing provider can never block or fail
  the SOS request.
- The `Alert` table has no sender or coordinate columns, so the sender is
  implied by the recipients' owning user and the coordinates live in the
  alert body. Adding either column is a schema change and a spec change.
- An SOS with zero contacts is rejected rather than stored, because no row
  could attribute it to the user and no one would be notified.
- Contacts are notified by `SMS` because they are not app users and have no
  push token.
- No rate limiting or de-duplication: repeated presses create repeated alerts.

## Out of scope
- Actually dispatching SMS/push and moving logs past `PENDING` — worker
  behavior, no spec yet.
- Setting the user's `Profile.status` to `EMERGENCY` and live location
  streaming — no spec yet.
- Cancelling or resolving an SOS alert, and alert history listing — no spec
  yet.
- Managing the contact list — see [contact-management](../contact-management.md).
