-- DropForeignKey
ALTER TABLE "EventGamefowl" DROP CONSTRAINT "EventGamefowl_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventResult" DROP CONSTRAINT "EventResult_eventId_fkey";

-- AddForeignKey
ALTER TABLE "EventResult" ADD CONSTRAINT "EventResult_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGamefowl" ADD CONSTRAINT "EventGamefowl_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
