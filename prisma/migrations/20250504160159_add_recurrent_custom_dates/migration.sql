-- CreateTable
CREATE TABLE "RecurrentCustomDate" (
    "id" SERIAL NOT NULL,
    "recurrentId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurrentCustomDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurrentCustomDate_recurrentId_idx" ON "RecurrentCustomDate"("recurrentId");

-- CreateIndex
CREATE INDEX "RecurrentCustomDate_date_idx" ON "RecurrentCustomDate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "RecurrentCustomDate_recurrentId_date_key" ON "RecurrentCustomDate"("recurrentId", "date");

-- AddForeignKey
ALTER TABLE "RecurrentCustomDate" ADD CONSTRAINT "RecurrentCustomDate_recurrentId_fkey" FOREIGN KEY ("recurrentId") REFERENCES "RecurrentSchedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
