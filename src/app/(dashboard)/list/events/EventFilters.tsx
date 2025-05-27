"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

interface EventFiltersProps {
  eventType?: string;
  ageCategory?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

const EventFilters = ({
  eventType,
  ageCategory,
  status,
  sortBy,
  sortOrder = "desc",
}: EventFiltersProps) => {
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
                  Event Type
                </label>
                <select
                  className="w-full px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  value={eventType || "all"}
                  onChange={(e) =>
                    handleFilterChange("eventType", e.target.value)
                  }
                >
                  <option value="all">All Event Types</option>
                  <option value="FIVE_COCK_DERBY">Five Cock Derby</option>
                  <option value="FOUR_COCK_DERBY">Four Cock Derby</option>
                  <option value="THREE_COCK_DERBY">Three Cock Derby</option>
                  <option value="TWO_COCK_DERBY">Two Cock Derby</option>
                  <option value="SOLO">Solo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Age Category
                </label>
                <select
                  className="w-full px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  value={ageCategory || "all"}
                  onChange={(e) =>
                    handleFilterChange("ageCategory", e.target.value)
                  }
                >
                  <option value="all">All Age Categories</option>
                  <option value="COCK">Cock</option>
                  <option value="BULLSTAG">Bullstag</option>
                  <option value="STAG">Stag</option>
                </select>
              </div>
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
                  <option value="FINISHED">Finished</option>
                </select>
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
                  value={sortBy || "eventDate"}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                >
                  <option value="eventDate">Event Date</option>
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

export default EventFilters;
