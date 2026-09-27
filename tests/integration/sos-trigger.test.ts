import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("SOS alert trigger", () => {
  let prisma: any;
  let POST: any;

  const sos = (body: unknown) =>
    POST(
      new Request("http://localhost/api/v1/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: typeof body === "string" ? body : JSON.stringify(body),
      })
    );

  beforeAll(async () => {
    // The PGlite door applies the real migrations when the client is created.
    process.env.PGLITE_DATA_DIR = "memory://";
    delete process.env.DATABASE_URL;
    process.env.DEV_USER_ID = "sos-user";

    const dbModule = await import("@project/db");
    const routeModule = await import("../../apps/web/app/api/v1/alerts/route");

    prisma = dbModule.prisma;
    POST = routeModule.POST;
  });

  beforeEach(async () => {
    await prisma.alert.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.create({
      data: {
        id: "sos-user",
        email: "sos-user@example.com",
        phoneNumber: "+15550000001",
        password: "hashed-password",
      },
    });
    await prisma.user.create({
      data: {
        id: "other-user",
        email: "other-user@example.com",
        phoneNumber: "+15550000002",
        password: "hashed-password",
        emergencyContacts: {
          create: { firstName: "Not", lastName: "Mine", phoneNumber: "+15550000099" },
        },
      },
    });
  });

  it("creates an EMERGENCY alert with one pending SMS log per contact of the current user", async () => {
    const mine = await Promise.all(
      ["+15550000010", "+15550000011"].map((phoneNumber) =>
        prisma.emergencyContact.create({
          data: { firstName: "Avery", lastName: "Stone", phoneNumber, userId: "sos-user" },
        })
      )
    );

    const response = await sos({ latitude: 40.7128, longitude: -74.006, message: "Help" });

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.severity).toBe("EMERGENCY");
    expect(payload.audience).toBe("EMERGENCY_CONTACTS");
    expect(payload.status).toBe("ACTIVE");
    expect(payload.body).toContain("40.7128, -74.006");
    expect(payload.body).toContain("Help");

    const logs = await prisma.alertLog.findMany({ where: { alertId: payload.id } });
    expect(logs.map((l: any) => l.emergencyContactId).sort()).toEqual(
      mine.map((c: any) => c.id).sort()
    );
    expect(logs.every((l: any) => l.channel === "SMS" && l.status === "PENDING")).toBe(true);
  });

  it("rejects out-of-range coordinates with 400 and writes nothing", async () => {
    await prisma.emergencyContact.create({
      data: { firstName: "Avery", lastName: "Stone", phoneNumber: "+15550000010", userId: "sos-user" },
    });

    const response = await sos({ latitude: 91, longitude: 0 });

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    expect(await prisma.alert.count()).toBe(0);
  });

  it("rejects a malformed JSON body with 400", async () => {
    const response = await sos("{not json");

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 409 when the current user has no emergency contacts and writes nothing", async () => {
    const response = await sos({ latitude: 40.7128, longitude: -74.006 });

    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("NO_EMERGENCY_CONTACTS");
    expect(await prisma.alert.count()).toBe(0);
    expect(await prisma.alertLog.count()).toBe(0);
  });
});

// Verification for POST flow:
// pnpm vitest run tests/integration/sos-trigger.test.ts
