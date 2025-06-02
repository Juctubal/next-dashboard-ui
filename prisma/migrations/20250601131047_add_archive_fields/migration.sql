-- AlterTable
ALTER TABLE "Conditioning" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ConditioningProgram" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;
