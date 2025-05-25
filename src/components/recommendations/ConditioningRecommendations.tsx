"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ConditioningRecommendation } from "@/lib/recommendation/types";
import { ConditioningProgram } from "@prisma/client";

interface ConditioningFilters {
  eventId?: number;
  bloodline?: string;
  timeToEvent?: number;
  intensity?: "light" | "moderate" | "intensive";
}

export default function ConditioningRecommendations() {
  const [recommendations, setRecommendations] = useState<
    ConditioningRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [bloodlines, setBloodlines] = useState<string[]>([]);
  const [filters, setFilters] = useState<ConditioningFilters>({
    timeToEvent: 14,
    intensity: "moderate",
  });

  // Fetch upcoming events
  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events/upcoming");
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

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
      const response = await fetch("/api/recommendations/conditioning", {
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
    fetchEvents();
    fetchBloodlines();
    fetchRecommendations();
  }, [fetchRecommendations]);

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case "light":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "intensive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">
        Conditioning Program Recommendations
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-2">Target Event</label>
          <select
            value={filters.eventId || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                eventId: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            className="w-full p-2 border rounded-md"
          >
            <option value="">General Conditioning</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.eventName} -{" "}
                {new Date(event.eventDate).toLocaleDateString()}
              </option>
            ))}
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

        <div>
          <label className="block text-sm font-medium mb-2">
            Days to Event
          </label>
          <input
            type="number"
            value={filters.timeToEvent || 14}
            onChange={(e) =>
              setFilters({ ...filters, timeToEvent: parseInt(e.target.value) })
            }
            className="w-full p-2 border rounded-md"
            min="7"
            max="90"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Intensity Level
          </label>
          <select
            value={filters.intensity || "moderate"}
            onChange={(e) =>
              setFilters({ ...filters, intensity: e.target.value as any })
            }
            className="w-full p-2 border rounded-md"
          >
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="intensive">Intensive</option>
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
            key={rec.gamefowlId}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {rec.gamefowlName} - {rec.programName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getIntensityColor(
                      rec.customizations.intensity
                    )}`}
                  >
                    {rec.customizations.intensity.charAt(0).toUpperCase() +
                      rec.customizations.intensity.slice(1)}{" "}
                    Intensity
                  </span>
                  <span className="text-sm text-gray-600">
                    {rec.customizations.duration} days program
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Expected Improvement</p>
                <p className="text-2xl font-bold text-green-600">
                  +{Math.round(rec.expectedImprovement * 100)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Program Type</p>
                <p className="font-semibold">{rec.programName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">
                  {rec.customizations.duration} days
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Focus Areas</p>
                <p className="font-semibold">
                  {rec.customizations.focusAreas.length} areas
                </p>
              </div>
            </div>

            {rec.customizations.focusAreas.length > 0 && (
              <div className="mb-3 p-3 bg-blue-50 rounded">
                <p className="text-sm font-semibold text-blue-800 mb-1">
                  Focus Areas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {rec.customizations.focusAreas.map((area, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {rec.reasons.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 rounded">
                <p className="text-sm font-semibold text-green-800 mb-1">
                  Why this program:
                </p>
                <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                  {rec.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                Apply Program
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No conditioning recommendations available. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}
