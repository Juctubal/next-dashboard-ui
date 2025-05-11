-- CreateEnum
CREATE TYPE "GamefowlStatus" AS ENUM ('IDLE', 'COMPETING', 'BREEDING', 'CONDITIONING', 'INJURED', 'DECEASED', 'SOLD');

-- AlterTable
ALTER TABLE "Gamefowl" ADD COLUMN     "status" "GamefowlStatus" NOT NULL DEFAULT 'IDLE';
