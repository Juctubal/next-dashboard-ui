-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'HANDLER', 'BREEDER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'RESIGNED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('RECURRING', 'ONETIME');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('FEEDING', 'VACCINATION', 'DEWORMING');

-- CreateEnum
CREATE TYPE "BreedingStatus" AS ENUM ('ONGOING', 'FINISHED');

-- CreateEnum
CREATE TYPE "ConditioningStatus" AS ENUM ('PLANNED', 'ONGOING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "IncubationStatus" AS ENUM ('ONGOING', 'FINISHED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('THREE_COCK_DERBY', 'FOUR_COCK_DERBY', 'FIVE_COCK_DERBY', 'SOLO');

-- CreateEnum
CREATE TYPE "AgeCategory" AS ENUM ('STAG', 'BULLSTAG', 'COCK', 'ANY');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PLANNED', 'ONGOING', 'FINISHED');

-- CreateEnum
CREATE TYPE "RecurrencePattern" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaccine" (
    "id" SERIAL NOT NULL,
    "gamefowlId" INTEGER NOT NULL,
    "vaccinationDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "Vaccine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Breeding" (
    "id" SERIAL NOT NULL,
    "sireId" INTEGER NOT NULL,
    "damId" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "status" "BreedingStatus" NOT NULL,

    CONSTRAINT "Breeding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Elo" (
    "id" SERIAL NOT NULL,
    "gamefowlId" INTEGER NOT NULL,

    CONSTRAINT "Elo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deworming" (
    "id" SERIAL NOT NULL,
    "gamefowlId" INTEGER NOT NULL,
    "dewormDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "Deworming_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sparring" (
    "id" SERIAL NOT NULL,
    "gamefowl_1_Id" INTEGER NOT NULL,
    "gamefowl_2_Id" INTEGER NOT NULL,
    "winnerId" INTEGER NOT NULL,
    "loserId" INTEGER NOT NULL,
    "winner_elo_change" INTEGER NOT NULL,
    "loser_elo_change" INTEGER NOT NULL,
    "sparringDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "Sparring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gamefowl" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "bloodline" TEXT NOT NULL,
    "date_hatched" TIMESTAMP(3),
    "date_sold" TIMESTAMP(3),
    "sireId" INTEGER,
    "damId" INTEGER,
    "batchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gamefowl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OneTimeSched" (
    "id" SERIAL NOT NULL,
    "schedId" INTEGER NOT NULL,
    "taskName" TEXT NOT NULL,
    "taskDate" TIMESTAMP(3) NOT NULL,
    "time_of_day" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OneTimeSched_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditioningProgram" (
    "id" SERIAL NOT NULL,
    "programName" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "ConditioningProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conditioning" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "conProgId" INTEGER NOT NULL,
    "gamefowlId" INTEGER NOT NULL,
    "handlerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ConditioningStatus" NOT NULL,

    CONSTRAINT "Conditioning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" SERIAL NOT NULL,
    "incubate_sched_id" INTEGER NOT NULL,
    "eggCount" INTEGER NOT NULL,
    "fertilityRate" DOUBLE PRECISION NOT NULL,
    "hatchRate" DOUBLE PRECISION NOT NULL,
    "dateHatched" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incubation" (
    "id" SERIAL NOT NULL,
    "incStart" TIMESTAMP(3) NOT NULL,
    "incEnd" TIMESTAMP(3) NOT NULL,
    "turningSched" TIMESTAMP(3) NOT NULL,
    "status" "IncubationStatus" NOT NULL,

    CONSTRAINT "Incubation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" SERIAL NOT NULL,
    "taskName" TEXT NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "taskCategory" "TaskCategory" NOT NULL,
    "descript" TEXT NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Handler" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "img" TEXT,
    "phone" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Handler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Breeder" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "img" TEXT,
    "phone" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Breeder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "ageCategory" "AgeCategory" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL,
    "handlerId" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurrentSchedules" (
    "id" SERIAL NOT NULL,
    "schedId" INTEGER NOT NULL,
    "reccurencePattern" "RecurrencePattern" NOT NULL,
    "taskDate" TIMESTAMP(3) NOT NULL,
    "time_of_day" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurrentSchedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Elo_gamefowlId_key" ON "Elo"("gamefowlId");

-- CreateIndex
CREATE UNIQUE INDEX "Handler_username_key" ON "Handler"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Breeder_username_key" ON "Breeder"("username");

-- AddForeignKey
ALTER TABLE "Vaccine" ADD CONSTRAINT "Vaccine_gamefowlId_fkey" FOREIGN KEY ("gamefowlId") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breeding" ADD CONSTRAINT "Breeding_damId_fkey" FOREIGN KEY ("damId") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breeding" ADD CONSTRAINT "Breeding_sireId_fkey" FOREIGN KEY ("sireId") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Elo" ADD CONSTRAINT "Elo_gamefowlId_fkey" FOREIGN KEY ("gamefowlId") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deworming" ADD CONSTRAINT "Deworming_gamefowlId_fkey" FOREIGN KEY ("gamefowlId") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sparring" ADD CONSTRAINT "Sparring_gamefowl_1_Id_fkey" FOREIGN KEY ("gamefowl_1_Id") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sparring" ADD CONSTRAINT "Sparring_gamefowl_2_Id_fkey" FOREIGN KEY ("gamefowl_2_Id") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sparring" ADD CONSTRAINT "Sparring_loserId_fkey" FOREIGN KEY ("loserId") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sparring" ADD CONSTRAINT "Sparring_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gamefowl" ADD CONSTRAINT "Gamefowl_damId_fkey" FOREIGN KEY ("damId") REFERENCES "Gamefowl"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gamefowl" ADD CONSTRAINT "Gamefowl_sireId_fkey" FOREIGN KEY ("sireId") REFERENCES "Gamefowl"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OneTimeSched" ADD CONSTRAINT "OneTimeSched_schedId_fkey" FOREIGN KEY ("schedId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conditioning" ADD CONSTRAINT "Conditioning_conProgId_fkey" FOREIGN KEY ("conProgId") REFERENCES "ConditioningProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conditioning" ADD CONSTRAINT "Conditioning_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conditioning" ADD CONSTRAINT "Conditioning_gamefowlId_fkey" FOREIGN KEY ("gamefowlId") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conditioning" ADD CONSTRAINT "Conditioning_handlerId_fkey" FOREIGN KEY ("handlerId") REFERENCES "Handler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_incubate_sched_id_fkey" FOREIGN KEY ("incubate_sched_id") REFERENCES "Incubation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_handlerId_fkey" FOREIGN KEY ("handlerId") REFERENCES "Handler"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurrentSchedules" ADD CONSTRAINT "RecurrentSchedules_schedId_fkey" FOREIGN KEY ("schedId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
