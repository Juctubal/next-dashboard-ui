/*
  Warnings:

  - The values [PLANNED,ONGOING] on the enum `ConditioningStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PLANNED,ONGOING] on the enum `EventStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [MONTHLY] on the enum `RecurrencePattern` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `loser_elo` on the `Sparring` table. All the data in the column will be lost.
  - You are about to drop the column `winner_elo` on the `Sparring` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ConditioningStatus_new" AS ENUM ('ASSIGNED', 'COMPLETED');
ALTER TABLE "Conditioning" ALTER COLUMN "status" TYPE "ConditioningStatus_new" USING ("status"::text::"ConditioningStatus_new");
ALTER TYPE "ConditioningStatus" RENAME TO "ConditioningStatus_old";
ALTER TYPE "ConditioningStatus_new" RENAME TO "ConditioningStatus";
DROP TYPE "ConditioningStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EventStatus_new" AS ENUM ('ASSIGNED', 'FINISHED');
ALTER TABLE "Schedule" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Schedule" ALTER COLUMN "status" TYPE "EventStatus_new" USING ("status"::text::"EventStatus_new");
ALTER TABLE "Event" ALTER COLUMN "status" TYPE "EventStatus_new" USING ("status"::text::"EventStatus_new");
ALTER TYPE "EventStatus" RENAME TO "EventStatus_old";
ALTER TYPE "EventStatus_new" RENAME TO "EventStatus";
DROP TYPE "EventStatus_old";
ALTER TABLE "Schedule" ALTER COLUMN "status" SET DEFAULT 'ASSIGNED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RecurrencePattern_new" AS ENUM ('DAILY', 'WEEKLY', 'OTHER');
ALTER TABLE "RecurrentSchedules" ALTER COLUMN "reccurencePattern" TYPE "RecurrencePattern_new" USING ("reccurencePattern"::text::"RecurrencePattern_new");
ALTER TYPE "RecurrencePattern" RENAME TO "RecurrencePattern_old";
ALTER TYPE "RecurrencePattern_new" RENAME TO "RecurrencePattern";
DROP TYPE "RecurrencePattern_old";
COMMIT;

-- AlterTable
ALTER TABLE "RecurrentSchedules" ADD COLUMN     "customInterval" INTEGER;

-- AlterTable
ALTER TABLE "Schedule" ALTER COLUMN "status" SET DEFAULT 'ASSIGNED';

-- AlterTable
ALTER TABLE "Sparring" DROP COLUMN "loser_elo",
DROP COLUMN "winner_elo";
