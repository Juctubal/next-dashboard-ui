/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `PushSubscription` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('HANDLER', 'BREEDER');

-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'HANDLER';

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_userId_key" ON "PushSubscription"("userId");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_handler_fkey" FOREIGN KEY ("userId") REFERENCES "Handler"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_breeder_fkey" FOREIGN KEY ("userId") REFERENCES "Breeder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
