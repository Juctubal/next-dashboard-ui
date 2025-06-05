"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Swords, Info, Search, X } from "lucide-react";
import {
  MatchQuality,
  getMatchBalanceFromQuality,
  getMatchQualityDescription,
} from "@/lib/recommendation/types";

interface SparringFilters {
  maxEloGap?: number;
  minMatchBalance?: number;
  bloodline?: string;
  matchQuality?: MatchQuality;
  targetGamefowlId?: number;
}

interface Gamefowl {
  id: number;
  name: string;
  bloodline: string;
  eloRating: number;
  status: string;
}

interface SparringRecommendation {
  gamefowl1Id: number;
  gamefowl2Id: number;
  gamefowl1Name: string;
  gamefowl2Name: string;
  gamefowl1Elo: number;
  gamefowl2Elo: number;
  gamefowl1TrackRecord: string;
  gamefowl2TrackRecord: string;
  gamefowl1WinProbability: number;
  gamefowl2WinProbability: number;
  eloGap: number;
  matchBalance: number;
  expectedLearningValue: number;
  matchingCriteria: {
    trackRecordSimilarity: boolean;
    eloWithinTolerance: boolean;
    conditioningMatch: boolean;
    previousOutcomes: boolean;
  };
  reasons: string[];
  gamefowl1Bloodline?: string;
  gamefowl2Bloodline?: string;
  gamefowl1Conditioning?: boolean;
  gamefowl2Conditioning?: boolean;
}

