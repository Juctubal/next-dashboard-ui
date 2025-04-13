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
    className: "w-1/3",
  },
  {
    header: "Gamefowl ID",
    accessor: "gamefowId",
    className: "hidden md:table-cell w-1/12",
  },
  {
    header: "Sire ID",
    accessor: "sireId",
    className: "hidden md:table-cell w-1/12",
  },
  {
    header: "Dam ID",
    accessor: "damId",
    className: "hidden lg:table-cell w-1/12",
  },
  {
    header: "Batch ID",
    accessor: "batchId",
    className: "hidden lg:table-cell w-1/12",
  },
  {
    header: "Age Classification",
    accessor: "age",
    className: "hidden lg:table-cell w-1/12",
  },
  {
    header: "Sex",
    accessor: "sex",
    className: "hidden lg:table-cell w-1/12",
  },
  {
    header: "Actions",
    accessor: "action",
    className: "w-1/12",
  },
];

const renderRow = (
  item: Gamefowl,
  isArchived: boolean,
  onArchiveToggle: (id: number, archive: boolean) => void
) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
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
        <h3 className="font-semibold dark:text-gray-200">{item.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {item.bloodline}
        </p>
      </div>
    </td>
    <td className="hidden md:table-cell py-3 px-4 dark:text-gray-200">
      {item.id}
    </td>
    <td className="hidden md:table-cell py-3 px-4 dark:text-gray-200">
      {item.sireId}
    </td>
    <td className="hidden md:table-cell py-3 px-4 dark:text-gray-200">
      {item.damId}
    </td>
    <td className="hidden md:table-cell py-3 px-4 dark:text-gray-200">
      {item.batchId}
    </td>
    <td className="hidden md:table-cell py-3 px-4 dark:text-gray-200">
      {item.age}
    </td>
    <td className="hidden md:table-cell py-3 px-4 dark:text-gray-200">
      {item.sex}
    </td>
    <td className="py-3 px-4">
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
  const [selectedSexes, setSelectedSexes] = useState<string[]>([]);
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

  const {
    page = "1",
    search = "",
    age,
    sex,
    showArchived = "false",
  } = searchParams;
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

  // Initialize selected sexes from URL params
  useEffect(() => {
    if (sex) {
      setSelectedSexes(sex.split(","));
    } else {
      setSelectedSexes([]);
    }
  }, [sex]);

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
    updateFilters(newSelectedAges, selectedSexes);
  };

  const handleSexChange = (sexValue: string) => {
    let newSelectedSexes: string[];

    if (sexValue === "all") {
      // If "All" is selected, clear other selections
      newSelectedSexes = selectedSexes.includes("all") ? [] : ["all"];
    } else {
      // Remove 'all' if it was previously selected
      const filteredSexes = selectedSexes.filter((s) => s !== "all");

      if (selectedSexes.includes(sexValue)) {
        // Remove the sex if it's already selected
        newSelectedSexes = filteredSexes.filter((s) => s !== sexValue);
      } else {
        // Add the sex if it's not selected
        newSelectedSexes = [...filteredSexes, sexValue];
      }

      // If no sexes are selected, select 'all'
      if (newSelectedSexes.length === 0) {
        newSelectedSexes = ["all"];
      }
    }

    setSelectedSexes(newSelectedSexes);
    updateFilters(selectedAges, newSelectedSexes);
  };

  const updateFilters = (ages: string[], sexes: string[]) => {
    // Update URL with selected filters
    const ageParam = ages.includes("all") ? "" : ages.join(",");
    const sexParam = sexes.includes("all") ? "" : sexes.join(",");
    const searchParam = search ? `&search=${search}` : "";
    // Reset to page 1 when filters change
    const pageParam = "&page=1";
    const archivedParam = showArchived === "true" ? `&showArchived=true` : "";

    let url = `/list/gamefowls?`;
    if (ageParam) url += `age=${ageParam}`;
    if (sexParam) url += `${ageParam ? "&" : ""}sex=${sexParam}`;
    url += `${searchParam}${pageParam}${archivedParam}`;

    router.push(url);
  };

  const toggleArchived = () => {
    const newShowArchived = showArchived === "true" ? "false" : "true";
    const ageParam = age ? `age=${age}` : "";
    const searchParam = search ? `&search=${search}` : "";
    // Reset to page 1 when toggling archived status
    const pageParam = "&page=1";
    const sexParam = sex ? `&sex=${sex}` : "";

    router.push(
      `/list/gamefowls?${ageParam}${searchParam}${pageParam}${sexParam}&showArchived=${newShowArchived}`
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

  // Filter data based on age classification and sex
  // No longer needed as filtering is done on the server
  const filteredData = data;

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

  // Get the total count from the URL params
  const totalCount = searchParams.count
    ? parseInt(searchParams.count)
    : data.length;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold dark:text-gray-200">
          {isArchived ? "Archived Gamefowls" : "All Gamefowls"}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end relative">
            {role === "admin" && (
              <Link
                href={`/list/gamefowls?showArchived=${!isArchived}${
                  search ? `&search=${search}` : ""
                }${age ? `&age=${age}` : ""}${sex ? `&sex=${sex}` : ""}`}
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
                <div className="absolute right-0 top-full mt-2 bg-white shadow-md rounded-md z-10 w-64">
                  <div className="p-2">
                    {/* Age Filter Section */}
                    <div className="mb-2 pb-2 border-b border-gray-200">
                      <h3 className="font-medium text-sm mb-2">
                        Age Classification
                      </h3>
                      <div className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          id="all-age"
                          checked={
                            selectedAges.includes("all") ||
                            selectedAges.length === 0
                          }
                          onChange={() => handleAgeChange("all")}
                          className="mr-2"
                        />
                        <label htmlFor="all-age" className="cursor-pointer">
                          All Ages
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
                          id="pullet"
                          checked={selectedAges.includes("PULLET")}
                          onChange={() => handleAgeChange("PULLET")}
                          className="mr-2"
                        />
                        <label htmlFor="pullet" className="cursor-pointer">
                          Pullets
                        </label>
                      </div>
                      <div className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          id="hen"
                          checked={selectedAges.includes("HEN")}
                          onChange={() => handleAgeChange("HEN")}
                          className="mr-2"
                        />
                        <label htmlFor="hen" className="cursor-pointer">
                          Hens
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

                    {/* Sex Filter Section */}
                    <div>
                      <h3 className="font-medium text-sm mb-2">Sex</h3>
                      <div className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          id="all-sex"
                          checked={
                            selectedSexes.includes("all") ||
                            selectedSexes.length === 0
                          }
                          onChange={() => handleSexChange("all")}
                          className="mr-2"
                        />
                        <label htmlFor="all-sex" className="cursor-pointer">
                          All Sexes
                        </label>
                      </div>
                      <div className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          id="female"
                          checked={selectedSexes.includes("FEMALE")}
                          onChange={() => handleSexChange("FEMALE")}
                          className="mr-2"
                        />
                        <label htmlFor="female" className="cursor-pointer">
                          Female
                        </label>
                      </div>
                      <div className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          id="male"
                          checked={selectedSexes.includes("MALE")}
                          onChange={() => handleSexChange("MALE")}
                          className="mr-2"
                        />
                        <label htmlFor="male" className="cursor-pointer">
                          Male
                        </label>
                      </div>
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
