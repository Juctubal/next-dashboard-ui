import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import MedicalListClient from "./MedicalListClient";
import { Prisma } from "@prisma/client";

export default async function MedicalListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const user = await currentUser();
  const {
    page = "1",
    search = "",
    type = "vaccine",
    showArchived = "false",
  } = searchParams;

  const isArchived = showArchived === "true";
  const p = parseInt(page);
  const pageSize = 10;
  const skip = (p - 1) * pageSize;

  // Build the where clause based on search and archive status
  const whereClause: Prisma.VaccineWhereInput & Prisma.DewormingWhereInput = {
    AND: [
      {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { notes: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { gamefowl: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
        ],
      },
      { isArchived },
    ],
  };

  // Get vaccine records
  const vaccines = await prisma.vaccine.findMany({
    where: type === "all" || type === "vaccine" ? whereClause : undefined,
    include: {
      gamefowl: true,
    },
    orderBy: {
      vaccinationDate: "desc",
    },
    skip,
    take: pageSize,
  });

  // Get deworming records
  const dewormings = await prisma.deworming.findMany({
    where: type === "all" || type === "deworming" ? whereClause : undefined,
    include: {
      gamefowl: true,
    },
    orderBy: {
      dewormDate: "desc",
    },
    skip,
    take: pageSize,
  });

  // Get total count for pagination
  const vaccineCount = await prisma.vaccine.count({
    where: type === "all" || type === "vaccine" ? whereClause : undefined,
  });

  const dewormingCount = await prisma.deworming.count({
    where: type === "all" || type === "deworming" ? whereClause : undefined,
  });

  const totalCount =
    type === "all"
      ? vaccineCount + dewormingCount
      : type === "vaccine"
      ? vaccineCount
      : dewormingCount;

  // Filter records based on type
  let records = [];
  if (type === "vaccine") {
    records = vaccines;
  } else if (type === "deworming") {
    records = dewormings;
  } else {
    // For "all" type, combine and sort records
    records = [...vaccines, ...dewormings].sort((a, b) => {
      const dateA = "vaccinationDate" in a ? a.vaccinationDate : a.dewormDate;
      const dateB = "vaccinationDate" in b ? b.vaccinationDate : b.dewormDate;
      return dateB.getTime() - dateA.getTime();
    });
  }

  return (
    <MedicalListClient
      data={records}
      searchParams={searchParams}
      count={totalCount}
      type={type as "vaccine" | "deworming"}
    />
  );
}
