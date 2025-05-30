"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BreedingPairRecommendation } from "@/lib/recommendation/types";
import { Gamefowl } from "@prisma/client";

interface BreedingFilters {
  targetBloodline?: string;
  ageCategory?: string;
}

export default function BreedingRecommendations() {
  const [recommendations, setRecommendations] = useState<
    BreedingPairRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bloodlines, setBloodlines] = useState<string[]>([]);
  const [filters, setFilters] = useState<BreedingFilters>({});

  const ageCategories = [
    { value: "STAG", label: "Stag" },
    { value: "BULLSTAG", label: "Bullstag" },
    { value: "COCK", label: "Cock" },
  ];

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
      const response = await fetch("/api/recommendations/breeding", {
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

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">
        Breeding Pair Recommendations
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-2">
            Target Bloodline
          </label>
          <select
            value={filters.targetBloodline || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                targetBloodline: e.target.value || undefined,
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

        <div>
          <label className="block text-sm font-medium mb-2">Age Category</label>
          <select
            value={filters.ageCategory || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                ageCategory: e.target.value || undefined,
              })
            }
            className="w-full p-2 border rounded-md"
          >
            <option value="">All Categories</option>
            {ageCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
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
            key={`${rec.sireId}-${rec.damId}`}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Pair #{index + 1}: {rec.sireName} × {rec.damName}
              </h3>
              <div className="text-right">
                <p className="text-sm text-gray-600">Compatibility Score</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(rec.compatibilityScore * 100)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
              <div>
                <p className="text-sm text-gray-600">Bloodline Success Rate</p>
                <p className="font-semibold">
                  {Math.round(rec.bloodlineCombinationSuccess * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Genetic Diversity</p>
                <p className="font-semibold">
                  {Math.round(rec.geneticDiversityScore * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Overall Rating</p>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(rec.compatibilityScore * 5)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>

            {rec.reasons.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 rounded">
                <p className="text-sm font-semibold text-green-800 mb-1">
                  Strengths:
                </p>
                <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                  {rec.strengthIndicators?.sparringRecord && (
                    <li>Good sparring track record</li>
                  )}
                  {rec.strengthIndicators?.healthStatus && (
                    <li>Excellent health status</li>
                  )}
                  {rec.strengthIndicators?.conditioning && (
                    <li>Proper conditioning</li>
                  )}
                  {rec.strengthIndicators?.activity && (
                    <li>High activity/alertness level</li>
                  )}
                  {rec.strengthIndicators?.temperament && (
                    <li>Balanced temperament</li>
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
          No breeding recommendations available. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}
