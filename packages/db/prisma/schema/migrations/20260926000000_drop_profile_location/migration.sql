-- DropIndex
DROP INDEX "Profile_latitude_longitude_idx";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "lastLocationUpdate",
DROP COLUMN "latitude",
DROP COLUMN "longitude";
