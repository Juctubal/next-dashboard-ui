-- AlterTable
ALTER TABLE "Breeder" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Handler" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;
