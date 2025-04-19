"use client";

import Announcements from "@/components/Announcements";
import UserCard from "@/components/UserCard";
import GamefowlAgeChart from "@/components/AttendanceChart";
import CountChart from "@/components/CountChart";
import BreedingStats from "@/components/BreedingStats";
import EventCalendar from "@/components/EventCalendar";
import { useState, useEffect } from "react";
import { Breeding, Gamefowl } from "@prisma/client";
import BreedingCalendar from "@/components/BreedingCalendar";

type BreedingWithRelations = Breeding & {
  sire: Gamefowl;
  dam: Gamefowl;
  startDate: Date;
  endDate: Date | null;
};

const BreederPage = () => {
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

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* USER CARDS  */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="gamefowl" />
          <BreedingStats />
        </div>

        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* COUNT CHART */}
          <div className="w-full lg:w-1/3 h-[450px] bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <CountChart />
          </div>
          {/* GAMEFOWL AGE CHART */}
          <div className="w-full lg:w-2/3 h-[450px] bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <GamefowlAgeChart />
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <BreedingCalendar />
        </div>
      </div>
    </div>
  );
};

export default BreederPage;
