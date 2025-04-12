-- CreateEnum
CREATE TYPE "gamefowlAge" AS ENUM ('CHICK', 'STAG', 'BULLSTAG', 'COCK');

-- AlterTable
ALTER TABLE "Gamefowl" ADD COLUMN     "age" "gamefowlAge";
