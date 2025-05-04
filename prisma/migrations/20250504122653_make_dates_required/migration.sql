/*
  Warnings:

  - Made the column `endDate` on table `RecurrentSchedules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `startDate` on table `RecurrentSchedules` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RecurrentSchedules" ALTER COLUMN "endDate" SET NOT NULL,
ALTER COLUMN "startDate" SET NOT NULL;
