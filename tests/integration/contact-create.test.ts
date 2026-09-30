import { beforeAll, describe, expect, it } from "vitest";

describe("emergency contacts creation", () => {
  let prisma: any;
  let POST: any;

  beforeAll(async () => {
    process.env.PGLITE_DATA_DIR = "memory://";
    delete process.env.DATABASE_URL;
    process.env.DEV_USER_ID = "contact-user";

    const dbModule = await import("@project/db");
    const routeModule = await import("../../apps/web/app/api/v1/contacts/route");

    prisma = dbModule.prisma;
    POST = routeModule.POST;

    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now()
    )`;

    const migrationName = "001_contact_schema_init.sql";
    const alreadyApplied = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM _migrations WHERE name = ${migrationName}
    `;

    if (alreadyApplied.length === 0) {
      await prisma.$executeRawUnsafe(`CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');`);
      await prisma.$executeRawUnsafe(
        `CREATE TYPE "Relationship" AS ENUM ('PARENT', 'SPOUSE', 'SIBLING', 'FRIEND', 'OTHER');`
      );

      await prisma.$executeRawUnsafe(`
        CREATE TABLE "User" (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          "phoneNumber" TEXT NOT NULL UNIQUE,
          role "Role" NOT NULL DEFAULT 'USER',
          password TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
          "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE "EmergencyContact" (
          id TEXT PRIMARY KEY,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          "phoneNumber" TEXT NOT NULL,
          email TEXT,
          relationship "Relationship",
          notified BOOLEAN NOT NULL DEFAULT false,
          "isPrimary" BOOLEAN NOT NULL DEFAULT false,
          "userId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(
        `CREATE INDEX "EmergencyContact_userId_idx" ON "EmergencyContact" ("userId");`
      );

      await prisma.$executeRaw`INSERT INTO _migrations (name) VALUES (${migrationName})`;
    }

    await prisma.user.deleteMany();
    await prisma.user.create({
      data: {
        id: "contact-user",
        email: "contact-user@example.com",
        phoneNumber: "+15550000001",
        password: "hashed-password",
      },
    });
  });

  it("creates a primary emergency contact for the current user", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: "Avery",
          lastName: "Stone",
          phoneNumber: "+15550000099",
          email: "avery@example.com",
          relationship: "SPOUSE",
          isPrimary: true,
        }),
      })
    );

    expect(response.status).toBe(201);

    const payload = await response.json();
    expect(payload.firstName).toBe("Avery");
    expect(payload.lastName).toBe("Stone");
    expect(payload.userId).toBe("contact-user");
    expect(payload.isPrimary).toBe(true);

    const saved = await prisma.emergencyContact.findFirst({
      where: { userId: "contact-user" },
      orderBy: { createdAt: "desc" },
    });

    expect(saved?.firstName).toBe("Avery");
    expect(saved?.phoneNumber).toBe("+15550000099");
  });
});

// Verification for POST flow:
// pnpm vitest run tests/integration/contact-create.test.ts