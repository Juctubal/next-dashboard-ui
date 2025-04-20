-- AlterTable
ALTER TABLE "Incubation" ADD COLUMN     "breedingId" INTEGER,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Incubation" ADD CONSTRAINT "Incubation_breedingId_fkey" FOREIGN KEY ("breedingId") REFERENCES "Breeding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
