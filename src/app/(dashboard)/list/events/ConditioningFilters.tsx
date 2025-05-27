"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

interface ConditioningFiltersProps {
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

const ConditioningFilters = ({
  status,
  startDate,
  endDate,
  sortBy,
  sortOrder = "desc",
}: ConditioningFiltersProps) => {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    if (isFilterOpen || isSortOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen, isSortOpen]);

  const handleFilterChange = (key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    router.push(url.toString());
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={filterRef}>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow"
        >
          <Image src="/filter.png" alt="" width={14} height={14} />
        </button>
        {isFilterOpen && (
          <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700 min-w-[200px]">
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  value={status || "all"}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  value={startDate || ""}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  value={endDate || ""}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative" ref={sortRef}>
        <button
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow"
        >
          <Image src="/sort.png" alt="" width={14} height={14} />
        </button>
        {isSortOpen && (
          <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700 min-w-[200px]">
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort By
                </label>
                <select
                  className="w-full px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  value={sortBy || "startDate"}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                >
                  <option value="startDate">Start Date</option>
                  <option value="endDate">End Date</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort Order
                </label>
                <select
                  className="w-full px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  value={sortOrder}
                  onChange={(e) =>
                    handleFilterChange("sortOrder", e.target.value)
                  }
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditioningFilters;
