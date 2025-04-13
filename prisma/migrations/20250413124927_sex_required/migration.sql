/*
  Warnings:

  - Made the column `age` on table `Gamefowl` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Gamefowl" ALTER COLUMN "age" SET NOT NULL;
