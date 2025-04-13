/*
  Warnings:

  - You are about to drop the `Elo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Elo" DROP CONSTRAINT "Elo_gamefowlId_fkey";

-- AlterTable
ALTER TABLE "Gamefowl" ADD COLUMN     "eloRating" INTEGER NOT NULL DEFAULT 1000;

-- DropTable
DROP TABLE "Elo";
