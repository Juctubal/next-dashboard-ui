/*
  Warnings:

  - The values [OWNER,HANDLER,BREEDER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('admin', 'owner', 'breeder');
ALTER TABLE "Breeder" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Schedule" ALTER COLUMN "staffType" TYPE "UserRole_new" USING ("staffType"::text::"UserRole_new");
ALTER TABLE "Handler" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TABLE "Breeder" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "Breeder" ALTER COLUMN "role" SET DEFAULT 'breeder';
COMMIT;

-- AlterTable
ALTER TABLE "Breeder" ALTER COLUMN "role" SET DEFAULT 'breeder';
