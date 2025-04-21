-- CreateTable
CREATE TABLE "ConditioningActivitySchedule" (
    "id" SERIAL NOT NULL,
    "conditioningId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConditioningActivitySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConditioningActivitySchedule_conditioningId_activityId_date_key" ON "ConditioningActivitySchedule"("conditioningId", "activityId", "date");

-- AddForeignKey
ALTER TABLE "ConditioningActivitySchedule" ADD CONSTRAINT "ConditioningActivitySchedule_conditioningId_fkey" FOREIGN KEY ("conditioningId") REFERENCES "Conditioning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditioningActivitySchedule" ADD CONSTRAINT "ConditioningActivitySchedule_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ConditioningActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
