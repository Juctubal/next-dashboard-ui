"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import { role } from "@/lib/data";
import { Vaccine, Deworming } from "@prisma/client";

// Extend the types to include isArchived
type VaccineWithGamefowl = Vaccine & {
  gamefowl: any;
  isArchived: boolean;
};

type DewormingWithGamefowl = Deworming & {
  gamefowl: any;
  isArchived: boolean;
};

type MedicalListClientProps = {
  data: (VaccineWithGamefowl | DewormingWithGamefowl)[];
  searchParams: { [key: string]: string | undefined };
  count: number;
  type: "vaccine" | "deworming";
};

// Common columns for both vaccine and deworming records
const commonColumns = [
  {
    header: "Record ID",
    accessor: "recordId",
  },
  {
    header: "Gamefowl ID",
    accessor: "gamefowlId",
    className: "hidden md:table-cell",
  },
  {
    header: "Medicine Name",
    accessor: "medName",
    className: "hidden md:table-cell",
  },
  {
    header: "Description",
    accessor: "notes",
    className: "hidden md:table-cell",
  },
  {
    header: "Date Administered",
    accessor: "adminsteredDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const MedicalListClient = ({
  data,
  searchParams,
  count,
  type,
}: MedicalListClientProps) => {
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

  const { page = "1", search = "", showArchived = "false" } = searchParams;
  const isArchived = showArchived === "true";
  const p = parseInt(page);

  // Sort the data based on sortDirection
  const sortedData = [...data].sort((a, b) => {
    if (!sortDirection) return 0;
    const nameA = a.name?.toLowerCase() || "";
    const nameB = b.name?.toLowerCase() || "";
    return sortDirection === "asc"
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  });

  const handleArchiveToggle = async (id: number, archive: boolean) => {
    // If we're archiving (not unarchiving), show a confirmation prompt
    if (archive) {
      const confirmed = window.confirm(
        `Are you sure you want to archive this ${type} record?`
      );
      if (!confirmed) {
        return; // Exit if user cancels
      }
    }

    try {
      const response = await fetch(`/api/medical/${type}/${id}/archive`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isArchived: archive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update archive status");
      }

      // Show success message
      if (archive) {
        alert(`${type} record successfully archived`);
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error updating archive status:", error);
      alert("Failed to update archive status");
    }
  };

  // Render row for vaccine records
  const renderVaccineRow = (item: VaccineWithGamefowl) => (
    <tr
      key={`vaccine-${item.id}`}
      className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
    >
      <td className="p-4 dark:text-gray-200">{item.id}</td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        {item.gamefowlId}
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        {item.name}
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        {item.notes}
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        {new Intl.DateTimeFormat("en-US").format(item.vaccinationDate)}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <button
                className="w-7 h-7 flex items-center justify-center rounded-full bg-ggYellow"
                onClick={() => handleArchiveToggle(item.id, !item.isArchived)}
              >
                <Image
                  src={item.isArchived ? "/unarchive.svg" : "/archive.svg"}
                  alt={item.isArchived ? "Unarchive" : "Archive"}
                  width={16}
                  height={16}
                />
              </button>
              <FormModal table="vaccine" type="update" data={item} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  // Render row for deworming records
  const renderDewormingRow = (item: DewormingWithGamefowl) => (
    <tr
      key={`deworming-${item.id}`}
      className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
    >
      <td className="p-4 dark:text-gray-200">{item.id}</td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        {item.gamefowlId}
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        {item.name}
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        {item.notes}
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        {new Intl.DateTimeFormat("en-US").format(item.dewormDate)}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <button
                className="w-7 h-7 flex items-center justify-center rounded-full bg-ggYellow"
                onClick={() => handleArchiveToggle(item.id, !item.isArchived)}
              >
                <Image
                  src={item.isArchived ? "/unarchive.svg" : "/archive.svg"}
                  alt={item.isArchived ? "Unarchive" : "Archive"}
                  width={16}
                  height={16}
                />
              </button>
              <FormModal table="deworming" type="update" data={item} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold dark:text-gray-200">
          {isArchived
            ? `Archived ${type === "vaccine" ? "Vaccines" : "Deworming"}`
            : `${type === "vaccine" ? "Vaccines" : "Deworming"}`}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end relative">
            {role === "admin" && (
              <Link
                href={`/list/medical?type=${type}&showArchived=${!isArchived}${
                  search ? `&search=${search}` : ""
                }`}
                className={`px-3 py-1 text-sm rounded-md text-center ${
                  isArchived
                    ? "bg-ggPurple text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
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
                    href={`/list/medical?type=all${
                      search ? `&search=${search}` : ""
                    }${showArchived ? `&showArchived=${showArchived}` : ""}`}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    All Records
                  </Link>
                  <Link
                    href={`/list/medical?type=vaccine${
                      search ? `&search=${search}` : ""
                    }${showArchived ? `&showArchived=${showArchived}` : ""}`}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Vaccines
                  </Link>
                  <Link
                    href={`/list/medical?type=deworming${
                      search ? `&search=${search}` : ""
                    }${showArchived ? `&showArchived=${showArchived}` : ""}`}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Deworming
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
              <FormModal
                table={type === "vaccine" ? "vaccine" : "deworming"}
                type="create"
              />
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mt-4">
        <Link
          href={`/list/medical?type=vaccine&showArchived=${isArchived}${
            search ? `&search=${search}` : ""
          }`}
          className={`py-2 px-4 ${
            type === "vaccine"
              ? "border-b-2 border-ggPurple text-ggPurple dark:text-ggPurple font-medium"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Vaccines
        </Link>
        <Link
          href={`/list/medical?type=deworming&showArchived=${isArchived}${
            search ? `&search=${search}` : ""
          }`}
          className={`py-2 px-4 ${
            type === "deworming"
              ? "border-b-2 border-ggPurple text-ggPurple dark:text-ggPurple font-medium"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Deworming
        </Link>
      </div>

      {/* LIST */}
      <Table
        columns={commonColumns}
        renderRow={type === "vaccine" ? renderVaccineRow : renderDewormingRow}
        data={sortedData}
      />

      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default MedicalListClient;
