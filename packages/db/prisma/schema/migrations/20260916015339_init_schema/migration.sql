-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('EMERGENCY', 'CRITICAL', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "AlertLifecycleStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "DeliveryChannel" AS ENUM ('PUSH', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "TargetAudience" AS ENUM ('ALL_USERS', 'GEOFENCED_ZONE', 'EMERGENCY_CONTACTS');

-- CreateEnum
CREATE TYPE "Relationship" AS ENUM ('PARENT', 'SPOUSE', 'SIBLING', 'FRIEND', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('ACTIVE', 'INVESTIGATING', 'RESOLVED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentCategory" AS ENUM ('CRIME', 'FIRE', 'MEDICAL', 'SEVERE_WEATHER', 'TRAFFIC_HAZARD', 'CIVIL_UNREST', 'OTHER', 'UNCATEGORIZED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ONLINE', 'OFFLINE', 'IN_TRANSIT', 'EMERGENCY');

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "AlertLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "severity" "AlertSeverity" NOT NULL DEFAULT 'WARNING',
    "audience" "TargetAudience" NOT NULL DEFAULT 'GEOFENCED_ZONE',
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "userId" TEXT,
    "emergencyContactId" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "channel" "DeliveryChannel" NOT NULL DEFAULT 'PUSH',
    "failureReason" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT,
    "relationship" "Relationship",
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "source" TEXT,
    "title" TEXT NOT NULL,
    "category" "IncidentCategory" NOT NULL DEFAULT 'UNCATEGORIZED',
    "description" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'ACTIVE',
    "severity" "IncidentSeverity" NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "ttlExpiresAt" TIMESTAMP(3),

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentUpdate" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "lastLocationUpdate" TIMESTAMP(3),
    "status" "UserStatus" NOT NULL DEFAULT 'OFFLINE',
    "isActiveTracking" BOOLEAN NOT NULL DEFAULT false,
    "batteryLevel" INTEGER,
    "pushToken" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertLog_userId_readAt_idx" ON "AlertLog"("userId", "readAt");

-- CreateIndex
CREATE INDEX "AlertLog_alertId_idx" ON "AlertLog"("alertId");

-- CreateIndex
CREATE INDEX "AlertLog_emergencyContactId_idx" ON "AlertLog"("emergencyContactId");

-- CreateIndex
CREATE INDEX "EmergencyContact_userId_idx" ON "EmergencyContact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_externalId_key" ON "Incident"("externalId");

-- CreateIndex
CREATE INDEX "Incident_latitude_longitude_idx" ON "Incident"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Incident_status_createdAt_idx" ON "Incident"("status", "createdAt");

-- CreateIndex
CREATE INDEX "IncidentUpdate_incidentId_createdAt_idx" ON "IncidentUpdate"("incidentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_latitude_longitude_idx" ON "Profile"("latitude", "longitude");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_emergencyContactId_fkey" FOREIGN KEY ("emergencyContactId") REFERENCES "EmergencyContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentUpdate" ADD CONSTRAINT "IncidentUpdate_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
