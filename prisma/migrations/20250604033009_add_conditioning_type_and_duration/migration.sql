-- CreateEnum
CREATE TYPE "ConditioningType" AS ENUM ('BROODING', 'BREEDING', 'PRE_CONDITIONING', 'CONDITIONING');

-- AlterTable
ALTER TABLE "ConditioningProgram" ADD COLUMN     "conditioningType" "ConditioningType",
ADD COLUMN     "durationDays" INTEGER;
