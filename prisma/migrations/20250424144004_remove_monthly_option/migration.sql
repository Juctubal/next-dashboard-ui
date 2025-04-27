/*
  Warnings:

  - The values [MONTHLY] on the enum `RecurrencePattern` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `monthDay` on the `RecurrentSchedules` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RecurrencePattern_new" AS ENUM ('DAILY', 'WEEKLY', 'OTHER');
ALTER TABLE "RecurrentSchedules" ALTER COLUMN "reccurencePattern" TYPE "RecurrencePattern_new" USING ("reccurencePattern"::text::"RecurrencePattern_new");
ALTER TYPE "RecurrencePattern" RENAME TO "RecurrencePattern_old";
ALTER TYPE "RecurrencePattern_new" RENAME TO "RecurrencePattern";
DROP TYPE "RecurrencePattern_old";
COMMIT;

-- AlterTable
ALTER TABLE "RecurrentSchedules" DROP COLUMN "monthDay";
