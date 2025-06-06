-- CreateEnum
CREATE TYPE "SupplementType" AS ENUM ('VACCINE', 'VITAMIN', 'DEWORMING', 'MEDICINE');

-- AlterTable
ALTER TABLE "ConditioningActivity" ADD COLUMN     "supplementType" "SupplementType";
