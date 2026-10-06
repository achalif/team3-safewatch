# ADR-0012: Upstash Redis as a cloud dependency with no local stand-in

## Status

Proposed

## Context

Live user locations and the incident spatial index live in Redis, using its
geospatial commands (`GEOADD`, `GEOPOS`, `GEOSEARCH`). `packages/redis/`
reaches Redis through the Upstash HTTP client (`@upstash/redis`), configured
by `Redis.fromEnv()`.

The project contract is that everything runs locally with no cloud account
(AGENTS.md, [seams.md](../specs/seams.md)): every cloud dependency has a
local stand-in by default, one environment variable away from production.
Upstash has no official local emulator for its HTTP API, so `packages/redis/`
has no stand-in. Building one (a local Redis plus an HTTP proxy, or a second
client behind a common interface) is real work that would delay the location,
SOS, and nearby-incident features that depend on Redis.

## Decision

Keep Upstash Redis and accept it as the one cloud dependency without a local
stand-in, for now.

- `packages/redis/` keeps using `@upstash/redis` with `Redis.fromEnv()`,
  which reads `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- Each developer who runs features that touch Redis needs those two values,
  either from a free personal Upstash database or from a shared team
  development database. Production uses its own database.
- Integration tests do not reach Upstash. Tests that exercise code calling
  `@project/redis` replace that module with an in-memory fake, so `pnpm test`
  still needs no services and no account.
- Routes that write to Redis return `500` `INTERNAL_ERROR` when Upstash is
  unreachable or unconfigured; the raw error is logged, never returned.

## Consequences

- **Easier**: no stand-in to build or maintain; the location, SOS, and
  nearby-incident features can proceed now; dev and production use the same
  client and the same commands.
- **Harder**: a fresh clone cannot exercise Redis-backed features without an
  Upstash account, which breaks the "no cloud account" promise for those
  features; this seam needs two environment variables, not one; offline
  development of those features is not possible.
- **Accepted tradeoff**: tests cover Redis-backed code against a fake, so
  behavior that differs between the fake and real Upstash (precision of geo
  coordinates, command edge cases) is only caught by a manual run against
  Upstash.
- **Revisit when**: a teammate is blocked by needing an account, or a local
  option for the Upstash HTTP API becomes practical. A superseding ADR would
  add the stand-in and restore the default seam shape.

## See also

- [seams.md](../specs/seams.md) — the seam pattern this ADR is an exception to.
- [ADR-0008](0008-azurite-seam.md) — the Azurite seam, the shape a future
  Redis stand-in would follow.
