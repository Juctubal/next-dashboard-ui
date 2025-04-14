-- AlterTable
ALTER TABLE "Vaccine" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Deworming" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false; 