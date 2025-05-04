/*
  Warnings:

  - The `customDate` column on the `RecurrentSchedules` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "RecurrentSchedules" DROP COLUMN "customDate",
ADD COLUMN     "customDate" JSON;
