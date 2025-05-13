-- CreateEnum
CREATE TYPE "Result" AS ENUM ('WIN', 'LOSS', 'DRAW', 'NO_SHOW');

-- CreateTable
CREATE TABLE "EventResult" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "gamefowlId" INTEGER NOT NULL,
    "result" "Result" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventResult_eventId_gamefowlId_key" ON "EventResult"("eventId", "gamefowlId");

-- AddForeignKey
ALTER TABLE "EventResult" ADD CONSTRAINT "EventResult_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventResult" ADD CONSTRAINT "EventResult_gamefowlId_fkey" FOREIGN KEY ("gamefowlId") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
