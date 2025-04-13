-- CreateEnum
CREATE TYPE "GamefowlSex" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "Gamefowl" ADD COLUMN     "sex" "GamefowlSex";
