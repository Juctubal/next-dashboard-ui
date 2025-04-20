"use client";

import { useState, useEffect } from "react";
import { Batch, Incubation } from "@prisma/client";
import { toast } from "react-hot-toast";

type BatchWithIncubation = Batch & {
  incubation: Incubation;
};

const BatchListButton = () => {
  const [showBatchList, setShowBatchList] = useState(false);
  const [batches, setBatches] = useState<BatchWithIncubation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/batch");
      if (!response.ok) {
        throw new Error("Failed to fetch batch records");
      }
      const data = await response.json();
      setBatches(data);
    } catch (error) {
      console.error("Error fetching batch records:", error);
      toast.error("Failed to fetch batch records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showBatchList) {
      fetchBatches();
    }
  }, [showBatchList]);

  return (
    <>
      <button
        onClick={() => setShowBatchList(true)}
        className="px-3 py-1 text-sm font-medium rounded-md bg-ggYellow text-gray-800 hover:bg-ggYellow/90"
        title="View Batch Records"
      >
        Batch
      </button>

      {showBatchList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Batch Records
              </h3>
              <button
                onClick={() => setShowBatchList(false)}
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

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ggPurple"></div>
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No batch records found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Batch ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Incubation ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date Hatched
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Hatch Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {batches.map((batch) => {
                      const hatchedEggs = Math.round(
                        (batch.hatchRate / 100) * batch.incubation.eggCount
                      );
                      return (
                        <tr
                          key={batch.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                            {batch.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                            {batch.incubate_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                            {new Date(batch.dateHatched).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                            {batch.hatchRate.toFixed(2)}% ({hatchedEggs}/
                            {batch.incubation.eggCount})
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BatchListButton;
