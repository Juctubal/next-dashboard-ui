"use client";

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { role } from "@/lib/data";
import { Gamefowl } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { useState, useEffect } from "react";
import { calculateGamefowlAge } from "@/lib/utils";
import { useRouter } from "next/navigation";

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Gamefowl ID",
    accessor: "gamefowId",
    className: "hidden md:table-cell",
  },
  {
    header: "Sire ID",
    accessor: "sireId",
    className: "hidden md:table-cell",
  },
  {
    header: "Dam ID",
    accessor: "damId",
    className: "hidden lg:table-cell",
  },
  {
    header: "Batch ID",
    accessor: "batchId",
    className: "hidden lg:table-cell",
  },
  {
    header: "Age Classification",
    accessor: "age",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const renderRow = (
  item: Gamefowl,
  isArchived: boolean,
  onArchiveToggle: (id: number, archive: boolean) => void
) => (
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
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-xs text-gray-500">{item.bloodline}</p>
      </div>
    </td>
    <td className="hidden md:table-cell">{item.id}</td>
    <td className="hidden md:table-cell">{item.sireId}</td>
    <td className="hidden md:table-cell">{item.damId}</td>
    <td className="hidden md:table-cell">{item.batchId}</td>
    <td className="hidden md:table-cell">
      {calculateGamefowlAge(item.date_hatched)}
    </td>
    <td>
      <div className="flex items-center gap-2">
        <Link href={`/list/gamefowls/${item.id}`}>
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
            {/* <FormModal table="gamefowl" type="delete" id={item.id} /> */}
          </>
        )}
      </div>
    </td>
  </tr>
);

interface GamefowlListClientProps {
  data: Gamefowl[];
  searchParams: { [key: string]: string | undefined };
  userRole?: string;
}

