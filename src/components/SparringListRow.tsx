"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import SparringNotesEditDialog from "./SparringNotesEditDialog";
import { Gamefowl, Sparring } from "@prisma/client";

type GamefowlType = Gamefowl;

type SparringWithGamefowls = Sparring & {
  gamefowl1: GamefowlType;
  gamefowl2: GamefowlType;
  winner: GamefowlType;
  loser: GamefowlType;
};

interface SparringListRowProps {
  item: SparringWithGamefowls;
}

export default function SparringListRow({ item }: SparringListRowProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <tr
        key={item.id}
        className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
      >
        <td className="p-4 dark:text-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Image
                src={item.gamefowl1.img || "/noAvatar.png"}
                alt={item.gamefowl1.name}
                width={30}
                height={30}
                className="rounded-full object-cover"
              />
              <div className="flex flex-col">
                <span className="font-medium dark:text-gray-200">
                  {item.gamefowl1.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({item.gamefowl1.eloRating})
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  ID: {item.gamefowl1.id}
                </span>
              </div>
            </div>
            <span className="text-gray-500 dark:text-gray-400">vs</span>
            <div className="flex items-center gap-1">
              <Image
                src={item.gamefowl2.img || "/noAvatar.png"}
                alt={item.gamefowl2.name}
                width={30}
                height={30}
                className="rounded-full object-cover"
              />
              <div className="flex flex-col">
                <span className="font-medium dark:text-gray-200">
                  {item.gamefowl2.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({item.gamefowl2.eloRating})
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  ID: {item.gamefowl2.id}
                </span>
              </div>
            </div>
          </div>
        </td>
        <td className="p-4">
          <div className="flex flex-col">
            <span className="font-semibold text-green-600 dark:text-green-400">
              {item.winner.name} won
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{item.winner_elo_change} / -{item.loser_elo_change} ELO
            </span>
          </div>
        </td>
        <td className="p-4 dark:text-gray-200">
          {new Date(item.sparringDate).toLocaleDateString()}
        </td>
        <td className="hidden md:table-cell p-4">
          <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
            {item.notes}
          </p>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <button
              className="w-7 h-7 flex items-center justify-center rounded-full bg-ggSky hover:bg-ggSky/80 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
              onClick={() => setIsEditModalOpen(true)}
              aria-label="Edit sparring notes"
            >
              <Image src="/update.png" alt="Edit" width={16} height={16} />
            </button>
          </div>
        </td>
      </tr>

      <SparringNotesEditDialog
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        sparringId={item.id}
        initialNotes={item.notes || ""}
      />
    </>
  );
}
