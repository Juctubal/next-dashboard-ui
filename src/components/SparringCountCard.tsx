"use client";

import { useState } from "react";
import Image from "next/image";
import { GamefowlSex, Sparring } from "@prisma/client";
import SparringHistoryModal from "./SparringHistoryModal";

interface SparringCountCardProps {
  sparringCount: number;
  gamefowlSex: GamefowlSex;
  gamefowlName: string;
  sparringHistory: {
    sparring_1: (Sparring & { gamefowl2: { id: number; name: string } })[];
    sparring_2: (Sparring & { gamefowl1: { id: number; name: string } })[];
    sparring_winner: Sparring[];
    sparring_loser: Sparring[];
  };
}

const SparringCountCard = ({
  sparringCount,
  gamefowlSex,
  gamefowlName,
  sparringHistory,
}: SparringCountCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = () => {
    if (gamefowlSex !== GamefowlSex.FEMALE) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow ${
          gamefowlSex !== GamefowlSex.FEMALE ? "cursor-pointer" : ""
        }`}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
            <Image
              src="/singleAttendance.png"
              alt=""
              width={20}
              height={20}
              className="w-5 h-5"
            />
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 font-medium">
            Sparring Matches
          </h3>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {gamefowlSex === GamefowlSex.FEMALE ? "N/A" : sparringCount}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {gamefowlSex === GamefowlSex.FEMALE ? "" : "total matches"}
          </span>
        </div>
      </div>

      <SparringHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sparringHistory={sparringHistory}
        gamefowlName={gamefowlName}
      />
    </>
  );
};

export default SparringCountCard;