const GamefowlListClient = ({
  data,
  searchParams,
  userRole,
}: GamefowlListClientProps) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const router = useRouter();

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

  const { page = "1", search = "", age, showArchived = "false" } = searchParams;
  const isArchived = showArchived === "true";
  const p = parseInt(page);
  const take = ITEM_PER_PAGE;
  const skip = (p - 1) * take;

  // Initialize selected ages from URL params
  useEffect(() => {
    if (age) {
      setSelectedAges(age.split(","));
    } else {
      setSelectedAges([]);
    }
  }, [age]);

  const handleAgeChange = (ageValue: string) => {
    let newSelectedAges: string[];

    if (ageValue === "all") {
      // If "All" is selected, clear other selections
      newSelectedAges = selectedAges.includes("all") ? [] : ["all"];
    } else {
      // Remove 'all' if it was previously selected
      const filteredAges = selectedAges.filter((a) => a !== "all");

      if (selectedAges.includes(ageValue)) {
        // Remove the age if it's already selected
        newSelectedAges = filteredAges.filter((a) => a !== ageValue);
      } else {
        // Add the age if it's not selected
        newSelectedAges = [...filteredAges, ageValue];
      }

      // If no ages are selected, select 'all'
      if (newSelectedAges.length === 0) {
        newSelectedAges = ["all"];
      }
    }

    setSelectedAges(newSelectedAges);

    // Update URL with selected ages
    const ageParam = newSelectedAges.includes("all")
      ? ""
      : newSelectedAges.join(",");
    const searchParam = search ? `&search=${search}` : "";
    const pageParam = page ? `&page=${page}` : "";
    const archivedParam = showArchived === "true" ? `&showArchived=true` : "";

    router.push(
      `/list/gamefowls?${
        ageParam ? `age=${ageParam}` : ""
      }${searchParam}${pageParam}${archivedParam}`
    );
  };

  const toggleArchived = () => {
    const newShowArchived = showArchived === "true" ? "false" : "true";
    const ageParam = age ? `age=${age}` : "";
    const searchParam = search ? `&search=${search}` : "";
    const pageParam = page ? `&page=${page}` : "";

    router.push(
      `/list/gamefowls?${ageParam}${searchParam}${pageParam}&showArchived=${newShowArchived}`
    );
  };

  const handleArchiveToggle = async (id: number, archive: boolean) => {
    // If we're archiving (not unarchiving), show a confirmation prompt
    if (archive) {
      const confirmed = window.confirm(
        "Are you sure you want to archive this gamefowl?"
      );
      if (!confirmed) {
        return; // Exit if user cancels
      }
    }

    try {
      const response = await fetch(`/api/gamefowl/${id}/archive`, {
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
        alert("Gamefowl record successfully archived");
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error updating archive status:", error);
      alert("Failed to update archive status");
    }
  };

  // Filter data based on age classification
  const filteredData = data.filter((gamefowl) => {
    if (selectedAges.length === 0 || selectedAges.includes("all")) return true;

    const gamefowlAge = calculateGamefowlAge(gamefowl.date_hatched);
    return selectedAges.includes(gamefowlAge || "");
  });

  // Sort the data based on sortDirection
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortDirection) return 0;
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    return sortDirection === "asc"
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  });

  // Use the data directly without additional pagination
  // The server has already paginated the data
  const displayData = sortedData;

  // Get the total count from the URL params if available
  const totalCount = searchParams.count
    ? parseInt(searchParams.count)
    : data.length;

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          {isArchived ? "Archived Gamefowls" : "All Gamefowls"}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {role === "admin" && (
            <Link
              href={`/list/gamefowls?showArchived=${!isArchived}${
                search ? `&search=${search}` : ""
              }${age ? `&age=${age}` : ""}`}
              className={`px-3 py-1 text-sm rounded-md text-center ${
                isArchived
                  ? "bg-ggPurple text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {isArchived ? "Active" : "Archive"}
            </Link>
          )}
          <TableSearch />
          <div className="flex items-center gap-4 self-end relative">
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow"
              >
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white shadow-md rounded-md z-10 w-48">
                  <div className="p-2">
                    <div className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        id="all"
                        checked={
                          selectedAges.includes("all") ||
                          selectedAges.length === 0
                        }
                        onChange={() => handleAgeChange("all")}
                        className="mr-2"
                      />
                      <label htmlFor="all" className="cursor-pointer">
                        All
                      </label>
                    </div>
                    <div className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        id="chick"
                        checked={selectedAges.includes("CHICK")}
                        onChange={() => handleAgeChange("CHICK")}
                        className="mr-2"
                      />
                      <label htmlFor="chick" className="cursor-pointer">
                        Chicks
                      </label>
                    </div>
                    <div className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        id="stag"
                        checked={selectedAges.includes("STAG")}
                        onChange={() => handleAgeChange("STAG")}
                        className="mr-2"
                      />
                      <label htmlFor="stag" className="cursor-pointer">
                        Stags
                      </label>
                    </div>
                    <div className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        id="bullstag"
                        checked={selectedAges.includes("BULLSTAG")}
                        onChange={() => handleAgeChange("BULLSTAG")}
                        className="mr-2"
                      />
                      <label htmlFor="bullstag" className="cursor-pointer">
                        Bullstags
                      </label>
                    </div>
                    <div className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        id="cock"
                        checked={selectedAges.includes("COCK")}
                        onChange={() => handleAgeChange("COCK")}
                        className="mr-2"
                      />
                      <label htmlFor="cock" className="cursor-pointer">
                        Cocks
                      </label>
                    </div>
                  </div>
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
            {role === "admin" && <FormModal table="gamefowl" type="create" />}
          </div>
        </div>
      </div>

      {/* LIST */}
      <Table
        columns={columns}
        renderRow={(item) => renderRow(item, isArchived, handleArchiveToggle)}
        data={displayData}
      />

      {/* PAGINATION */}
      <Pagination page={p} count={totalCount} />
    </div>
  );
};

export default GamefowlListClient;
