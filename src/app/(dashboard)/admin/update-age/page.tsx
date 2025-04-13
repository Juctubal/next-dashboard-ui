"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UpdateAgePage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    updatedCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleUpdateAge = async () => {
    setIsUpdating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/gamefowl/update-age", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update gamefowl ages");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Update Gamefowl Ages</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <p className="mb-4">
          This page allows you to manually trigger an update of all gamefowl age
          classifications based on their date hatched. The age will be
          calculated according to the following rules:
        </p>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Female Gamefowls:</h3>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>0-2 months: CHICK</li>
            <li>2-12 months: PULLET</li>
            <li>12+ months: HEN</li>
          </ul>

          <h3 className="font-semibold mb-2">Male Gamefowls:</h3>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>0-3 months: CHICK</li>
            <li>4-12 months: STAG</li>
            <li>13-18 months: BULLSTAG</li>
            <li>19+ months: COCK</li>
          </ul>
        </div>

        <button
          onClick={handleUpdateAge}
          disabled={isUpdating}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2 px-6 rounded-md border-none transition-colors disabled:opacity-50"
        >
          {isUpdating ? "Updating..." : "Update All Gamefowl Ages"}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 rounded">
            <p>{result.message}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
