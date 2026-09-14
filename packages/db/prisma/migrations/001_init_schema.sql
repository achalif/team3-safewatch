CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ONLINE', 'OFFLINE', 'IN_TRANSIT', 'EMERGENCY');
CREATE TYPE "Relationship" AS ENUM ('PARENT', 'SPOUSE', 'SIBLING', 'FRIEND', 'OTHER');
CREATE TYPE "IncidentStatus" AS ENUM ('ACTIVE', 'INVESTIGATING', 'RESOLVED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "IncidentCategory" AS ENUM ('CRIME', 'FIRE', 'MEDICAL', 'SEVERE_WEATHER', 'TRAFFIC_HAZARD', 'CIVIL_UNREST', 'OTHER', 'UNCATEGORIZED');

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

CREATE TABLE "Profile" (
  id TEXT PRIMARY KEY,
  "firstName" TEXT,
  "lastName" TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  "lastLocationUpdate" TIMESTAMP(3),
  status "UserStatus" NOT NULL DEFAULT 'OFFLINE',
  "isActiveTracking" BOOLEAN NOT NULL DEFAULT false,
  "batteryLevel" INTEGER,
  "pushToken" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL UNIQUE,
  CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

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

CREATE TABLE "Incident" (
  id TEXT PRIMARY KEY,
  "externalId" TEXT UNIQUE,
  source TEXT,
  title TEXT NOT NULL,
  category "IncidentCategory" NOT NULL DEFAULT 'UNCATEGORIZED',
  description TEXT,
  status "IncidentStatus" NOT NULL DEFAULT 'ACTIVE',
  severity "IncidentSeverity" NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "verifiedAt" TIMESTAMP(3),
  "ttlExpiresAt" TIMESTAMP(3)
);

CREATE TABLE "IncidentUpdate" (
  id TEXT PRIMARY KEY,
  "incidentId" TEXT NOT NULL,
  message TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IncidentUpdate_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"(id) ON DELETE CASCADE
);

CREATE INDEX "Incident_latitude_longitude_idx"
  ON "Incident" (latitude, longitude);

CREATE INDEX "Incident_status_createdAt_idx"
  ON "Incident" (status, "createdAt");

CREATE INDEX "IncidentUpdate_incidentId_createdAt_idx"
  ON "IncidentUpdate" ("incidentId", "createdAt");

CREATE INDEX "EmergencyContact_userId_idx"
  ON "EmergencyContact" ("userId");

CREATE INDEX "Profile_latitude_longitude_idx"
  ON "Profile" (latitude, longitude);
