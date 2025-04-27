-- CreateTable
CREATE TABLE "RecurringTaskCompletion" (
    "id" SERIAL NOT NULL,
    "recurrentId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringTaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringTaskCompletion_recurrentId_idx" ON "RecurringTaskCompletion"("recurrentId");

-- CreateIndex
CREATE INDEX "RecurringTaskCompletion_date_idx" ON "RecurringTaskCompletion"("date");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringTaskCompletion_recurrentId_date_key" ON "RecurringTaskCompletion"("recurrentId", "date");

-- AddForeignKey
ALTER TABLE "RecurringTaskCompletion" ADD CONSTRAINT "RecurringTaskCompletion_recurrentId_fkey" FOREIGN KEY ("recurrentId") REFERENCES "RecurrentSchedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
