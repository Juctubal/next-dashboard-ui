import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";

export async function fetchStaffData(searchParams: {
  [key: string]: string | undefined;
}) {
  const { search = "", status, role: staffRole, type = "all" } = searchParams;

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

  // Normalize both into a common format
  const combinedStaff = filteredStaff.map((staff) => ({
    ...staff,
    role: staff.role || "UNKNOWN", // fallback if needed
    type: "staff", // so FormModal works generically
  }));

  return combinedStaff;
}
