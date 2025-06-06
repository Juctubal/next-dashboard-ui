/*
  Warnings:

  - You are about to drop the column `name` on the `ConditioningActivity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ConditioningActivity" DROP COLUMN "name",
ALTER COLUMN "dosage" DROP NOT NULL,
ALTER COLUMN "indication" DROP NOT NULL;
