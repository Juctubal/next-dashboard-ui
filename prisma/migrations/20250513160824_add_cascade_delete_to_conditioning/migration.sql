-- DropForeignKey
ALTER TABLE "ConditioningActivitySchedule" DROP CONSTRAINT "ConditioningActivitySchedule_conditioningId_fkey";

-- DropForeignKey
ALTER TABLE "ConditioningGamefowl" DROP CONSTRAINT "ConditioningGamefowl_conditioningId_fkey";

-- AddForeignKey
ALTER TABLE "ConditioningActivitySchedule" ADD CONSTRAINT "ConditioningActivitySchedule_conditioningId_fkey" FOREIGN KEY ("conditioningId") REFERENCES "Conditioning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditioningGamefowl" ADD CONSTRAINT "ConditioningGamefowl_conditioningId_fkey" FOREIGN KEY ("conditioningId") REFERENCES "Conditioning"("id") ON DELETE CASCADE ON UPDATE CASCADE;
