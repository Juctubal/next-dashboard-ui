/*
  Warnings:

  - You are about to drop the column `customInterval` on the `RecurrentSchedules` table. All the data in the column will be lost.
  - Added the required column `loser_elo` to the `Sparring` table without a default value. This is not possible if the table is not empty.
  - Added the required column `winner_elo` to the `Sparring` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "RecurrencePattern" ADD VALUE 'MONTHLY';

-- AlterTable
ALTER TABLE "RecurrentSchedules" DROP COLUMN "customInterval";

-- AlterTable
ALTER TABLE "Sparring" ADD COLUMN     "loser_elo" INTEGER NOT NULL,
ADD COLUMN     "winner_elo" INTEGER NOT NULL;
