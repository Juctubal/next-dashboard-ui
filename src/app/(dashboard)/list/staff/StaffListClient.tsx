"use client";

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { role } from "@/lib/data";
import { Breeder, Handler } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

const renderRow = (
  item: Handler | Breeder,
  isArchived: boolean,
  onArchiveToggle: (id: string, archive: boolean) => void
) => {
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
            <>
              <button
                className="w-7 h-7 flex items-center justify-center rounded-full bg-ggYellow"
                onClick={() => onArchiveToggle(item.id, !isArchived)}
              >
                <Image
                  src={isArchived ? "/unarchive.svg" : "/archive.svg"}
                  alt={isArchived ? "Unarchive" : "Archive"}
                  width={16}
                  height={16}
                />
              </button>
              {/* <FormModal table="teacher" type="delete" id={Number(item.id)} /> */}
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

interface StaffListClientProps {
  data: (Handler | Breeder)[];
  searchParams: { [key: string]: string | undefined };
  userRole?: string;
}

const StaffListClient = ({
  data,
  searchParams,
  userRole,
}: StaffListClientProps) => {
  const router = useRouter();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      setSortDropdownOpen(false);
    }
  };

  const toggleSortDropdown = () => {
    setSortDropdownOpen(!isSortDropdownOpen);
    if (!isSortDropdownOpen) {
      setDropdownOpen(false);
    }
  };

  const {
    page = "1",
    search = "",
    status,
    role: staffRole,
    archive = "false",
  } = searchParams;
  const isArchived = archive === "true";
  const p = parseInt(page);
  const take = ITEM_PER_PAGE;
  const skip = (p - 1) * take;

  // Sort the data based on sortDirection
  const sortedData = [...data].sort((a, b) => {
    if (!sortDirection) return 0;
    const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
    const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
    return sortDirection === "asc"
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  });

  // Pagination (manual)
  const paginated = sortedData.slice(skip, skip + take);
  const totalCount = sortedData.length;

  const handleArchiveToggle = async (id: string, archive: boolean) => {
    // If we're archiving (not unarchiving), show a confirmation prompt
    if (archive) {
      const confirmed = window.confirm(
        "Are you sure you want to archive this staff member?"
      );
      if (!confirmed) {
        return; // Exit if user cancels
      }
    }

    try {
      const response = await fetch(`/api/staff/${id}/archive`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isArchived: archive }),
      });

      if (response.ok) {
        // Show success message
        if (archive) {
          alert("Employee record successfully archived");
        }
        // Refresh the page with the updated archive status
        router.refresh();
      } else {
        console.error("Failed to update archive status");
      }
    } catch (error) {
      console.error("Error updating archive status:", error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          {isArchived ? "Archived Staff" : "Staff"}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end relative">
            {role === "admin" && (
              <Link
                href={`/list/staff?archive=${!isArchived}${
                  search ? `&search=${search}` : ""
                }${status ? `&status=${status}` : ""}${
                  staffRole ? `&role=${staffRole}` : ""
                }`}
                className={`px-3 py-1 text-sm rounded-md text-center ${
                  isArchived
                    ? "bg-ggPurple text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {isArchived ? "Active" : "Archive"}
              </Link>
            )}
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow"
              >
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white shadow-md rounded-md z-10">
                  <Link
                    href={`/list/staff?type=all${
                      search ? `&search=${search}` : ""
                    }${status ? `&status=${status}` : ""}${
                      staffRole ? `&role=${staffRole}` : ""
                    }${archive ? `&archive=${archive}` : ""}`}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    All Staff
                  </Link>
                  <Link
                    href={`/list/staff?type=handler${
                      search ? `&search=${search}` : ""
                    }${status ? `&status=${status}` : ""}${
                      staffRole ? `&role=${staffRole}` : ""
                    }${archive ? `&archive=${archive}` : ""}`}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Handlers
                  </Link>
                  <Link
                    href={`/list/staff?type=breeder${
                      search ? `&search=${search}` : ""
                    }${status ? `&status=${status}` : ""}${
                      staffRole ? `&role=${staffRole}` : ""
                    }${archive ? `&archive=${archive}` : ""}`}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Breeders
                  </Link>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={toggleSortDropdown}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow"
              >
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              {isSortDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white shadow-md rounded-md z-10">
                  <button
                    className="block w-full px-4 py-2 text-gray-700 hover:bg-gray-100 text-left"
                    onClick={() => {
                      setSortDirection("asc");
                      setSortDropdownOpen(false);
                    }}
                  >
                    Name (A-Z)
                  </button>
                  <button
                    className="block w-full px-4 py-2 text-gray-700 hover:bg-gray-100 text-left"
                    onClick={() => {
                      setSortDirection("desc");
                      setSortDropdownOpen(false);
                    }}
                  >
                    Name (Z-A)
                  </button>
                </div>
              )}
            </div>
            {role === "admin" && (
              <div className="flex flex-col gap-2">
                <FormModal table="staff" type="create" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LIST */}
      <Table
        columns={columns}
        renderRow={(item) => renderRow(item, isArchived, handleArchiveToggle)}
        data={paginated}
      />

      {/* PAGINATION */}
      <Pagination page={p} count={totalCount} />
    </div>
  );
};

export default StaffListClient;
