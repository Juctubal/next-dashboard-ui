/*
  Warnings:

  - Made the column `sex` on table `Gamefowl` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Gamefowl" ALTER COLUMN "age" DROP NOT NULL,
ALTER COLUMN "sex" SET NOT NULL;
