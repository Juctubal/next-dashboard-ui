-- DropForeignKey
ALTER TABLE "RecurrentSchedules" DROP CONSTRAINT "RecurrentSchedules_schedId_fkey";

-- CreateIndex
CREATE INDEX "RecurrentSchedules_schedId_idx" ON "RecurrentSchedules"("schedId");

-- AddForeignKey
ALTER TABLE "RecurrentSchedules" ADD CONSTRAINT "RecurrentSchedules_schedId_fkey" FOREIGN KEY ("schedId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
