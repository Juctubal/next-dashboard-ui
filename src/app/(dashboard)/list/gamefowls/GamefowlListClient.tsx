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
import { useState, useEffect, useRef } from "react";
import { calculateGamefowlAge } from "@/lib/utils";
import { useRouter } from "next/navigation";
import MedicalForm from "@/components/forms/MedicalForm";
import ConditioningForm from "@/components/forms/ConditioningForm";
import QRScanner from "@/components/QRScanner";

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
    header: "Sire",
    accessor: "sireId",
    className: "hidden md:table-cell w-1/12",
  },
  {
    header: "Dam",
    accessor: "damId",
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
    header: "Status",
    accessor: "status",
    className: "w-[130px] sm:w-1/12",
  },
  {
    header: "Actions",
    accessor: "action",
    className: "w-[90px] sm:w-1/12",
  },
];

interface GamefowlRowProps {
  item: Gamefowl & {
    sire?: { id: number; name: string } | null;
    dam?: { id: number; name: string } | null;
  };
  isArchived: boolean;
  onArchiveToggle: (id: number, archive: boolean) => void;
}

const GamefowlRow = ({
  item,
  isArchived,
  onArchiveToggle,
}: GamefowlRowProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    "deworming" | "vaccine" | "vitamin" | "medicine" | "conditioning" | null
  >(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target as Node)
      ) {
        setIsStatusMenuOpen(false);
      }
    };

    if (isMenuOpen || isStatusMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, isStatusMenuOpen]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/gamefowl/${item.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleMenuAction = (
    action: "deworming" | "vaccine" | "vitamin" | "medicine" | "conditioning"
  ) => {
    setIsMenuOpen(false);
    setModalType(action);
    setShowModal(true);
  };

  const statusOptions = [
    "IDLE",
    "COMPETING",
    "BREEDING",
    "CONDITIONING",
    "INJURED",
    "SICK",
    "DECEASED",
  ];

  return (
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
        {item.sire?.name || "N/A"}
      </td>
      <td className="hidden md:table-cell py-3 px-4 dark:text-gray-200">
        {item.dam?.name || "N/A"}
      </td>
      <td className="hidden md:table-cell py-3 px-4 dark:text-gray-200">
        {item.age}
      </td>
      <td className="hidden md:table-cell py-3 px-4 dark:text-gray-200">
        {item.sex}
      </td>
      <td className="py-3 px-1 sm:px-4 min-w-[130px]">
        <div className="flex items-center justify-center">
          <div className="relative" ref={statusMenuRef}>
            <button
              onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
              className={`inline-block px-1 py-0.5 rounded-full text-[8px] sm:text-xs font-medium whitespace-nowrap cursor-pointer ${
                item.status === "IDLE"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : item.status === "COMPETING"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  : item.status === "BREEDING"
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                  : item.status === "CONDITIONING"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                  : item.status === "INJURED"
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                  : item.status === "SICK"
                  ? "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
                  : item.status === "DECEASED"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {item.status}
            </button>
            {isStatusMenuOpen && (
              <div className="absolute left-0 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700 min-w-[120px]">
                <div className="py-1">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        status === item.status
                          ? "bg-gray-100 dark:bg-gray-700"
                          : ""
                      }`}
                      onClick={() => {
                        handleStatusChange(status);
                        setIsStatusMenuOpen(false);
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                    />
                  </svg>
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                    <div className="py-1">
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleMenuAction("deworming")}
                      >
                        Deworming
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleMenuAction("vaccine")}
                      >
                        Vaccine
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleMenuAction("vitamin")}
                      >
                        Vitamin
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleMenuAction("medicine")}
                      >
                        Medicine
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleMenuAction("conditioning")}
                      >
                        Conditioning
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {showModal && modalType && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                      <h2 className="text-xl font-semibold dark:text-white">
                        Create {modalType}
                      </h2>
                      <button
                        onClick={() => setShowModal(false)}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    {modalType === "deworming" && (
                      <MedicalForm
                        type="create"
                        data={{ gamefowlId: item.id }}
                        recordType="deworming"
                        onClose={() => setShowModal(false)}
                      />
                    )}
                    {modalType === "vaccine" && (
                      <MedicalForm
                        type="create"
                        data={{ gamefowlId: item.id }}
                        recordType="vaccine"
                        onClose={() => setShowModal(false)}
                      />
                    )}
                    {modalType === "vitamin" && (
                      <MedicalForm
                        type="create"
                        data={{ gamefowlId: item.id }}
                        recordType="vitamin"
                        onClose={() => setShowModal(false)}
                      />
                    )}
                    {modalType === "medicine" && (
                      <MedicalForm
                        type="create"
                        data={{ gamefowlId: item.id }}
                        recordType="medicine"
                        onClose={() => setShowModal(false)}
                      />
                    )}
                    {modalType === "conditioning" && (
                      <ConditioningForm
                        type="create"
                        data={{
                          id: 0,
                          eventId: 0,
                          conProgId: 0,
                          handlerId: "",
                          startDate: new Date(),
                          endDate: new Date(),
                          status: "ASSIGNED",
                          notes: "",
                          isArchived: false,
                          gamefowls: [{ gamefowlId: item.id, gamefowl: item }],
                        }}
                        onClose={() => setShowModal(false)}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

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
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() =>
    searchParams.sortDirection === "desc" ? "desc" : "asc"
  );
  const [sortBy, setSortBy] = useState<"name" | "id">(() =>
    searchParams.sortBy === "id" ? "id" : "name"
  );
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedSexes, setSelectedSexes] = useState<string[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
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

  const updateSort = (sortBy: "name" | "id", sortDirection: "asc" | "desc") => {
    // Update URL with sort params
    const params = new URLSearchParams(window.location.search);
    params.set("sortBy", sortBy);
    params.set("sortDirection", sortDirection);
    params.set("page", "1"); // reset to page 1 on sort change
    router.push(`/list/gamefowls?${params.toString()}`);
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

  // Sort the data based on sortBy and sortDirection
  // The server has already sorted and paginated the data
  const displayData = filteredData; // No client-side sorting

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
              {isArchived ? "Showing Archived" : "Archive"}
            </Link>
            <button
              onClick={() => setShowQRScanner(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow"
              title="Scan QR Code"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
                />
              </svg>
            </button>
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
                <div className="absolute right-0 top-full mt-2 bg-white shadow-md rounded-md z-10 min-w-[180px]">
                  <div className="border-b border-gray-200">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500">
                      Sort By
                    </div>
                    <button
                      className={`block w-full px-4 py-2 text-left ${
                        sortBy === "name" ? "bg-gray-100" : ""
                      }`}
                      onClick={() => {
                        setSortBy("name");
                        updateSort("name", sortDirection);
                      }}
                    >
                      Name
                    </button>
                    <button
                      className={`block w-full px-4 py-2 text-left ${
                        sortBy === "id" ? "bg-gray-100" : ""
                      }`}
                      onClick={() => {
                        setSortBy("id");
                        updateSort("id", sortDirection);
                      }}
                    >
                      ID Number
                    </button>
                  </div>
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500">
                      Order
                    </div>
                    <button
                      className={`block w-full px-4 py-2 text-left ${
                        sortDirection === "asc" ? "bg-gray-100" : ""
                      }`}
                      onClick={() => {
                        setSortDirection("asc");
                        updateSort(sortBy, "asc");
                        setSortDropdownOpen(false);
                      }}
                    >
                      Ascending
                    </button>
                    <button
                      className={`block w-full px-4 py-2 text-left ${
                        sortDirection === "desc" ? "bg-gray-100" : ""
                      }`}
                      onClick={() => {
                        setSortDirection("desc");
                        updateSort(sortBy, "desc");
                        setSortDropdownOpen(false);
                      }}
                    >
                      Descending
                    </button>
                  </div>
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
        renderRow={(item) => (
          <GamefowlRow
            key={item.id}
            item={item}
            isArchived={isArchived}
            onArchiveToggle={handleArchiveToggle}
          />
        )}
        data={displayData}
      />

      {/* PAGINATION */}
      <Pagination page={p} count={totalCount} />

      {/* QR Scanner Modal */}
      {showQRScanner && <QRScanner onClose={() => setShowQRScanner(false)} />}
    </div>
  );
};

export default GamefowlListClient;
