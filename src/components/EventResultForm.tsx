import { useState, useEffect } from "react";
import {
  Event,
  EventGamefowl,
  Gamefowl,
  Result,
  GamefowlStatus,
} from "@prisma/client";
import { toast } from "sonner";

type EventWithRelations = Event & {
  gamefowl: (EventGamefowl & {
    gamefowl: Gamefowl;
  })[];
};

interface EventResultFormProps {
  event: EventWithRelations;
  onClose: () => void;
  onSubmit: (
    results: { gamefowlId: number; result: Result; notes?: string }[]
  ) => void;
}

export default function EventResultForm({
  event,
  onClose,
  onSubmit,
}: EventResultFormProps) {
  const [results, setResults] = useState<{
    [key: number]: { result: Result; notes: string };
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingResults, setHasExistingResults] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  useEffect(() => {
    const fetchExistingResults = async () => {
      try {
        const response = await fetch(`/api/events/${event.id}/results`);
        if (response.ok) {
          const existingResults = await response.json();
          const formattedResults = existingResults.reduce(
            (acc: any, result: any) => ({
              ...acc,
              [result.gamefowlId]: {
                result: result.result,
                notes: result.notes || "",
              },
            }),
            {}
          );
          setResults(formattedResults);
          setHasExistingResults(existingResults.length > 0);
        }
      } catch (error) {
        console.error("Error fetching existing results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingResults();
  }, [event.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedResults = Object.entries(results).map(
      ([gamefowlId, data]) => ({
        gamefowlId: parseInt(gamefowlId),
        result: data.result,
        notes: data.notes || undefined,
      })
    );
    onSubmit(formattedResults);
  };

  const handleStatusUpdate = async (
    gamefowlId: number,
    status: GamefowlStatus
  ) => {
    setUpdatingStatus(gamefowlId);
    try {
      const response = await fetch(`/api/gamefowl/${gamefowlId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("Gamefowl status updated successfully");
    } catch (error) {
      console.error("Error updating gamefowl status:", error);
      toast.error("Failed to update gamefowl status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getResultColor = (result: Result) => {
    switch (result) {
      case "WIN":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "LOSS":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "DRAW":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "NO_SHOW":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ggPurple"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold dark:text-gray-200">
            Event Results - {event.eventName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {event.gamefowl.map(({ gamefowl }) => (
              <div
                key={gamefowl.id}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-lg dark:text-gray-200">
                      {gamefowl.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {gamefowl.bloodline}
                    </span>
                  </div>
                  <select
                    className={`border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-ggPurple focus:border-transparent ${
                      results[gamefowl.id]?.result
                        ? getResultColor(results[gamefowl.id].result)
                        : ""
                    }`}
                    value={results[gamefowl.id]?.result || ""}
                    onChange={(e) =>
                      setResults((prev) => ({
                        ...prev,
                        [gamefowl.id]: {
                          ...prev[gamefowl.id],
                          result: e.target.value as Result,
                        },
                      }))
                    }
                    required
                  >
                    <option value="">Select Result</option>
                    {Object.values(Result).map((result) => (
                      <option key={result} value={result}>
                        {result}
                      </option>
                    ))}
                  </select>
                </div>
                {results[gamefowl.id]?.result && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Update Status of Gamefowl
                    </label>
                    <div className="flex gap-2">
                      <select
                        className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-ggPurple focus:border-transparent"
                        value={gamefowl.status}
                        onChange={(e) =>
                          handleStatusUpdate(
                            gamefowl.id,
                            e.target.value as GamefowlStatus
                          )
                        }
                        disabled={updatingStatus === gamefowl.id}
                      >
                        {Object.values(GamefowlStatus).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      {updatingStatus === gamefowl.id && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-ggPurple"></div>
                      )}
                    </div>
                  </div>
                )}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-ggPurple focus:border-transparent"
                    placeholder="Add notes about the result (optional)"
                    value={results[gamefowl.id]?.notes || ""}
                    onChange={(e) =>
                      setResults((prev) => ({
                        ...prev,
                        [gamefowl.id]: {
                          ...prev[gamefowl.id],
                          notes: e.target.value,
                        },
                      }))
                    }
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-ggPurple text-white rounded-lg hover:bg-ggPurpleDark transition-colors"
            >
              {hasExistingResults ? "Update Results" : "Submit Results"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
