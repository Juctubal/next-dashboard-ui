"use client";

import { Gamefowl } from "@prisma/client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Notification from "../ui/Notification";
import { SparringMatchRecommendation } from "@/lib/recommendation/types";

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

  // Recommendations functionality
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<
    SparringMatchRecommendation[]
  >([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationMode, setRecommendationMode] = useState<
    "general" | "specific"
  >("general");

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

  // Fetch recommendations
  const fetchRecommendations = async (targetGamefowlId?: number) => {
    setLoadingRecommendations(true);
    try {
      const response = await fetch("/api/recommendations/sparring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maxEloGap: 200,
          minMatchBalance: 0.6,
          eloTolerance: 50,
          ...(targetGamefowlId && { targetGamefowlId }),
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch recommendations");
      const data = await response.json();
      setRecommendations(data.data || []);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setNotification({
        message: "Failed to load recommendations",
        type: "error",
      });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Handle recommendation selection
  const selectRecommendation = (rec: SparringMatchRecommendation) => {
    setGamefowl1Id(rec.gamefowl1Id.toString());
    setGamefowl2Id(rec.gamefowl2Id.toString());
    setShowRecommendations(false);
    setNotification({
      message: `Selected recommended pair: ${rec.gamefowl1Name} vs ${rec.gamefowl2Name}`,
      type: "success",
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        gamefowl1Ref.current &&
        !gamefowl1Ref.current.contains(event.target as Node)
      ) {
        setIsGamefowl1DropdownOpen(false);
      }
      if (
        gamefowl2Ref.current &&
        !gamefowl2Ref.current.contains(event.target as Node)
      ) {
        setIsGamefowl2DropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter gamefowls based on search term
  const filteredGamefowl1 = gamefowls
    .filter((gamefowl) => gamefowl.age !== "CHICK" && gamefowl.sex === "MALE")
    .filter((gamefowl) => {
      if (!gamefowl1Search.trim()) return true;

      const searchTerm = gamefowl1Search.toLowerCase().trim();
      const id = gamefowl.id.toString();
      const name = gamefowl.name.toLowerCase();
      const bloodline = gamefowl.bloodline?.toLowerCase() || "";

      return (
        id.includes(searchTerm) ||
        name.includes(searchTerm) ||
        bloodline.includes(searchTerm) ||
        name.startsWith(searchTerm) ||
        id.startsWith(searchTerm)
      );
    });

  const filteredGamefowl2 = gamefowls
    .filter(
      (g) =>
        g.id !== parseInt(gamefowl1Id) && g.age !== "CHICK" && g.sex === "MALE"
    )
    .filter((gamefowl) => {
      if (!gamefowl2Search.trim()) return true;

      const searchTerm = gamefowl2Search.toLowerCase().trim();
      const id = gamefowl.id.toString();
      const name = gamefowl.name.toLowerCase();
      const bloodline = gamefowl.bloodline?.toLowerCase() || "";

      return (
        id.includes(searchTerm) ||
        name.includes(searchTerm) ||
        bloodline.includes(searchTerm) ||
        name.startsWith(searchTerm) ||
        id.startsWith(searchTerm)
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

  const getMatchQualityColor = (balance: number) => {
    if (balance >= 0.9) return "text-green-600";
    if (balance >= 0.8) return "text-blue-600";
    if (balance >= 0.7) return "text-yellow-600";
    return "text-orange-600";
  };

  const getMatchQualityLabel = (balance: number) => {
    if (balance >= 0.9) return "Excellent";
    if (balance >= 0.8) return "Good";
    if (balance >= 0.7) return "Fair";
    return "Learning";
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
      <div className="max-w-4xl space-y-6">
        {/* Recommendations Section */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-200">
              Sparring Recommendations
            </h3>
            <button
              type="button"
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showRecommendations ? "Hide" : "Show"} Recommendations
            </button>
          </div>

          {showRecommendations && (
            <div className="space-y-4">
              {/* Recommendation Mode Toggle */}
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setRecommendationMode("general");
                    fetchRecommendations();
                  }}
                  className={`px-4 py-2 rounded-md text-sm ${
                    recommendationMode === "general"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  General Recommendations
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecommendationMode("specific");
                    if (gamefowl1Id) {
                      fetchRecommendations(parseInt(gamefowl1Id));
                    } else {
                      setNotification({
                        message:
                          "Please select Gamefowl 1 first to get specific recommendations",
                        type: "error",
                      });
                    }
                  }}
                  className={`px-4 py-2 rounded-md text-sm ${
                    recommendationMode === "specific"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  disabled={!gamefowl1Id}
                >
                  Find Partners for{" "}
                  {gamefowl1Id
                    ? gamefowls.find((g) => g.id === parseInt(gamefowl1Id))
                        ?.name
                    : "Selected Gamefowl"}
                </button>
              </div>

              {loadingRecommendations ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Loading recommendations...
                  </p>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {recommendations.slice(0, 5).map((rec, index) => (
                    <div
                      key={`${rec.gamefowl1Id}-${rec.gamefowl2Id}`}
                      className="border rounded-lg p-3 bg-white dark:bg-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => selectRecommendation(rec)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="text-sm">
                              <span className="font-medium text-blue-900 dark:text-blue-300">
                                {rec.gamefowl1Name}
                              </span>
                              <span className="text-gray-500 mx-2">vs</span>
                              <span className="font-medium text-red-900 dark:text-red-300">
                                {rec.gamefowl2Name}
                              </span>
                            </div>
                            <div
                              className={`text-sm font-semibold ${getMatchQualityColor(
                                rec.matchBalance
                              )}`}
                            >
                              {Math.round(rec.matchBalance * 100)}%{" "}
                              {getMatchQualityLabel(rec.matchBalance)}
                            </div>
                          </div>
                          <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                            <span>Elo Gap: {rec.eloGap}</span>
                            <span>
                              Win Prob: {rec.gamefowl1WinProbability}%-
                              {rec.gamefowl2WinProbability}%
                            </span>
                            <span>
                              Learning:{" "}
                              {Math.round(rec.expectedLearningValue * 100)}%
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectRecommendation(rec);
                          }}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  {recommendationMode === "specific" && gamefowl1Id
                    ? `No suitable partners found for ${
                        gamefowls.find((g) => g.id === parseInt(gamefowl1Id))
                          ?.name
                      }`
                    : "No recommendations available"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Gamefowl 1
            </label>
            <div ref={gamefowl1Ref} className="relative">
              <div
                onClick={() =>
                  setIsGamefowl1DropdownOpen(!isGamefowl1DropdownOpen)
                }
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 cursor-pointer flex justify-between items-center"
              >
                <span>
                  {gamefowl1Id
                    ? gamefowls.find((g) => g.id === parseInt(gamefowl1Id))
                      ? `${
                          gamefowls.find((g) => g.id === parseInt(gamefowl1Id))
                            ?.id
                        } - ${
                          gamefowls.find((g) => g.id === parseInt(gamefowl1Id))
                            ?.name
                        } (Elo: ${
                          gamefowls.find((g) => g.id === parseInt(gamefowl1Id))
                            ?.eloRating
                        })`
                      : "Select Gamefowl 1"
                    : "Select Gamefowl 1"}
                </span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {isGamefowl1DropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-auto">
                  <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b">
                    <input
                      type="text"
                      placeholder="Search by ID, name, or bloodline..."
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
                        className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b"
                        onClick={() => {
                          setGamefowl1Id(gamefowl.id.toString());
                          setIsGamefowl1DropdownOpen(false);
                          setGamefowl1Search(""); // Clear search when selecting
                          // If gamefowl2 is the same as this one, clear it
                          if (gamefowl2Id === gamefowl.id.toString()) {
                            setGamefowl2Id("");
                          }
                          // If in specific mode, fetch new recommendations
                          if (
                            recommendationMode === "specific" &&
                            showRecommendations
                          ) {
                            fetchRecommendations(gamefowl.id);
                          }
                        }}
                      >
                        <div className="font-medium dark:text-gray-200">
                          {gamefowl.id} - {gamefowl.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Elo: {gamefowl.eloRating} | {gamefowl.bloodline} |{" "}
                          {gamefowl.age} | {gamefowl.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500 dark:text-gray-400">
                      {gamefowl1Search.trim()
                        ? "No gamefowls match your search"
                        : "No gamefowls available"}
                    </div>
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
                onClick={() =>
                  setIsGamefowl2DropdownOpen(!isGamefowl2DropdownOpen)
                }
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 cursor-pointer flex justify-between items-center"
              >
                <span>
                  {gamefowl2Id
                    ? gamefowls.find((g) => g.id === parseInt(gamefowl2Id))
                      ? `${
                          gamefowls.find((g) => g.id === parseInt(gamefowl2Id))
                            ?.id
                        } - ${
                          gamefowls.find((g) => g.id === parseInt(gamefowl2Id))
                            ?.name
                        } (Elo: ${
                          gamefowls.find((g) => g.id === parseInt(gamefowl2Id))
                            ?.eloRating
                        })`
                      : "Select Gamefowl 2"
                    : "Select Gamefowl 2"}
                </span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {isGamefowl2DropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-auto">
                  <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b">
                    <input
                      type="text"
                      placeholder="Search by ID, name, or bloodline..."
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
                        className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b"
                        onClick={() => {
                          setGamefowl2Id(gamefowl.id.toString());
                          setIsGamefowl2DropdownOpen(false);
                          setGamefowl2Search(""); // Clear search when selecting
                        }}
                      >
                        <div className="font-medium dark:text-gray-200">
                          {gamefowl.id} - {gamefowl.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Elo: {gamefowl.eloRating} | {gamefowl.bloodline} |{" "}
                          {gamefowl.age} | {gamefowl.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500 dark:text-gray-400">
                      {gamefowl2Search.trim()
                        ? "No gamefowls match your search"
                        : "No gamefowls available"}
                    </div>
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
      </div>
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
