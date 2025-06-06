-- CreateTable
CREATE TABLE "Vitamin" (
    "id" SERIAL NOT NULL,
    "gamefowlId" INTEGER NOT NULL,
    "administeredDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "name" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Vitamin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" SERIAL NOT NULL,
    "gamefowlId" INTEGER NOT NULL,
    "administeredDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "name" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Vitamin" ADD CONSTRAINT "Vitamin_gamefowlId_fkey" FOREIGN KEY ("gamefowlId") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_gamefowlId_fkey" FOREIGN KEY ("gamefowlId") REFERENCES "Gamefowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
