/*
  Warnings:

  - You are about to drop the `EventParticipant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventParticipant" DROP CONSTRAINT "EventParticipant_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventParticipant" DROP CONSTRAINT "EventParticipant_gamefowlId_fkey";

-- DropTable
DROP TABLE "EventParticipant";

-- CreateTable
CREATE TABLE "EventGamefowl" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "gamefowlId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventGamefowl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventGamefowl_eventId_gamefowlId_key" ON "EventGamefowl"("eventId", "gamefowlId");

-- AddForeignKey
ALTER TABLE "EventGamefowl" ADD CONSTRAINT "EventGamefowl_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGamefowl" ADD CONSTRAINT "EventGamefowl_gamefowlId_fkey" FOREIGN KEY ("gamefowlId") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
