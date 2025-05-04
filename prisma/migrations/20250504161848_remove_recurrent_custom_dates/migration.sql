/*
  Warnings:

  - You are about to drop the `RecurrentCustomDate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RecurrentCustomDate" DROP CONSTRAINT "RecurrentCustomDate_recurrentId_fkey";

-- DropTable
DROP TABLE "RecurrentCustomDate";
