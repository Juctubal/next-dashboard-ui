import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";

export async function fetchStaffData(searchParams: {
  [key: string]: string | undefined;
}) {
  const {
    search = "",
    status,
    role: staffRole,
    type = "all",
    archive = "false",
  } = searchParams;
  const isArchived = archive === "true";

  // Common filtering logic
  const searchFilter =
    search && search.trim() !== ""
      ? {
          OR: [
            { first_name: { contains: search, mode: "insensitive" } },
            { last_name: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

  // Fetch handlers
  const handlers = await prisma.handler.findMany({
    where: {
      ...(searchFilter as any),
      ...(status ? { status: status as UserStatus } : {}),
      ...(staffRole === "HANDLER" ? { role: UserRole.HANDLER } : {}),
    },
  });

  // Fetch breeders
  const breeders = await prisma.breeder.findMany({
    where: {
      ...(searchFilter as any),
      ...(status ? { status: status as UserStatus } : {}),
      ...(staffRole === "BREEDER" ? { role: UserRole.BREEDER } : {}),
    },
  });

  // Filter based on selected type
  let filteredStaff = [...handlers, ...breeders];
  if (type === "handler") {
    filteredStaff = handlers;
  } else if (type === "breeder") {
    filteredStaff = breeders;
  }

  // For active staff (not archived), we'll show all staff by default
  // For archived staff, we'll only show those explicitly marked as archived
  if (isArchived) {
    // Get IDs of staff explicitly marked as archived
    const archivedStaffIds = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Handler" WHERE "isArchived" = true
      UNION
      SELECT id FROM "Breeder" WHERE "isArchived" = true
    `;

    const archivedIds = new Set(archivedStaffIds.map((staff) => staff.id));

    // Only show staff that are explicitly marked as archived
    filteredStaff = filteredStaff.filter((staff) => archivedIds.has(staff.id));
  } else {
    // For active staff, show all staff that are not explicitly marked as archived
    const archivedStaffIds = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Handler" WHERE "isArchived" = true
      UNION
      SELECT id FROM "Breeder" WHERE "isArchived" = true
    `;

    const archivedIds = new Set(archivedStaffIds.map((staff) => staff.id));

    // Show all staff that are not explicitly marked as archived
    filteredStaff = filteredStaff.filter((staff) => !archivedIds.has(staff.id));
  }

  // Normalize both into a common format
  const combinedStaff = filteredStaff.map((staff) => ({
    ...staff,
    role: staff.role || "UNKNOWN", // fallback if needed
    type: "staff", // so FormModal works generically
  }));

  return combinedStaff;
}
