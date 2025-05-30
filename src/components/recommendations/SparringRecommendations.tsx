"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SparringMatchRecommendation } from "@/lib/recommendation/types";

interface SparringFilters {
  maxEloGap?: number;
  minMatchBalance?: number;
  bloodline?: string;
  eloTolerance?: number;
}

export default function SparringRecommendations() {
  const [recommendations, setRecommendations] = useState<
    SparringMatchRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bloodlines, setBloodlines] = useState<string[]>([]);
  const [filters, setFilters] = useState<SparringFilters>({
    maxEloGap: 200,
    minMatchBalance: 0.7,
    eloTolerance: 30,
  });

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

  useEffect(() => {
    fetchBloodlines();
    fetchRecommendations();
  }, [fetchRecommendations]);

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

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">
        Sparring Match Recommendations
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-2">
            ELO Tolerance (±)
          </label>
          <input
            type="number"
            value={filters.eloTolerance || 30}
            onChange={(e) =>
              setFilters({ ...filters, eloTolerance: parseInt(e.target.value) })
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
              setFilters({ ...filters, bloodline: e.target.value || undefined })
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
                  Match #{index + 1}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-medium text-blue-900">
                      {rec.gamefowl1Name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Elo: {Math.round(rec.gamefowl1Elo)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Record: {rec.gamefowl1TrackRecord}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <p className="font-medium text-red-900">
                      {rec.gamefowl2Name}
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
          No sparring recommendations available. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}
