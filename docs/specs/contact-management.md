---
type: feature
---
# Emergency contacts

## Why
Users need a personal emergency-contact list so a panic flow can notify trusted people quickly and consistently.

## Where it lives
- `apps/web/app/api/v1/contacts/route.ts` — list and create
- `apps/web/app/api/v1/contacts/[id]/route.ts` — update and delete one contact
- `packages/domain/src/queries/contacts.ts`
- `packages/domain/src/zod_schemas/contacts.ts`
- `packages/db/prisma/schema/emergencyContact.prisma`

## Behavior
- The server derives the acting user via the dev identity stub (`x-user-id`, `DEV_USER_ID`, or fallback). No endpoint accepts a user id from the client; every query is scoped to the current user.
- `GET /api/v1/contacts` returns `200` with the current user's contacts (`id`, `firstName`, `lastName`, `phoneNumber`, `email`, `relationship`, `isPrimary`), primary first, then by last name. A user with no contacts gets `[]`.
- `POST /api/v1/contacts` creates one emergency contact for the current user and returns `201` with it.
  - The payload is validated with `createEmergencyContactSchema` before creation.
  - Required fields are `firstName`, `lastName`, `phoneNumber`; `email`, `relationship`, and `isPrimary` are optional (`isPrimary` defaults to `false`).
  - When `isPrimary` is true, any existing primary contact for that user is reset to `false` in the same transaction before the new record is created.
- `PUT /api/v1/contacts/:id` replaces all fields of one of the current user's contacts, validated with `UpdateContactSchema`, and returns `200` with the updated contact.
- `DELETE /api/v1/contacts/:id` removes one of the current user's contacts and returns `204` with no body.
- A contact id that does not exist or belongs to another user returns `404` for both `PUT` and `DELETE`, never `403`.
- Validation failures return `400`. Unknown or invalid auth state returns `401`. Anything unexpected returns `500`.
- Every error has the shape `{ error: { code, message } }`; raw Prisma errors and stack traces never reach the client.

## Examples

| State / input | Behavior |
|---|---|
| `POST` valid payload with `isPrimary: true` | Creates a contact and marks it as the user's primary contact |
| `POST` with an existing primary contact | Old primary is cleared and the new record is created |
| `POST` missing `firstName` or invalid email | Returns 400 and no record is created |
| `GET` for a user with no contacts | Returns 200 with `[]` |
| `GET` for user A | Returns only A's contacts, never another user's |
| `PUT` with a valid body for own contact | Returns 200 with the updated contact |
| `PUT` or `DELETE` with another user's contact id | Returns 404 and nothing changes |
| `DELETE` own contact | Returns 204; the contact no longer appears in `GET` |
| No authenticated user | Returns 401 |

## Verify
- Run `pnpm vitest run tests/integration/contact-create.test.ts`.
- Manual check with `pnpm dev` running: `POST` a contact with `x-user-id: demo-user`, then `GET /api/v1/contacts` with `x-user-id: demo-user` (contact listed) and with `x-user-id: someone-else` (`[]`). `DELETE` that contact's id as `someone-else` returns `404`; as `demo-user` returns `204`.

## Constraints & decisions
- Contact ownership is enforced by filtering every query on both the contact id and the current user id; update and delete use `updateMany`/`deleteMany` so a foreign or missing id affects zero rows and maps to `404`.
- `EmergencyContact` has no unique fields, so adding the same person twice creates two rows; there is no `409` conflict case.
- `PUT` replaces the whole contact. It does not yet clear other primary contacts when `isPrimary` is true, so it can leave a user with more than one primary contact.
- The app currently uses the dev identity stub; production authentication remains a future change.

## Out of scope
- Partial updates (`PATCH`) are not supported; clients send the full contact to `PUT`.
- Bulk notification dispatch and alert-history logic are covered by the alerting feature set.
