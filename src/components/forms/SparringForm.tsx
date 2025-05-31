"use client";

import { Gamefowl } from "@prisma/client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Notification from "../ui/Notification";

// Elo rating calculation constants
const K_FACTOR = 32; // Standard K-factor for chess ratings

interface SparringFormProps {
  type: "create" | "update";
  data?: any;
  gamefowls: Gamefowl[];
  onClose?: () => void;
}

const SparringForm = ({
  type,
  data,
  gamefowls,
  onClose,
}: SparringFormProps) => {
  const router = useRouter();
  const [gamefowl1Id, setGamefowl1Id] = useState<string>(
    data?.gamefowl_1_Id?.toString() || ""
  );
  const [gamefowl2Id, setGamefowl2Id] = useState<string>(
    data?.gamefowl_2_Id?.toString() || ""
  );
  const [winnerId, setWinnerId] = useState<string>(
    data?.winnerId?.toString() || ""
  );
  const [notes, setNotes] = useState(data?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  
  // Search functionality
  const [gamefowl1Search, setGamefowl1Search] = useState("");
  const [gamefowl2Search, setGamefowl2Search] = useState("");
  const [isGamefowl1DropdownOpen, setIsGamefowl1DropdownOpen] = useState(false);
  const [isGamefowl2DropdownOpen, setIsGamefowl2DropdownOpen] = useState(false);
  const gamefowl1Ref = useRef<HTMLDivElement>(null);
  const gamefowl2Ref = useRef<HTMLDivElement>(null);

  // Calculate Elo rating changes
  const calculateEloChanges = (winner: Gamefowl, loser: Gamefowl) => {
    // Expected score calculation
    const expectedWinner =
      1 / (1 + Math.pow(10, (loser.eloRating - winner.eloRating) / 400));
    const expectedLoser = 1 - expectedWinner;

    // Actual scores (1 for win, 0 for loss)
    const actualWinner = 1;
    const actualLoser = 0;

    // Calculate rating changes
    const winnerChange = Math.round(K_FACTOR * (actualWinner - expectedWinner));
    const loserChange = Math.round(K_FACTOR * (actualLoser - expectedLoser));

    return {
      winnerChange,
      loserChange,
    };
  };

  const handleNotificationClose = () => {
    setNotification(null);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gamefowl1Ref.current && !gamefowl1Ref.current.contains(event.target as Node)) {
        setIsGamefowl1DropdownOpen(false);
      }
      if (gamefowl2Ref.current && !gamefowl2Ref.current.contains(event.target as Node)) {
        setIsGamefowl2DropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter gamefowls based on search term
  const filteredGamefowl1 = gamefowls
    .filter((gamefowl) => gamefowl.age !== "CHICK")
    .filter((gamefowl) => {
      const searchTerm = gamefowl1Search.toLowerCase();
      return (
        gamefowl.id.toString().includes(searchTerm) ||
        gamefowl.name.toLowerCase().includes(searchTerm)
      );
    });

  const filteredGamefowl2 = gamefowls
    .filter((g) => g.id !== parseInt(gamefowl1Id) && g.age !== "CHICK")
    .filter((gamefowl) => {
      const searchTerm = gamefowl2Search.toLowerCase();
      return (
        gamefowl.id.toString().includes(searchTerm) ||
        gamefowl.name.toLowerCase().includes(searchTerm)
      );
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gamefowl1Id || !gamefowl2Id || !winnerId) {
      setNotification({
        message: "Please fill in all required fields",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const gamefowl1 = gamefowls.find((g) => g.id === parseInt(gamefowl1Id));
      const gamefowl2 = gamefowls.find((g) => g.id === parseInt(gamefowl2Id));
      const winner = gamefowls.find((g) => g.id === parseInt(winnerId));
      const loser = winner?.id === gamefowl1?.id ? gamefowl2 : gamefowl1;

      if (!gamefowl1 || !gamefowl2 || !winner || !loser) {
        throw new Error("Invalid gamefowl selection");
      }

      const { winnerChange, loserChange } = calculateEloChanges(winner, loser);

      const response = await fetch("/api/sparring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gamefowl_1_Id: gamefowl1.id,
          gamefowl_2_Id: gamefowl2.id,
          winnerId: winner.id,
          loserId: loser.id,
          winner_elo_change: winnerChange,
          loser_elo_change: loserChange,
          sparringDate: new Date(),
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create sparring record");
      }

      // Show success message
      setNotification({
        message: "Battle added successfully! Elo ratings have been updated.",
        type: "success",
      });

      // Refresh the page data
      router.refresh();

      // Close the modal after a short delay
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1500);
    } catch (error) {
      console.error("Error creating sparring record:", error);
      setNotification({
        message: "Failed to create sparring record",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccessMessage) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 text-green-500 dark:text-green-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2 dark:text-gray-200">
          Battle Added Successfully!
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          The sparring record has been created and Elo ratings have been
          updated.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Gamefowl 1
          </label>
          <div ref={gamefowl1Ref} className="relative">
            <div 
              onClick={() => setIsGamefowl1DropdownOpen(!isGamefowl1DropdownOpen)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 cursor-pointer flex justify-between items-center"
            >
              <span>
                {gamefowl1Id 
                  ? gamefowls.find(g => g.id === parseInt(gamefowl1Id))
                    ? `${gamefowls.find(g => g.id === parseInt(gamefowl1Id))?.id} - ${gamefowls.find(g => g.id === parseInt(gamefowl1Id))?.name} (Elo: ${gamefowls.find(g => g.id === parseInt(gamefowl1Id))?.eloRating})` 
                    : "Select Gamefowl 1"
                  : "Select Gamefowl 1"}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isGamefowl1DropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b">
                  <input
                    type="text"
                    placeholder="Search by ID or name..."
                    value={gamefowl1Search}
                    onChange={(e) => setGamefowl1Search(e.target.value)}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {filteredGamefowl1.length > 0 ? (
                  filteredGamefowl1.map((gamefowl) => (
                    <div
                      key={gamefowl.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setGamefowl1Id(gamefowl.id.toString());
                        setIsGamefowl1DropdownOpen(false);
                        // If gamefowl2 is the same as this one, clear it
                        if (gamefowl2Id === gamefowl.id.toString()) {
                          setGamefowl2Id("");
                        }
                      }}
                    >
                      {gamefowl.id} - {gamefowl.name} (Elo: {gamefowl.eloRating})
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-500 dark:text-gray-400">No results found</div>
                )}
              </div>
            )}
          </div>
          <input type="hidden" value={gamefowl1Id} required />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Gamefowl 2
          </label>
          <div ref={gamefowl2Ref} className="relative">
            <div 
              onClick={() => setIsGamefowl2DropdownOpen(!isGamefowl2DropdownOpen)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 cursor-pointer flex justify-between items-center"
            >
              <span>
                {gamefowl2Id 
                  ? gamefowls.find(g => g.id === parseInt(gamefowl2Id))
                    ? `${gamefowls.find(g => g.id === parseInt(gamefowl2Id))?.id} - ${gamefowls.find(g => g.id === parseInt(gamefowl2Id))?.name} (Elo: ${gamefowls.find(g => g.id === parseInt(gamefowl2Id))?.eloRating})` 
                    : "Select Gamefowl 2"
                  : "Select Gamefowl 2"}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isGamefowl2DropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b">
                  <input
                    type="text"
                    placeholder="Search by ID or name..."
                    value={gamefowl2Search}
                    onChange={(e) => setGamefowl2Search(e.target.value)}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {filteredGamefowl2.length > 0 ? (
                  filteredGamefowl2.map((gamefowl) => (
                    <div
                      key={gamefowl.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setGamefowl2Id(gamefowl.id.toString());
                        setIsGamefowl2DropdownOpen(false);
                      }}
                    >
                      {gamefowl.id} - {gamefowl.name} (Elo: {gamefowl.eloRating})
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-500 dark:text-gray-400">No results found</div>
                )}
              </div>
            )}
          </div>
          <input type="hidden" value={gamefowl2Id} required />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Winner
          </label>
          <select
            value={winnerId}
            onChange={(e) => setWinnerId(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            required
          >
            <option value="">Select Winner</option>
            {[gamefowl1Id, gamefowl2Id].filter(Boolean).map((id) => {
              const gamefowl = gamefowls.find((g) => g.id === parseInt(id));
              return (
                <option key={id} value={id}>
                  {gamefowl?.name}
                </option>
              );
            })}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            rows={4}
            placeholder="Enter notes about the sparring match..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-ggYellow text-black dark:text-gray-800 py-2 px-4 rounded-md hover:bg-ggYellow/90 dark:hover:bg-ggYellow/80 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Sparring Record"}
        </button>
      </form>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={handleNotificationClose}
        />
      )}
    </>
  );
};

export default SparringForm;
