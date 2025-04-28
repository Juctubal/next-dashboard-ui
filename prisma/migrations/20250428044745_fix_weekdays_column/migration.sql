/*
  Warnings:

  - You are about to drop the column `weekDays` on the `RecurrentSchedules` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RecurrentSchedules" ADD COLUMN IF NOT EXISTS "weekDays" TEXT;
