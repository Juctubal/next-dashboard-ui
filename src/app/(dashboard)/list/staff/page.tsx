import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { role } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { Breeder, Handler, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { UserRole, UserStatus } from "@prisma/client";

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Staff ID",
    accessor: "staffId",
    className: "hidden md:table-cell",
  },
  {
    header: "Phone",
    accessor: "phone",
    className: "hidden lg:table-cell",
  },
  {
    header: "Role",
    accessor: "role",
    className: "hidden lg:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const renderRow = (item: Handler | Breeder) => {
  const fullName = `${item.first_name} ${item.last_name}`;
  return (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-ggPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.img || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{fullName}</h3>
          <p className="text-xs text-gray-500">{item.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.id}</td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.role}</td>
      <td className="hidden md:table-cell">{item.status}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/staff/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-ggSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {role === "admin" && (
            <FormModal table="teacher" type="delete" id={Number(item.id)} />
          )}
        </div>
      </td>
    </tr>
  );
};

const StaffListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const {
    page = "1",
    search = "",
    status,
    role: staffRole,
    type = "all",
  } = searchParams;
  const p = parseInt(page);
  const take = ITEM_PER_PAGE;
  const skip = (p - 1) * take;

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

  // Pagination (manual)
  const paginated = combinedStaff.slice(skip, skip + take);
  const totalCount = combinedStaff.length;

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Staff</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormModal table="teacher" type="create" />}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 mt-4">
        <Link
          href={`/list/staff?type=all${search ? `&search=${search}` : ""}${
            status ? `&status=${status}` : ""
          }${staffRole ? `&role=${staffRole}` : ""}`}
          className={`py-2 px-4 ${
            type === "all"
              ? "border-b-2 border-ggPurple text-ggPurple font-medium"
              : "text-gray-500"
          }`}
        >
          All Staff
        </Link>
        <Link
          href={`/list/staff?type=handler${search ? `&search=${search}` : ""}${
            status ? `&status=${status}` : ""
          }${staffRole ? `&role=${staffRole}` : ""}`}
          className={`py-2 px-4 ${
            type === "handler"
              ? "border-b-2 border-ggPurple text-ggPurple font-medium"
              : "text-gray-500"
          }`}
        >
          Handlers
        </Link>
        <Link
          href={`/list/staff?type=breeder${search ? `&search=${search}` : ""}${
            status ? `&status=${status}` : ""
          }${staffRole ? `&role=${staffRole}` : ""}`}
          className={`py-2 px-4 ${
            type === "breeder"
              ? "border-b-2 border-ggPurple text-ggPurple font-medium"
              : "text-gray-500"
          }`}
        >
          Breeders
        </Link>
      </div>

      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={paginated} />

      {/* PAGINATION */}
      <Pagination page={p} count={totalCount} />
    </div>
  );
};

export default StaffListPage;
