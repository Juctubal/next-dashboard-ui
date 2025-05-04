/*
  Warnings:

  - The values [OTHER] on the enum `RecurrencePattern` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RecurrencePattern_new" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM');
ALTER TABLE "RecurrentSchedules" ALTER COLUMN "reccurencePattern" TYPE "RecurrencePattern_new" USING ("reccurencePattern"::text::"RecurrencePattern_new");
ALTER TYPE "RecurrencePattern" RENAME TO "RecurrencePattern_old";
ALTER TYPE "RecurrencePattern_new" RENAME TO "RecurrencePattern";
DROP TYPE "RecurrencePattern_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Conditioning" DROP CONSTRAINT "Conditioning_eventId_fkey";

-- DropForeignKey
ALTER TABLE "OneTimeSched" DROP CONSTRAINT "OneTimeSched_schedId_fkey";

-- DropForeignKey
ALTER TABLE "RecurrentSchedules" DROP CONSTRAINT "RecurrentSchedules_schedId_fkey";

-- AlterTable
ALTER TABLE "Conditioning" ALTER COLUMN "eventId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "OneTimeSched" ADD CONSTRAINT "OneTimeSched_schedId_fkey" FOREIGN KEY ("schedId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conditioning" ADD CONSTRAINT "Conditioning_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurrentSchedules" ADD CONSTRAINT "RecurrentSchedules_schedId_fkey" FOREIGN KEY ("schedId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
