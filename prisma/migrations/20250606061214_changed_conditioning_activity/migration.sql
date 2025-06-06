/*
  Warnings:

  - You are about to drop the column `description` on the `ConditioningActivity` table. All the data in the column will be lost.
  - Added the required column `ageDay` to the `ConditioningActivity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dosage` to the `ConditioningActivity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `indication` to the `ConditioningActivity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplements` to the `ConditioningActivity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConditioningActivity" DROP COLUMN "description",
ADD COLUMN     "ageDay" TEXT NOT NULL,
ADD COLUMN     "dosage" TEXT NOT NULL,
ADD COLUMN     "indication" TEXT NOT NULL,
ADD COLUMN     "supplements" TEXT NOT NULL;
