// Dev identity stub: reads the current user from request headers, env var,
// or a fallback. Deliberately naive — replaced with real auth in Week 8.

import {NextResponse} from "next/server";
import { headers } from "next/headers";

const FALLBACK = "demo-user";

export async function currentUserId(): Promise<string> {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEV_IDENTITY) {
    throw new Error(
      "Dev identity stub is disabled in production. (Week 8 replaces this with real auth.)"
    );
  }

  try {
    const h = await headers();
    const idFromHeader = h.get("x-user-id");
    if (idFromHeader) return idFromHeader;
  } catch {
    // Direct Node/test execution does not have a Next request context, so fall
    // back to env vars or a default user instead of crashing the route.
  }

  return process.env.DEV_USER_ID ?? FALLBACK;
}