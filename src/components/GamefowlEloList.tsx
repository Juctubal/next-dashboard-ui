"use client";

import { Gamefowl } from "@prisma/client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface GamefowlEloListProps {
  gamefowls: Gamefowl[];
}

const GamefowlEloList = ({ gamefowls }: GamefowlEloListProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Sort gamefowls by Elo rating in descending order
  const sortedGamefowls = [...gamefowls].sort(
    (a, b) => b.eloRating - a.eloRating
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-ggYellow text-black dark:text-gray-800 px-3 py-1.5 rounded-md hover:bg-ggYellow/90 dark:hover:bg-ggYellow/80 mb-4 text-sm"
      >
        Leaderboard
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">
                Gamefowl Elo Rankings
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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

            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                    <th className="p-3 font-semibold dark:text-gray-200">
                      Rank
                    </th>
                    <th className="p-3 font-semibold dark:text-gray-200">
                      Gamefowl
                    </th>
                    <th className="p-3 font-semibold dark:text-gray-200">
                      Elo Rating
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGamefowls.map((gamefowl, index) => (
                    <tr
                      key={gamefowl.id}
                      className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 hover:bg-ggPurpleLight dark:hover:bg-gray-700"
                    >
                      <td className="p-3 dark:text-gray-200">{index + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Image
                            src={gamefowl.img || "/noAvatar.png"}
                            alt={gamefowl.name}
                            width={30}
                            height={30}
                            className="rounded-full object-cover"
                          />
                          <div>
                            <div className="font-medium dark:text-gray-200">
  <Link href={`/list/gamefowls/${gamefowl.id}`} className="hover:underline ">
    {gamefowl.name}
  </Link>
  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
    ({gamefowl.bloodline})
  </span>
</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {gamefowl.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium dark:text-gray-200">
                        {gamefowl.eloRating}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GamefowlEloList;
