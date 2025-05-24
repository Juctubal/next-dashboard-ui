"use client";

import React, { useState, useEffect } from "react";
import {
  DerbyRecommendation,
  RecommendationContext,
} from "@/lib/recommendation/types";

export default function DerbyRecommendations() {
  const [recommendations, setRecommendations] = useState<DerbyRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [eventType, setEventType] = useState<string>("THREE_COCK_DERBY");
  const [ageCategory, setAgeCategory] = useState<string>("ANY");
  const [opponentStrength, setOpponentStrength] = useState<number>(1200);
  const [timeToEvent, setTimeToEvent] = useState<number>(14);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const context: RecommendationContext = {
        eventType: eventType as any,
        ageCategory: ageCategory as any,
        opponentStrength,
        timeToEvent,
      };

      const response = await fetch("/api/recommendations/derby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setRecommendations(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Derby Recommendations</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="THREE_COCK_DERBY">3-Cock Derby</option>
              <option value="FOUR_COCK_DERBY">4-Cock Derby</option>
              <option value="FIVE_COCK_DERBY">5-Cock Derby</option>
              <option value="SOLO">Solo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Age Category
            </label>
            <select
              value={ageCategory}
              onChange={(e) => setAgeCategory(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="ANY">Any</option>
              <option value="STAG">Stag</option>
              <option value="BULLSTAG">Bullstag</option>
              <option value="COCK">Cock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Opponent Strength (Elo)
            </label>
            <input
              type="number"
              value={opponentStrength}
              onChange={(e) => setOpponentStrength(parseInt(e.target.value))}
              className="w-full p-2 border rounded-md"
              min="800"
              max="2000"
              step="50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Days to Event
            </label>
            <input
              type="number"
              value={timeToEvent}
              onChange={(e) => setTimeToEvent(parseInt(e.target.value))}
              className="w-full p-2 border rounded-md"
              min="0"
              max="90"
            />
          </div>
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Get Recommendations"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div
            key={rec.gamefowlId}
            className="bg-white p-6 rounded-lg shadow-md border"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-lg font-semibold">#{index + 1}</span>
                  <h3 className="text-xl font-bold">{rec.gamefowlName}</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {rec.bloodline}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Elo Rating</p>
                    <p className="font-semibold">{rec.currentElo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Win Probability</p>
                    <p className="font-semibold">
                      {Math.round(rec.winProbability * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Health Ready</p>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{ width: `${rec.healthReadiness * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">
                        {Math.round(rec.healthReadiness * 100)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Condition Ready</p>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${rec.conditionReadiness * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">
                        {Math.round(rec.conditionReadiness * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reasons */}
                {rec.reasons.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Strengths:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {rec.reasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk Factors */}
                {rec.riskFactors.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-1">
                      Risk Factors:
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                      {rec.riskFactors.map((risk, idx) => (
                        <li key={idx}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Overall Score */}
              <div className="ml-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Overall Score</p>
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 36 * (1 - rec.overallScore)
                      }`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">
                      {Math.round(rec.overallScore * 100)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No recommendations available. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}
