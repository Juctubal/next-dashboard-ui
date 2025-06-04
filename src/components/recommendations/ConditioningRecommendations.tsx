"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ConditioningRecommendation } from "@/lib/recommendation/types";

interface ConditioningFilters {
  eventId?: number;
  targetType?: "brooding" | "breeding" | "derby";
  bloodline?: string;
  timeToEvent?: number;
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
    targetType: "derby",
  });
  const [applyingProgram, setApplyingProgram] = useState<number | null>(null);

  // Helper function to calculate days to event
  const calculateDaysToEvent = useCallback(() => {
    if (filters.targetType === "derby" && filters.eventId) {
      const selectedEvent = events.find(
        (event) => event.id === filters.eventId
      );
      if (selectedEvent) {
        const eventDate = new Date(selectedEvent.eventDate);
        const today = new Date();
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(1, diffDays);
      }
    }
    return filters.timeToEvent || 14;
  }, [filters.targetType, filters.eventId, filters.timeToEvent, events]);

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
      // Calculate timeToEvent directly here to avoid circular dependency
      let calculatedTimeToEvent = filters.timeToEvent || 14;

      if (filters.targetType === "derby" && filters.eventId) {
        // Fetch the specific event when needed instead of relying on events state
        try {
          const eventResponse = await fetch(`/api/events/${filters.eventId}`);
          if (eventResponse.ok) {
            const selectedEvent = await eventResponse.json();
            const eventDate = new Date(selectedEvent.eventDate);
            const today = new Date();
            const diffTime = eventDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            calculatedTimeToEvent = Math.max(1, diffDays);
          }
        } catch (err) {
          console.error("Error fetching event for time calculation:", err);
        }
      }

      const response = await fetch("/api/recommendations/conditioning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...filters,
          timeToEvent: calculatedTimeToEvent,
        }),
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
  }, [filters]); // Remove events dependency

  const handleApplyProgram = async (
    recommendation: ConditioningRecommendation
  ) => {
    setApplyingProgram(recommendation.gamefowlId);

    try {
      // Get handler options
      const optionsResponse = await fetch("/api/conditioning/options");
      if (!optionsResponse.ok) throw new Error("Failed to fetch options");
      const options = await optionsResponse.json();

      if (!options.handlers || options.handlers.length === 0) {
        throw new Error("No handlers available");
      }

      // Use the first available handler (you might want to add a handler selection UI)
      const handlerId = options.handlers[0].id;

      // Calculate dates based on recommendation
      const startDate = new Date();
      const endDate = new Date();
      const durationDays =
        recommendation.durationDays || recommendation.customizations.duration;
      endDate.setDate(startDate.getDate() + durationDays);

      // Create conditioning record
      const response = await fetch("/api/conditioning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gamefowlIds: [recommendation.gamefowlId],
          eventId: filters.targetType === "derby" ? filters.eventId : null,
          conProgId: recommendation.recommendedProgramId,
          handlerId: handlerId,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          status: "ASSIGNED",
          activitySchedules: [], // Empty for now, can be populated later
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to apply conditioning program");
      }

      // Show success message
      alert(
        `Successfully applied ${recommendation.programName} to ${recommendation.gamefowlName}`
      );

      // Refresh recommendations
      fetchRecommendations();
    } catch (err) {
      console.error("Error applying program:", err);
      alert(
        `Failed to apply program: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setApplyingProgram(null);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchBloodlines();
  }, []); // Only run once on mount

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]); // This will now have stable dependencies

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">
        Conditioning Program Recommendations
      </h2>

      {/* Filters */}
      <div
        className={`grid gap-4 mb-6 p-4 bg-gray-50 rounded-lg ${
          filters.targetType === "derby"
            ? "grid-cols-1 md:grid-cols-4"
            : "grid-cols-1 md:grid-cols-3"
        }`}
      >
        <div>
          <label className="block text-sm font-medium mb-2">Target</label>
          <select
            value={filters.targetType || "derby"}
            onChange={(e) => {
              const targetType = e.target
                .value as ConditioningFilters["targetType"];
              setFilters({
                ...filters,
                targetType,
                eventId: targetType === "derby" ? filters.eventId : undefined,
              });
            }}
            className="w-full p-2 border rounded-md"
          >
            <option value="brooding">Brooding & Vaccination</option>
            <option value="breeding">Breeding</option>
            <option value="derby">Derby</option>
          </select>
        </div>

        {/* Show event selection only when derby is selected */}
        {filters.targetType === "derby" && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Event
            </label>
            <select
              value={filters.eventId || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  eventId: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select an event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.eventName} -{" "}
                  {new Date(event.eventDate).toLocaleDateString()}
                </option>
              ))}
            </select>
            {filters.eventId && (
              <p className="text-xs text-blue-600 mt-1">
                Showing recommendations only for gamefowls registered to this
                event
              </p>
            )}
          </div>
        )}

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

        {/* Show Days to Event only for derby (and optionally brooding) */}
        {filters.targetType === "derby" && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Days to Event
            </label>
            <input
              type="number"
              value={calculateDaysToEvent()}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  timeToEvent: parseInt(e.target.value),
                })
              }
              className={`w-full p-2 border rounded-md ${
                filters.targetType === "derby" && filters.eventId
                  ? "bg-gray-100 cursor-not-allowed"
                  : ""
              }`}
              disabled={filters.targetType === "derby" && !!filters.eventId}
              min="1"
              max="90"
            />
            {filters.targetType === "derby" && filters.eventId && (
              <p className="text-xs text-gray-500 mt-1">
                Automatically calculated from event date
              </p>
            )}
          </div>
        )}
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
                  <span className="text-sm text-gray-600">
                    {rec.customizations.duration} days program
                  </span>
                </div>
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
                  {rec.durationDays || rec.customizations.duration} days
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Conditioning Type</p>
                <p className="font-semibold">
                  {rec.conditioningType || "Standard"}
                </p>
              </div>
            </div>

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
              <button
                onClick={() => handleApplyProgram(rec)}
                disabled={applyingProgram === rec.gamefowlId}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applyingProgram === rec.gamefowlId
                  ? "Applying..."
                  : "Apply Program"}
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
          {filters.targetType === "derby" && filters.eventId ? (
            <div>
              <p>
                No conditioning recommendations available for the selected
                event.
              </p>
              <p className="text-sm mt-2">
                Make sure gamefowls are registered for this event first.
              </p>
            </div>
          ) : (
            "No conditioning recommendations available. Try adjusting your filters."
          )}
        </div>
      )}
    </div>
  );
}
