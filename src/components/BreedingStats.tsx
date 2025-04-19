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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Ongoing Breedings</h3>
        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
          {ongoingBreedings.length}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Active breeding pairs
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Completed Breedings</h3>
        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
          {finishedBreedings.length}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Successfully completed breedings
        </p>
      </div>
    </div>
  );
};

export default BreedingStats;
