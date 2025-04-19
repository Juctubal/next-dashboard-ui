/*
  Warnings:

  - You are about to drop the column `gamefowlId` on the `Conditioning` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Conditioning" DROP CONSTRAINT "Conditioning_gamefowlId_fkey";

-- AlterTable
ALTER TABLE "Conditioning" DROP COLUMN "gamefowlId";

-- CreateTable
CREATE TABLE "ConditioningGamefowl" (
    "id" SERIAL NOT NULL,
    "conditioningId" INTEGER NOT NULL,
    "gamefowlId" INTEGER NOT NULL,

    CONSTRAINT "ConditioningGamefowl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConditioningGamefowl_conditioningId_gamefowlId_key" ON "ConditioningGamefowl"("conditioningId", "gamefowlId");

-- AddForeignKey
ALTER TABLE "ConditioningGamefowl" ADD CONSTRAINT "ConditioningGamefowl_conditioningId_fkey" FOREIGN KEY ("conditioningId") REFERENCES "Conditioning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditioningGamefowl" ADD CONSTRAINT "ConditioningGamefowl_gamefowlId_fkey" FOREIGN KEY ("gamefowlId") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
