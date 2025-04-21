/*
  Warnings:

  - Added the required column `updatedAt` to the `ConditioningActivitySchedule` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ConditioningActivitySchedule_conditioningId_activityId_date_key";

-- AlterTable
ALTER TABLE "Conditioning" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "ConditioningActivitySchedule" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PLANNED',
ADD COLUMN     "timeOfDay" TEXT NOT NULL DEFAULT 'MORNING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "ConditioningActivitySchedule_conditioningId_idx" ON "ConditioningActivitySchedule"("conditioningId");

-- CreateIndex
CREATE INDEX "ConditioningActivitySchedule_activityId_idx" ON "ConditioningActivitySchedule"("activityId");
