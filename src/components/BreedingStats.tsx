"use client";

import { useState, useEffect } from "react";
import { Breeding, Gamefowl } from "@prisma/client";

type BreedingWithRelations = Breeding & {
  sire: Gamefowl;
  dam: Gamefowl;
  startDate: Date;
  endDate: Date | null;
};

const BreedingStats = () => {
  const [breedingRecords, setBreedingRecords] = useState<
    BreedingWithRelations[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBreedingRecords = async () => {
      try {
        const response = await fetch("/api/breeding");
        if (!response.ok) {
          throw new Error("Failed to fetch breeding records");
        }
        const data = await response.json();
        setBreedingRecords(data);
      } catch (error) {
        console.error("Error fetching breeding records:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBreedingRecords();
  }, []);

  const ongoingBreedings = breedingRecords.filter(
    (record) => record.status === "ONGOING"
  );
  const finishedBreedings = breedingRecords.filter(
    (record) => record.status === "FINISHED"
  );

  if (loading) {
    return (
      <div className="p-4 text-center">Loading breeding statistics...</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 h-full">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm bg-ggPurple/10 dark:bg-ggPurple/20 px-3 py-1.5 rounded-full text-ggPurple dark:text-ggPurple/90 font-medium">
              Active
            </span>
          </div>
          <div className="text-2xl font-semibold text-center md:text-left dark:text-gray-200">
            {ongoingBreedings.length}
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 text-center md:text-left">
          Active breeding pairs
        </p>
      </div>
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm bg-green-100 dark:bg-green-900/20 px-3 py-1.5 rounded-full text-green-600 dark:text-green-400 font-medium">
              Completed
            </span>
          </div>
          <div className="text-2xl font-semibold text-center md:text-left dark:text-gray-200">
            {finishedBreedings.length}
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 text-center md:text-left">
          Successfully completed breedings
        </p>
      </div>
    </div>
  );
};

export default BreedingStats;