export default function SparringRecommendations() {
  const [recommendations, setRecommendations] = useState<
    SparringRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SparringFilters>({
    maxEloGap: 200,
    matchQuality: "balanced", // Default to balanced matches
  });
  const [bloodlines, setBloodlines] = useState<string[]>([]);
  const [toleranceInfo, setToleranceInfo] = useState<string[]>([]);

  // New states for gamefowl search
  const [gamefowls, setGamefowls] = useState<Gamefowl[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGamefowl, setSelectedGamefowl] = useState<Gamefowl | null>(
    null
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [gamefowlsLoading, setGamefowlsLoading] = useState(false);

  useEffect(() => {
    fetchBloodlines();
    fetchGamefowls();
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".gamefowl-search-container")) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < displayedGamefowls.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : displayedGamefowls.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < displayedGamefowls.length
        ) {
          handleSelectGamefowl(displayedGamefowls[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const fetchBloodlines = async () => {
    try {
      const response = await fetch("/api/gamefowls/bloodlines");
      if (response.ok) {
        const data = await response.json();
        setBloodlines(data.bloodlines || []);
      }
    } catch (error) {
      console.error("Error fetching bloodlines:", error);
    }
  };

  const fetchGamefowls = async () => {
    try {
      setGamefowlsLoading(true);
      console.log("Fetching gamefowls..."); // Debug log
      const response = await fetch("/api/gamefowl/list");
      console.log("Response status:", response.status); // Debug log

      if (response.ok) {
        const data = await response.json();
        console.log("Raw data from API:", data); // Debug log

        // Filter OUT gamefowls with statuses that should not be available for sparring
        // Based on GamefowlStatus enum: IDLE, COMPETING, BREEDING, CONDITIONING, INJURED, SICK, DECEASED, SOLD
        const excludedStatuses = [
          "BREEDING",
          "SICK",
          "INJURED",
          "DECEASED",
          "SOLD",
        ];
        const availableGamefowls = data.filter(
          (g: Gamefowl) => !excludedStatuses.includes(g.status)
        );
        setGamefowls(availableGamefowls);
        console.log("Available gamefowls for sparring:", availableGamefowls); // Debug log
        console.log("Total available:", availableGamefowls.length); // Debug log
        console.log("Excluded statuses:", excludedStatuses); // Debug log
        console.log("Available statuses: IDLE, COMPETING, CONDITIONING"); // Debug log
      } else {
        console.error(
          "Failed to fetch gamefowls:",
          response.status,
          response.statusText
        );
        const errorData = await response.text();
        console.error("Error response:", errorData);
      }
    } catch (error) {
      console.error("Error fetching gamefowls:", error);
    } finally {
      setGamefowlsLoading(false);
    }
  };

  const filteredGamefowls = gamefowls.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.bloodline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Limit displayed results to prevent overwhelming UI
  const displayedGamefowls = filteredGamefowls.slice(0, 20);
  const hasMoreResults = filteredGamefowls.length > 20;

  const handleSelectGamefowl = (gamefowl: Gamefowl) => {
    setSelectedGamefowl(gamefowl);
    setSearchQuery(gamefowl.name);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setFilters({
      ...filters,
      targetGamefowlId: gamefowl.id,
    });
  };

  const clearSelectedGamefowl = () => {
    setSelectedGamefowl(null);
    setSearchQuery("");
    setHighlightedIndex(-1);
    setFilters({
      ...filters,
      targetGamefowlId: undefined,
    });
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    setToleranceInfo([]);

    try {
      const response = await fetch("/api/recommendations/sparring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...filters,
          minMatchBalance: getMatchBalanceFromQuality(
            filters.matchQuality || "balanced"
          ),
          useAutoTolerance: true, // Always use automatic tolerance
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.error || "Failed to fetch recommendations");
      }

      const data = await response.json();
      console.log("API Response:", data); // Debug log
      setRecommendations(data.data || []);

      // Extract tolerance information from the first recommendation's reasons
      if (data.data && data.data.length > 0) {
        const autoToleranceReasons = data.data[0].reasons
          .filter((r: string) => r.includes("[Auto-tolerance]"))
          .map((r: string) => r.replace("[Auto-tolerance] ", ""));
        setToleranceInfo(autoToleranceReasons);
      }
    } catch (err) {
      console.error("Fetch error:", err); // Debug log
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getMatchQualityColor = (balance: number) => {
    if (balance >= 0.9) return "text-green-600";
    if (balance >= 0.8) return "text-blue-600";
    if (balance >= 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  const getMatchQualityLabel = (balance: number) => {
    if (balance >= 0.9) return "Excellent Match";
    if (balance >= 0.8) return "Good Match";
    if (balance >= 0.7) return "Fair Match";
    return "Poor Match";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5" />
            Sparring Match Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Gamefowl Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Find Sparring Partners For Specific Gamefowl (Optional)
              </label>
              <div className="relative gamefowl-search-container">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-10 py-2 border rounded-md"
                    placeholder="Search gamefowl by name or bloodline..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                      setHighlightedIndex(-1);
                      if (!e.target.value) {
                        clearSelectedGamefowl();
                      }
                    }}
                    onFocus={() => {
                      setShowDropdown(true);
                      setHighlightedIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                  />
                  {selectedGamefowl && (
                    <button
                      onClick={clearSelectedGamefowl}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Dropdown */}
                {showDropdown && !selectedGamefowl && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {gamefowlsLoading ? (
                      <div className="px-4 py-2 text-gray-500 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading gamefowls...
                      </div>
                    ) : displayedGamefowls.length > 0 ? (
                      <>
                        {!searchQuery && (
                          <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                            {gamefowls.length} available gamefowl
                            {gamefowls.length !== 1 ? "s" : ""} for sparring
                          </div>
                        )}
                        {searchQuery && (
                          <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                            {filteredGamefowls.length} gamefowl
                            {filteredGamefowls.length !== 1 ? "s" : ""} found
                          </div>
                        )}
                        {displayedGamefowls.map((gamefowl, index) => (
                          <button
                            key={gamefowl.id}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex justify-between items-center ${
                              highlightedIndex === index ? "bg-gray-200" : ""
                            }`}
                            onClick={() => handleSelectGamefowl(gamefowl)}
                          >
                            <div>
                              <div className="font-medium">{gamefowl.name}</div>
                              <div className="text-sm text-gray-600">
                                {gamefowl.bloodline} • {gamefowl.eloRating} ELO
                              </div>
                            </div>
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                              {gamefowl.status}
                            </span>
                          </button>
                        ))}
                        {hasMoreResults && (
                          <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t">
                            {filteredGamefowls.length -
                              displayedGamefowls.length}{" "}
                            more results. Try searching to narrow down.
                          </div>
                        )}
                      </>
                    ) : searchQuery ? (
                      <div className="px-4 py-2 text-gray-500">
                        No gamefowls found matching "{searchQuery}"
                      </div>
                    ) : (
                      <div className="px-4 py-2 text-gray-500">
                        No gamefowls available for sparring.
                        <div className="text-xs text-gray-400 mt-1">
                          Available: IDLE, COMPETING, CONDITIONING gamefowls
                          only.
                          <br />
                          Excluded: BREEDING, SICK, INJURED, DECEASED, SOLD.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedGamefowl && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium text-blue-900">
                    Finding sparring partners for:
                  </p>
                  <p className="text-sm text-blue-700">
                    {selectedGamefowl.name} ({selectedGamefowl.bloodline}) -{" "}
                    {selectedGamefowl.eloRating} ELO
                  </p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or filter all matches
                </span>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Max ELO Gap</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={filters.maxEloGap || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      maxEloGap: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="e.g., 200"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Match Quality</label>
                <select
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={filters.matchQuality || "balanced"}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      matchQuality: e.target.value as MatchQuality,
                    })
                  }
                >
                  <option value="all">All Matches</option>
                  <option value="competitive">Competitive Matches</option>
                  <option value="balanced">Balanced Matches</option>
                  <option value="excellent">Excellent Matches</option>
                </select>
                {filters.matchQuality && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getMatchQualityDescription(filters.matchQuality)}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Bloodline Filter</label>
                <select
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={filters.bloodline || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      bloodline: e.target.value || undefined,
                    })
                  }
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

            {/* Automatic Tolerance Info */}
            {toleranceInfo.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-blue-900">
                      Automatic ELO Tolerance Applied:
                    </p>
                    {toleranceInfo.map((info, index) => (
                      <p key={index} className="text-sm text-blue-700">
                        • {info}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={fetchRecommendations}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Recommendations...
                </>
              ) : (
                <>
                  <Swords className="mr-2 h-5 w-5" />
                  Generate Sparring Recommendations
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mt-6 space-y-4">
              {recommendations.map((rec, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    {/* Match Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            rec.matchBalance >= 0.9
                              ? "bg-green-100 text-green-800"
                              : rec.matchBalance >= 0.8
                              ? "bg-blue-100 text-blue-800"
                              : rec.matchBalance >= 0.7
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {getMatchQualityLabel(rec.matchBalance)}
                        </span>
                        <span className="text-sm text-gray-600">
                          Match Balance: {(rec.matchBalance * 100).toFixed(0)}%
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        ELO Gap: {rec.eloGap}
                      </span>
                    </div>

                    {/* Gamefowls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Gamefowl 1 */}
                      <div className="space-y-2 p-3 bg-blue-50 rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{rec.gamefowl1Name}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {rec.gamefowl1Elo} ELO
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p>Record: {rec.gamefowl1TrackRecord}</p>
                          {rec.gamefowl1Bloodline && (
                            <p>Bloodline: {rec.gamefowl1Bloodline}</p>
                          )}
                          <p>Win Probability: {rec.gamefowl1WinProbability}%</p>
                          {rec.gamefowl1Conditioning && (
                            <span className="inline-block px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                              In Conditioning
                            </span>
                          )}
                        </div>
                      </div>

                      {/* VS */}
                      <div className="flex items-center justify-center md:hidden">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                          VS
                        </span>
                      </div>

                      {/* Gamefowl 2 */}
                      <div className="space-y-2 p-3 bg-red-50 rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{rec.gamefowl2Name}</h4>
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                            {rec.gamefowl2Elo} ELO
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p>Record: {rec.gamefowl2TrackRecord}</p>
                          {rec.gamefowl2Bloodline && (
                            <p>Bloodline: {rec.gamefowl2Bloodline}</p>
                          )}
                          <p>Win Probability: {rec.gamefowl2WinProbability}%</p>
                          {rec.gamefowl2Conditioning && (
                            <span className="inline-block px-2 py-1 bg-red-200 text-red-800 rounded text-xs">
                              In Conditioning
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Win Probability Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{rec.gamefowl1Name}</span>
                        <span>{rec.gamefowl2Name}</span>
                      </div>
                      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-blue-500"
                          style={{ width: `${rec.gamefowl1WinProbability}%` }}
                        />
                        <div
                          className="absolute right-0 top-0 h-full bg-red-500"
                          style={{ width: `${rec.gamefowl2WinProbability}%` }}
                        />
                      </div>
                    </div>

                    {/* Matching Criteria */}
                    <div className="flex flex-wrap gap-2">
                      {rec.matchingCriteria.trackRecordSimilarity && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          Similar Records
                        </span>
                      )}
                      {rec.matchingCriteria.eloWithinTolerance && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          ELO Compatible
                        </span>
                      )}
                      {rec.matchingCriteria.conditioningMatch && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          Conditioning Match
                        </span>
                      )}
                      {rec.matchingCriteria.previousOutcomes && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          No Recent Matches
                        </span>
                      )}
                    </div>

                    {/* Reasons */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Recommendation Reasons:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {rec.reasons
                          .filter((r) => !r.includes("[Auto-tolerance]"))
                          .map((reason, idx) => (
                            <li key={idx}>• {reason}</li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
