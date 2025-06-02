"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Record {
  id: number;
  name?: string;
  eventName?: string;
  programName?: string;
  isArchived: boolean;
}

export default function ArchiveTestPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("event");
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();
  
  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/archive-test?type=${selectedType}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) {
      console.error("Error fetching records:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRecords();
  }, [selectedType]);
  
  const toggleArchive = async (id: number, currentStatus: boolean) => {
    setFeedback(`Toggling archive status for ${selectedType} ID ${id} from ${currentStatus} to ${!currentStatus}...`);
    
    try {
      const res = await fetch(`/api/archive-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        body: JSON.stringify({
          type: selectedType,
          id,
          isArchived: !currentStatus
        })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      
      const data = await res.json();
      setFeedback(`Successfully updated: ${JSON.stringify(data)}`);
      
      // Refresh the data
      fetchRecords();
      
    } catch (err) {
      console.error("Error toggling archive:", err);
      setFeedback(err instanceof Error ? err.message : "Unknown error");
    }
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Archive Test Tool</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Record Type:</label>
        <div className="flex space-x-4">
          <button 
            onClick={() => setSelectedType("event")}
            className={`px-4 py-2 rounded ${selectedType === "event" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Events
          </button>
          <button 
            onClick={() => setSelectedType("conditioning")}
            className={`px-4 py-2 rounded ${selectedType === "conditioning" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Conditioning
          </button>
          <button 
            onClick={() => setSelectedType("program")}
            className={`px-4 py-2 rounded ${selectedType === "program" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Programs
          </button>
        </div>
      </div>
      
      <button 
        onClick={() => fetchRecords()}
        className="px-4 py-2 bg-green-500 text-white rounded mb-4"
      >
        Refresh Records
      </button>
      
      {feedback && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
          {feedback}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded">
          Error: {error}
        </div>
      )}
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border">ID</th>
                <th className="py-2 px-4 border">Name</th>
                <th className="py-2 px-4 border">Archive Status</th>
                <th className="py-2 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 px-4 text-center">
                    No records found
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td className="py-2 px-4 border">{record.id}</td>
                    <td className="py-2 px-4 border">
                      {record.eventName || record.programName || record.name || "N/A"}
                    </td>
                    <td className="py-2 px-4 border">
                      <span 
                        className={`px-2 py-1 rounded ${
                          record.isArchived 
                            ? "bg-red-100 text-red-800" 
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {record.isArchived ? "Archived" : "Active"}
                      </span>
                    </td>
                    <td className="py-2 px-4 border">
                      <button
                        onClick={() => toggleArchive(record.id, record.isArchived)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        {record.isArchived ? "Unarchive" : "Archive"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-6">
        <button
          onClick={() => router.push('/list/events')}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Back to Events
        </button>
      </div>
    </div>
  );
}
