"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { SparringMatchRecommendation } from "@/lib/recommendation/types";
import { Gamefowl } from "@prisma/client";

interface SparringFilters {
  maxEloGap?: number;
  minMatchBalance?: number;
  bloodline?: string;
  eloTolerance?: number;
  targetGamefowlId?: number;
}

export default function SparringRecommendations() {
  const [recommendations, setRecommendations] = useState<
    SparringMatchRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bloodlines, setBloodlines] = useState<string[]>([]);
  const [gamefowls, setGamefowls] = useState<Gamefowl[]>([]);
  const [filters, setFilters] = useState<SparringFilters>({
    maxEloGap: 200,
    minMatchBalance: 0.7,
    eloTolerance: 30,
  });

  // Search functionality for gamefowl selection
  const [gamefowlSearch, setGamefowlSearch] = useState("");
  const [isGamefowlDropdownOpen, setIsGamefowlDropdownOpen] = useState(false);
  const gamefowlRef = useRef<HTMLDivElement>(null);

  // Fetch available bloodlines
  const fetchBloodlines = async () => {
    try {
      const response = await fetch("/api/gamefowls/bloodlines");
      if (!response.ok) throw new Error("Failed to fetch bloodlines");
      const data = await response.json();
      setBloodlines(data);
    } catch (err) {
      console.error("Error fetching bloodlines:", err);
    }
  };

  // Fetch available gamefowls
  const fetchGamefowls = async () => {
    try {
      const response = await fetch("/api/gamefowl/list");
      if (!response.ok) throw new Error("Failed to fetch gamefowls");
      const data = await response.json();
      setGamefowls(data);
    } catch (err) {
      console.error("Error fetching gamefowls:", err);
    }
  };

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recommendations/sparring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setRecommendations(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        gamefowlRef.current &&
        !gamefowlRef.current.contains(event.target as Node)
      ) {
        setIsGamefowlDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchBloodlines();
    fetchGamefowls();
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Filter gamefowls based on search term
  const filteredGamefowls = gamefowls.filter((gamefowl) => {
    if (!gamefowlSearch.trim()) return true; // Show all if no search term

    const searchTerm = gamefowlSearch.toLowerCase().trim();
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

  const getMatchQualityColor = (balance: number) => {
    if (balance >= 0.9) return "text-green-600";
    if (balance >= 0.8) return "text-blue-600";
    if (balance >= 0.7) return "text-yellow-600";
    return "text-orange-600";
  };

  const getMatchQualityLabel = (balance: number) => {
    if (balance >= 0.9) return "Excellent Match";
    if (balance >= 0.8) return "Good Match";
    if (balance >= 0.7) return "Fair Match";
    return "Learning Match";
  };

  const selectedGamefowl = filters.targetGamefowlId
    ? gamefowls.find((g) => g.id === filters.targetGamefowlId)
    : null;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">
        Sparring Match Recommendations
      </h2>

      {/* Filters */}
      <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
        {/* Target Gamefowl Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Specific Gamefowl (Optional)
          </label>
          <div ref={gamefowlRef} className="relative">
            <div
              onClick={() => setIsGamefowlDropdownOpen(!isGamefowlDropdownOpen)}
              className="w-full p-2 border rounded-md cursor-pointer flex justify-between items-center bg-white"
            >
              <span>
                {selectedGamefowl
                  ? `${selectedGamefowl.id} - ${selectedGamefowl.name} (Elo: ${selectedGamefowl.eloRating}, ${selectedGamefowl.bloodline})`
                  : "All Gamefowls - General Recommendations"}
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

            {isGamefowlDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="sticky top-0 bg-white p-2 border-b">
                  <input
                    type="text"
                    placeholder="Search by ID, name, or bloodline..."
                    value={gamefowlSearch}
                    onChange={(e) => setGamefowlSearch(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                  onClick={() => {
                    setFilters({ ...filters, targetGamefowlId: undefined });
                    setIsGamefowlDropdownOpen(false);
                    setGamefowlSearch(""); // Clear search when selecting "All"
                  }}
                >
                  <strong>All Gamefowls - General Recommendations</strong>
                </div>
                {filteredGamefowls.length > 0 ? (
                  filteredGamefowls.map((gamefowl) => (
                    <div
                      key={gamefowl.id}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                      onClick={() => {
                        setFilters({
                          ...filters,
                          targetGamefowlId: gamefowl.id,
                        });
                        setIsGamefowlDropdownOpen(false);
                        setGamefowlSearch(""); // Clear search when selecting
                      }}
                    >
                      <div className="font-medium">
                        {gamefowl.id} - {gamefowl.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Elo: {gamefowl.eloRating} | {gamefowl.bloodline} |{" "}
                        {gamefowl.age} | {gamefowl.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-500">
                    {gamefowlSearch.trim()
                      ? "No gamefowls match your search"
                      : "No gamefowls available"}
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Select a specific gamefowl to get personalized pairing
            recommendations, or leave unselected for general match
            recommendations.
          </p>
        </div>

        {/* Other Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              ELO Tolerance (±)
            </label>
            <input
              type="number"
              value={filters.eloTolerance || 30}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  eloTolerance: parseInt(e.target.value),
                })
              }
              className="w-full p-2 border rounded-md"
              min="10"
              max="100"
              step="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Maximum Elo Difference
            </label>
            <input
              type="number"
              value={filters.maxEloGap || 200}
              onChange={(e) =>
                setFilters({ ...filters, maxEloGap: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded-md"
              min="50"
              max="500"
              step="50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Minimum Match Balance
            </label>
            <select
              value={filters.minMatchBalance || 0.7}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minMatchBalance: parseFloat(e.target.value),
                })
              }
              className="w-full p-2 border rounded-md"
            >
              <option value="0.5">50% - Include all matches</option>
              <option value="0.7">70% - Balanced matches</option>
              <option value="0.8">80% - Well-balanced matches</option>
              <option value="0.9">90% - Highly competitive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bloodline</label>
            <select
              value={filters.bloodline || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  bloodline: e.target.value || undefined,
                })
              }
              className="w-full p-2 border rounded-md"
            >
              <option value="">All Bloodlines</option>
              {bloodlines.map((bloodline) => (
                <option key={bloodline} value={bloodline}>
                  {bloodline}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={fetchRecommendations}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 mb-6"
      >
        {loading ? "Loading..." : "Get Recommendations"}
      </button>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Header showing current mode */}
      {selectedGamefowl && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Showing pairing recommendations for:</strong>{" "}
            {selectedGamefowl.name} (ID: {selectedGamefowl.id}, Elo:{" "}
            {selectedGamefowl.eloRating})
          </p>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div
            key={`${rec.gamefowl1Id}-${rec.gamefowl2Id}`}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {selectedGamefowl
                    ? `Recommended Partner #${index + 1}`
                    : `Match #${index + 1}`}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`p-3 rounded ${
                      selectedGamefowl &&
                      rec.gamefowl1Id === selectedGamefowl.id
                        ? "bg-green-50 border-2 border-green-200"
                        : "bg-blue-50"
                    }`}
                  >
                    <p
                      className={`font-medium ${
                        selectedGamefowl &&
                        rec.gamefowl1Id === selectedGamefowl.id
                          ? "text-green-900"
                          : "text-blue-900"
                      }`}
                    >
                      {rec.gamefowl1Name}
                      {selectedGamefowl &&
                        rec.gamefowl1Id === selectedGamefowl.id && (
                          <span className="ml-2 text-xs bg-green-200 px-2 py-1 rounded">
                            YOUR GAMEFOWL
                          </span>
                        )}
                    </p>
                    <p className="text-sm text-gray-600">
                      Elo: {Math.round(rec.gamefowl1Elo)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Record: {rec.gamefowl1TrackRecord}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded ${
                      selectedGamefowl &&
                      rec.gamefowl2Id === selectedGamefowl.id
                        ? "bg-green-50 border-2 border-green-200"
                        : "bg-red-50"
                    }`}
                  >
                    <p
                      className={`font-medium ${
                        selectedGamefowl &&
                        rec.gamefowl2Id === selectedGamefowl.id
                          ? "text-green-900"
                          : "text-red-900"
                      }`}
                    >
                      {rec.gamefowl2Name}
                      {selectedGamefowl &&
                        rec.gamefowl2Id === selectedGamefowl.id && (
                          <span className="ml-2 text-xs bg-green-200 px-2 py-1 rounded">
                            YOUR GAMEFOWL
                          </span>
                        )}
                    </p>
                    <p className="text-sm text-gray-600">
                      Elo: {Math.round(rec.gamefowl2Elo)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Record: {rec.gamefowl2TrackRecord}
                    </p>
                  </div>
                </div>
              </div>

              <div className="ml-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Match Quality</p>
                <p
                  className={`text-2xl font-bold ${getMatchQualityColor(
                    rec.matchBalance
                  )}`}
                >
                  {Math.round(rec.matchBalance * 100)}%
                </p>
                <p
                  className={`text-sm ${getMatchQualityColor(
                    rec.matchBalance
                  )}`}
                >
                  {getMatchQualityLabel(rec.matchBalance)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3 text-center">
              <div>
                <p className="text-sm text-gray-600">Elo Gap</p>
                <p className="font-semibold">{rec.eloGap} points</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Learning Value</p>
                <p className="font-semibold">
                  {Math.round(rec.expectedLearningValue * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Win Probability</p>
                <p className="font-semibold">
                  {rec.gamefowl1WinProbability}% - {rec.gamefowl2WinProbability}
                  %
                </p>
              </div>
            </div>

            {rec.reasons.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Match Benefits:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {rec.matchingCriteria && (
                    <>
                      {rec.matchingCriteria.trackRecordSimilarity && (
                        <li>Track records are well-matched</li>
                      )}
                      {rec.matchingCriteria.eloWithinTolerance && (
                        <li>ELO ratings within acceptable tolerance</li>
                      )}
                      {rec.matchingCriteria.conditioningMatch && (
                        <li>Both gamefowls properly conditioned</li>
                      )}
                    </>
                  )}
                  {rec.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {recommendations.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {selectedGamefowl
            ? `No sparring partners found for ${selectedGamefowl.name}. Try adjusting your filters.`
            : "No sparring recommendations available. Try adjusting your filters."}
        </div>
      )}
    </div>
  );
}
