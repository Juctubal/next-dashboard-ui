/*
  Warnings:

  - You are about to drop the column `middle_name` on the `Breeder` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Breeder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Handler` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Breeder" DROP COLUMN "middle_name",
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'BREEDER',
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Handler" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Breeder_email_key" ON "Breeder"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Handler_email_key" ON "Handler"("email");
