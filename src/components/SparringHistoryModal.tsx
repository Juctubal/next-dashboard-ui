import { useState } from "react";
import { Sparring } from "@prisma/client";

interface SparringHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparringHistory: {
    sparring_1: (Sparring & { gamefowl2: { id: number; name: string } })[];
    sparring_2: (Sparring & { gamefowl1: { id: number; name: string } })[];
    sparring_winner: Sparring[];
    sparring_loser: Sparring[];
  };
  gamefowlName: string;
}

const SparringHistoryModal = ({
  isOpen,
  onClose,
  sparringHistory,
  gamefowlName,
}: SparringHistoryModalProps) => {
  if (!isOpen) return null;

  // Combine all sparring matches and sort by date
  const allSparringMatches = [
    ...sparringHistory.sparring_1.map((match) => ({
      ...match,
      opponent: match.gamefowl2,
      result: sparringHistory.sparring_winner.some(
        (winner) => winner.id === match.id
      )
        ? "Win"
        : sparringHistory.sparring_loser.some((loser) => loser.id === match.id)
        ? "Loss"
        : "Unknown",
    })),
    ...sparringHistory.sparring_2.map((match) => ({
      ...match,
      opponent: match.gamefowl1,
      result: sparringHistory.sparring_winner.some(
        (winner) => winner.id === match.id
      )
        ? "Win"
        : sparringHistory.sparring_loser.some((loser) => loser.id === match.id)
        ? "Loss"
        : "Unknown",
    })),
  ].sort(
    (a, b) =>
      new Date(b.sparringDate).getTime() - new Date(a.sparringDate).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Sparring History for {gamefowlName}
          </h2>
          <button
            onClick={onClose}
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

        {allSparringMatches.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No sparring matches found for this gamefowl.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Opponent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {allSparringMatches.map((match) => (
                  <tr
                    key={match.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(match.sparringDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {match.opponent.name} (ID: {match.opponent.id})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          match.result === "Win"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : match.result === "Loss"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {match.result}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {match.notes || "No notes"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SparringHistoryModal;
