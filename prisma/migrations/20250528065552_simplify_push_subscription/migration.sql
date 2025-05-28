/*
  Warnings:

  - You are about to drop the column `userType` on the `PushSubscription` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PushSubscription" DROP CONSTRAINT "PushSubscription_breeder_fkey";

-- DropForeignKey
ALTER TABLE "PushSubscription" DROP CONSTRAINT "PushSubscription_handler_fkey";

-- AlterTable
ALTER TABLE "PushSubscription" DROP COLUMN "userType";

-- DropEnum
DROP TYPE "UserType";
