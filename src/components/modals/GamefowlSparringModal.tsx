"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { X, Trophy, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";

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
  eloChange?: number;
}

interface GamefowlSparringModalProps {
  gamefowlId: number;
  gamefowlName: string;
  sparringMatches: SparringMatch[];
  onClose: () => void;
}

export default function GamefowlSparringModal({
  gamefowlId,
  gamefowlName,
  sparringMatches,
  onClose,
}: GamefowlSparringModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Sort matches by date (oldest first) to calculate Elo progression
  const sortedMatches = [...sparringMatches].sort(
    (a, b) =>
      new Date(a.sparringDate).getTime() - new Date(b.sparringDate).getTime()
  );

  // Calculate Elo ratings after each match
  const matchesWithElo = sortedMatches.map((match, index) => {
    // Start with base Elo of 1000
    const baseElo = 1000;

    // Calculate cumulative Elo changes up to this match
    const cumulativeEloChange = sortedMatches
      .slice(0, index + 1)
      .reduce((sum, m) => {
        // For this gamefowl, add points for wins and subtract for losses
        const isWinner = m.winner?.id === gamefowlId;
        const eloChange = m.eloChange || 0;

        // If the gamefowl won, add the positive change; if lost, subtract the positive change
        return sum + (isWinner ? eloChange : -eloChange);
      }, 0);

    // Calculate Elo after this match
    const eloAfterMatch = baseElo + cumulativeEloChange;

    return {
      ...match,
      eloAfterMatch,
    };
  });

  // Sort matches by date (most recent first) for display
  const displayMatches = [...matchesWithElo].sort(
    (a, b) =>
      new Date(b.sparringDate).getTime() - new Date(a.sparringDate).getTime()
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Sparring History - {gamefowlName}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {displayMatches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
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
                      Elo Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Elo Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {displayMatches.map((match) => {
                    const isWinner = match.winner?.id === gamefowlId;
                    const opponent =
                      match.gamefowl1.id === gamefowlId
                        ? match.gamefowl2
                        : match.gamefowl1;
                    const eloChange = match.eloChange || 0;

                    return (
                      <tr
                        key={match.id}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {format(new Date(match.sparringDate), "MMMM d, yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                              {opponent.img ? (
                                <Image
                                  src={opponent.img}
                                  alt={opponent.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                  {opponent.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-200">
                                {opponent.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {opponent.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              isWinner
                                ? "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {isWinner ? "Win" : "Loss"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`flex items-center gap-1 ${
                              isWinner
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {isWinner ? (
                              <ArrowUp className="w-4 h-4" />
                            ) : (
                              <ArrowDown className="w-4 h-4" />
                            )}
                            <span className="font-medium">
                              {Math.abs(eloChange)} points
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                          {match.eloAfterMatch}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No sparring matches found for this gamefowl.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
