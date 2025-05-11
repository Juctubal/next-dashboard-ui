"use client";

import { Gamefowl } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Elo rating calculation constants
const K_FACTOR = 32; // Standard K-factor for chess ratings

interface SparringFormProps {
  gamefowls: Gamefowl[];
}

const SparringForm = ({ gamefowls }: SparringFormProps) => {
  const router = useRouter();
  const [gamefowl1Id, setGamefowl1Id] = useState<string>("");
  const [gamefowl2Id, setGamefowl2Id] = useState<string>("");
  const [winnerId, setWinnerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out gamefowls that are breeding, injured, deceased, or sold
  const availableGamefowls = gamefowls.filter(
    (gamefowl) =>
      !["BREEDING", "INJURED", "DECEASED", "SOLD"].includes(gamefowl.status)
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gamefowl1Id || !gamefowl2Id || !winnerId) {
      alert("Please fill in all required fields");
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

      router.push("/list/sparring");
      router.refresh();
    } catch (error) {
      console.error("Error creating sparring record:", error);
      alert("Failed to create sparring record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Gamefowl 1
        </label>
        <select
          value={gamefowl1Id}
          onChange={(e) => setGamefowl1Id(e.target.value)}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          required
        >
          <option value="">Select Gamefowl 1</option>
          {availableGamefowls.map((gamefowl) => (
            <option key={gamefowl.id} value={gamefowl.id}>
              {gamefowl.id} - {gamefowl.name} (Elo: {gamefowl.eloRating})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Gamefowl 2
        </label>
        <select
          value={gamefowl2Id}
          onChange={(e) => setGamefowl2Id(e.target.value)}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          required
        >
          <option value="">Select Gamefowl 2</option>
          {availableGamefowls
            .filter((g) => g.id !== parseInt(gamefowl1Id))
            .map((gamefowl) => (
              <option key={gamefowl.id} value={gamefowl.id}>
                {gamefowl.id} - {gamefowl.name} (Elo: {gamefowl.eloRating})
              </option>
            ))}
        </select>
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
  );
};

export default SparringForm;
