"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowUp, ArrowDown } from "lucide-react";
import { prisma } from "@/lib/prisma";

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
  winner_elo_change: number;
  loser_elo_change: number;
  notes?: string;
}

interface SparringMatchModalProps {
  sparringId: number;
  onClose: () => void;
}

export default function SparringMatchModal({
  sparringId,
  onClose,
}: SparringMatchModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [match, setMatch] = useState<SparringMatch | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSparringMatch = async () => {
      try {
        setIsLoading(true);
        // Fetch the sparring match data
        const response = await fetch(`/api/sparring/${sparringId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch sparring match data");
        }

        const data = await response.json();
        setMatch(data);
      } catch (err) {
        console.error("Error fetching sparring match:", err);
        setError("Failed to load sparring match information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSparringMatch();
  }, [sparringId]);

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Loading Sparring Match...
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !match) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Error
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <p className="text-red-500 dark:text-red-400">
              {error || "Sparring match not found"}
            </p>
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Sparring Match Details
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6">
            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-medium">Date:</span>{" "}
              {format(new Date(match.sparringDate), "MMMM d, yyyy")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gamefowl 1 */}
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                {match.gamefowl1.name}
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                  {match.gamefowl1.img ? (
                    <Image
                      src={match.gamefowl1.img}
                      alt={match.gamefowl1.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xl">
                      {match.gamefowl1.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {match.gamefowl1.id}
                  </p>
                  {match.winner?.id === match.gamefowl1.id && (
                    <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium rounded-full">
                      Winner
                    </span>
                  )}
                  {match.loser?.id === match.gamefowl1.id && (
                    <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded-full">
                      Loser
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Gamefowl 2 */}
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                {match.gamefowl2.name}
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                  {match.gamefowl2.img ? (
                    <Image
                      src={match.gamefowl2.img}
                      alt={match.gamefowl2.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xl">
                      {match.gamefowl2.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {match.gamefowl2.id}
                  </p>
                  {match.winner?.id === match.gamefowl2.id && (
                    <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium rounded-full">
                      Winner
                    </span>
                  )}
                  {match.loser?.id === match.gamefowl2.id && (
                    <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded-full">
                      Loser
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Elo Changes */}
          <div className="mt-6 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Elo Rating Changes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  <span className="font-medium">
                    {match.winner_elo_change} points
                  </span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">
                  for {match.winner?.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <ArrowDown className="w-4 h-4 mr-1" />
                  <span className="font-medium">
                    {match.loser_elo_change} points
                  </span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">
                  for {match.loser?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {match.notes && (
            <div className="mt-6 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Notes
              </h3>
              <div className="bg-gray-50 dark:bg-gray-600/50 p-4 rounded-md">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {match.notes}
                </p>
              </div>
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
