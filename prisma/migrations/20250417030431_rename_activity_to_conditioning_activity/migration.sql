/*
  Warnings:

  - You are about to drop the `Activity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_programId_fkey";

-- DropTable
DROP TABLE "Activity";

-- CreateTable
CREATE TABLE "ConditioningActivity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "programId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConditioningActivity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConditioningActivity" ADD CONSTRAINT "ConditioningActivity_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ConditioningProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
