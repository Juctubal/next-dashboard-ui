/*
  Warnings:

  - You are about to drop the column `eloRating` on the `Elo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Elo" DROP COLUMN "eloRating",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
