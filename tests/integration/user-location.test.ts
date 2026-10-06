import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Upstash has no local stand-in (ADR-0012), so @project/redis is replaced with
// an in-memory fake: one location per user, like GEOADD on a single key.
const store = vi.hoisted(() => ({
  locations: new Map<string, { latitude: number; longitude: number }>(),
  fail: false,
}));

// Mocked by file path: the root has no @project/redis dependency, so the bare
// specifier would not resolve to the module the domain package imports.
vi.mock("../../packages/redis/src/index.ts", () => ({
  updateUserLocation: async ({ userId, latitude, longitude }: any) => {
    if (store.fail) throw new Error("upstash: connection refused at https://secret.upstash.io");
    store.locations.set(userId, { latitude, longitude });
    return 1;
  },
  getUserLocation: async (userId: string) => store.locations.get(userId) ?? null,
  getIncidentIdsInRadius: async () => [],
}));

describe("user location", () => {
  let PUT: any;

  const put = (body: unknown) =>
    PUT(
      new Request("http://localhost/api/v1/location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: typeof body === "string" ? body : JSON.stringify(body),
      })
    );

  beforeAll(async () => {
    process.env.PGLITE_DATA_DIR = "memory://";
    delete process.env.DATABASE_URL;
    process.env.DEV_USER_ID = "location-user";

    PUT = (await import("../../apps/web/app/api/v1/location/route")).PUT;
  });

  beforeEach(() => {
    store.locations.clear();
    store.fail = false;
  });

  it("stores the current user's coordinates and returns them", async () => {
    const response = await put({ latitude: 40.7128, longitude: -74.006 });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ latitude: 40.7128, longitude: -74.006 });
    expect(store.locations.get("location-user")).toEqual({ latitude: 40.7128, longitude: -74.006 });
  });

  it("accepts the inclusive boundaries", async () => {
    const response = await put({ latitude: 90, longitude: -180 });

    expect(response.status).toBe(200);
    expect(store.locations.get("location-user")).toEqual({ latitude: 90, longitude: -180 });
  });

  it("replaces the previous location", async () => {
    await put({ latitude: 1, longitude: 1 });
    await put({ latitude: 2, longitude: 2 });

    expect(store.locations.size).toBe(1);
    expect(store.locations.get("location-user")).toEqual({ latitude: 2, longitude: 2 });
  });

  it.each([
    ["latitude above 90", { latitude: 91, longitude: 0 }],
    ["longitude below -180", { latitude: 0, longitude: -180.5 }],
    ["string coordinates", { latitude: "40.7", longitude: 0 }],
    ["missing longitude", { latitude: 40.7 }],
  ])("rejects %s with 400 and stores nothing", async (_, body) => {
    const response = await put(body);

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    expect(store.locations.size).toBe(0);
  });

  it("rejects a malformed JSON body with 400", async () => {
    const response = await put("{bad");

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("returns a generic 500 when the store fails, without leaking the error", async () => {
    store.fail = true;
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await put({ latitude: 40.7128, longitude: -74.006 });
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: { code: "INTERNAL_ERROR", message: "Something went wrong." } });
    expect(JSON.stringify(payload)).not.toContain("upstash");
  });
});
