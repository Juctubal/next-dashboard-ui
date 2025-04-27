"use client";

import Image from "next/image";
import { GamefowlSex } from "@prisma/client";

interface SparringMatch {
  id: number;
  sparringDate: Date;
  gamefowl1: {
    id: number;
    name: string;
    img: string | null;
  };
  gamefowl2: {
    id: number;
    name: string;
    img: string | null;
  };
  winner: {
    id: number;
    name: string;
  } | null;
  loser: {
    id: number;
    name: string;
  } | null;
}

interface SparringMatchesCardProps {
  gamefowlId: number;
  gamefowlName: string;
  sparringCount: number;
  sparringMatches: SparringMatch[];
  sex: GamefowlSex;
}

export default function SparringMatchesCard({
  gamefowlId,
  gamefowlName,
  sparringCount,
  sparringMatches,
  sex,
}: SparringMatchesCardProps) {
  const handleClick = () => {
    if (sex !== GamefowlSex.FEMALE) {
      // Dispatch custom event to open the modal
      document.dispatchEvent(
        new CustomEvent("openSparringModal", {
          detail: {
            gamefowlId,
            gamefowlName,
            sparringMatches,
          },
        })
      );
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        sex === GamefowlSex.FEMALE ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={handleClick}
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
          {sex === GamefowlSex.FEMALE ? "N/A" : sparringCount}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          {sex === GamefowlSex.FEMALE ? "" : "total matches"}
        </span>
      </div>
    </div>
  );
}
