"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminToolsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);

  const handleCleanupInvalidCompletions = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/tasks/completion-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "cleanup" }),
      });

      if (!response.ok) {
        throw new Error("Failed to clean up invalid completions");
      }

      const result = await response.json();
      setCleanupResult(result);

      toast.success(
        `Cleanup completed. Deleted ${result.totalDeletedCount} invalid completion records.`
      );
    } catch (error) {
      console.error("Error cleaning up invalid completions:", error);
      toast.error("Failed to clean up invalid completions");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Database Maintenance</h2>
            <p className="text-sm text-gray-500">
              Tools for maintaining database integrity
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Button
                onClick={handleCleanupInvalidCompletions}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading
                  ? "Cleaning up..."
                  : "Clean Up Invalid Completion Records"}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Removes completion records that are outside their
                schedule&apos;s date range
              </p>
            </div>

            {cleanupResult && (
              <div className="mt-4 border p-3 rounded-md bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold mb-2">Cleanup Results:</h3>
                <p>Total deleted: {cleanupResult.totalDeletedCount}</p>

                {cleanupResult.results.length > 0 ? (
                  <div className="mt-2 max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="py-1 text-left">Recurrent ID</th>
                          <th className="py-1 text-left">Deleted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cleanupResult.results.map(
                          (result: any, index: number) => (
                            <tr key={index} className="border-b">
                              <td className="py-1">{result.recurrentId}</td>
                              <td className="py-1">{result.deletedCount}</td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm">No invalid records found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
