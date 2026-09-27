---
type: feature
---
# Emergency contacts

## Why
Users need a personal emergency-contact list so a panic flow can notify trusted people quickly and consistently.

## Where it lives
- `apps/web/app/api/v1/contacts/route.ts`
- `packages/domain/src/index.ts`
- `packages/db/prisma/schema/emergencyContact.prisma`

## Behavior
- `POST /api/v1/contacts` creates one emergency contact for the current user.
- The server derives the acting user via the dev identity stub (`x-user-id`, `DEV_USER_ID`, or fallback) and scopes every insert to that user.
- The payload is validated with a shared Zod schema before creation.
- Required fields are `firstName`, `lastName`, `phoneNumber`; `email`, `relationship`, and `isPrimary` are optional and default appropriately.
- When `isPrimary` is true, any existing primary contact for that user is reset to `false` in the same transaction before the new record is created.
- Validation failures return `400` with `{ error: { code, message } }`.
- Unknown or invalid auth state returns `401`.
- Duplicate identifiers or conflicting writes return `409`.
- The route never exposes raw Prisma or stack traces to the client.

## Examples

| State / input | Behavior |
|---|---|
| Valid payload with `isPrimary: true` | Creates a contact and marks it as the user's primary contact |
| Missing `firstName` or invalid email | Returns 400 and no record is created |
| No authenticated user | Returns 401 |
| Existing primary contact already set | Old primary is cleared and new record is created |

## Verify
- Run `pnpm vitest run tests/integration/contact-create.test.ts`.
- Optional manual check: send a valid POST to `/api/v1/contacts` with a `x-user-id` header and confirm a `201` response and persisted row.

## Constraints & decisions
- This endpoint only covers creating a contact; listing, updating, and deleting are out of scope for this feature.
- Contact ownership is enforced by the current user id; foreign resources are not exposed.
- The app currently uses the dev identity stub; production authentication remains a future change.

## Out of scope
- Contact editing or deletion flows are not included here.
- Bulk notification dispatch and alert-history logic are covered by the alerting feature set.
