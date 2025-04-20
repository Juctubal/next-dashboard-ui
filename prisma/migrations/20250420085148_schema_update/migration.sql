/*
  Warnings:

  - You are about to drop the column `eggCount` on the `Batch` table. All the data in the column will be lost.
  - You are about to drop the column `incubate_sched_id` on the `Batch` table. All the data in the column will be lost.
  - Added the required column `incubate_id` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eggCount` to the `Incubation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Batch" DROP CONSTRAINT "Batch_incubate_sched_id_fkey";

-- First, add the new columns as nullable
ALTER TABLE "Batch" DROP COLUMN "eggCount",
DROP COLUMN "incubate_sched_id",
ADD COLUMN "incubate_id" INTEGER;

ALTER TABLE "Incubation" ADD COLUMN "eggCount" INTEGER;

-- Update existing records with default values
-- For Incubation, set eggCount to 0 for existing records
UPDATE "Incubation" SET "eggCount" = 0 WHERE "eggCount" IS NULL;

-- For Batch, we need to create a new Incubation record for each existing Batch
-- and link it to the Batch
INSERT INTO "Incubation" ("incStart", "incEnd", "eggCount", "status")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 'ONGOING'
FROM "Batch"
WHERE "incubate_id" IS NULL;

-- Now update the Batch records to link to the newly created Incubation records
UPDATE "Batch" b
SET "incubate_id" = i.id
FROM "Incubation" i
WHERE b."incubate_id" IS NULL
AND i.id = (SELECT MAX(id) FROM "Incubation" WHERE "eggCount" = 0);

-- Now make the columns required
ALTER TABLE "Batch" ALTER COLUMN "incubate_id" SET NOT NULL;
ALTER TABLE "Incubation" ALTER COLUMN "eggCount" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_incubate_id_fkey" FOREIGN KEY ("incubate_id") REFERENCES "Incubation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
