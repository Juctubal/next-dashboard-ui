"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DerbyRecommendation,
  RecommendationContext,
} from "@/lib/recommendation/types";
import { Event, EventStatus, EventType, AgeCategory } from "@prisma/client";

interface EventWithDetails extends Event {
  _count?: {
    gamefowl: number;
  };
}

export default function DerbyRecommendations() {
  const [recommendations, setRecommendations] = useState<DerbyRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWithDetails | null>(
    null
  );
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Fetch upcoming/ongoing events
  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const response = await fetch("/api/events/upcoming");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      setEvents(data);
      if (data.length > 0) {
        setSelectedEvent(data[0]);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events");
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchRecommendations = useCallback(async () => {
    if (!selectedEvent) return;

    setLoading(true);
    setError(null);

    try {
      const context: RecommendationContext = {
        eventType:
          selectedEvent.eventType === "TWO_COCK_DERBY"
            ? "OTHER"
            : (selectedEvent.eventType as
                | "THREE_COCK_DERBY"
                | "FOUR_COCK_DERBY"
                | "FIVE_COCK_DERBY"
                | "SOLO"
                | "OTHER"),
        ageCategory: selectedEvent.ageCategory,
        opponentStrength: 1200, // Default value, could be made configurable
        timeToEvent: Math.max(
          0,
          Math.floor(
            (new Date(selectedEvent.eventDate).getTime() -
              new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        ),
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
  }, [selectedEvent]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchRecommendations();
    }
  }, [selectedEvent, fetchRecommendations]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Derby Recommendations</h2>

        {/* Event Selection */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Event
            </label>
            {loadingEvents ? (
              <div className="w-full p-2 border rounded-md bg-gray-100 text-gray-500">
                Loading events...
              </div>
            ) : events.length === 0 ? (
              <div className="w-full p-2 border rounded-md bg-yellow-50 text-yellow-700">
                No ongoing or upcoming events found
              </div>
            ) : (
              <select
                value={selectedEvent?.id || ""}
                onChange={(e) => {
                  const event = events.find(
                    (ev) => ev.id === parseInt(e.target.value)
                  );
                  setSelectedEvent(event || null);
                }}
                className="w-full p-2 border rounded-md"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.eventName} -{" "}
                    {new Date(event.eventDate).toLocaleDateString()}(
                    {event.eventType.replace(/_/g, " ")}, {event.ageCategory})
                    {event._count?.gamefowl
                      ? ` - ${event._count.gamefowl} gamefowls assigned`
                      : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedEvent && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Event Details:</strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Type: {selectedEvent.eventType.replace(/_/g, " ")}
              </p>
              <p className="text-sm text-gray-600">
                Category: {selectedEvent.ageCategory}
              </p>
              <p className="text-sm text-gray-600">
                Days until event:{" "}
                {Math.max(
                  0,
                  Math.floor(
                    (new Date(selectedEvent.eventDate).getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )}
              </p>
              <p className="text-sm text-gray-600">
                {selectedEvent.description}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={loading || !selectedEvent}
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
