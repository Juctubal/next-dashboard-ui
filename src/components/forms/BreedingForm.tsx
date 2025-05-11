import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Notification from "../ui/Notification";

interface Gamefowl {
  id: number;
  name: string;
  bloodline: string;
  age: string | null;
  sex: "MALE" | "FEMALE";
  status: string;
}

const BreedingForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const router = useRouter();
  const [sireId, setSireId] = useState(data?.sireId?.toString() || "");
  const [damId, setDamId] = useState(data?.damId?.toString() || "");
  const [notes, setNotes] = useState(data?.notes || "");
  const [status, setStatus] = useState(data?.status || "ONGOING");
  const [startDate, setStartDate] = useState(() => {
    if (data?.startDate) {
      // Handle both string and Date objects
      const date =
        typeof data.startDate === "string"
          ? new Date(data.startDate)
          : data.startDate;
      return date.toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    if (data?.endDate) {
      // Handle both string and Date objects
      const date =
        typeof data.endDate === "string"
          ? new Date(data.endDate)
          : data.endDate;
      return date.toISOString().split("T")[0];
    }
    return "";
  });
  const [gamefowls, setGamefowls] = useState<Gamefowl[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Log the data to see what's being passed
  useEffect(() => {
    console.log("BreedingForm data:", data);
    console.log("SireId:", data?.sireId);
    console.log("DamId:", data?.damId);
    console.log("StartDate:", data?.startDate);
    console.log("EndDate:", data?.endDate);
  }, [data]);

  useEffect(() => {
    const fetchGamefowls = async () => {
      try {
        const response = await fetch("/api/gamefowl/list");
        if (!response.ok) {
          throw new Error("Failed to fetch gamefowls");
        }
        const data = await response.json();
        setGamefowls(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchGamefowls();
  }, []);

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setNotification(null);

    try {
      // Simulate a small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 800));

      const response = await fetch("/api/breeding", {
        method: type === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: data?.id,
          sireId,
          damId,
          notes,
          status,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save breeding record");
      }

      // Show success message
      setNotification({
        message: `Breeding record ${
          type === "create" ? "created" : "updated"
        } successfully`,
        type: "success",
      });

      // Close the modal after a delay
      setTimeout(() => {
        // Close the modal
        window.dispatchEvent(new CustomEvent("closeModal"));
        // Refresh the page to show the new data
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setNotification({
        message: `Failed to ${type} breeding record`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading gamefowls...</div>;
  }

  // Filter gamefowls for sire (male, not chicks)
  const maleGamefowls = gamefowls.filter(
    (gamefowl) => gamefowl.sex === "MALE" && gamefowl.age !== "CHICK"
  );

  // Filter gamefowls for dam (female, not chicks)
  const femaleGamefowls = gamefowls.filter(
    (gamefowl) => gamefowl.sex === "FEMALE" && gamefowl.age !== "CHICK"
  );

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
        {type === "create"
          ? "Add New Breeding Record"
          : "Update Breeding Record"}
      </h1>
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <label
          htmlFor="sireId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Sire
        </label>
        <select
          id="sireId"
          value={sireId}
          onChange={(e) => setSireId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          required
        >
          <option value="">Select a sire</option>
          {maleGamefowls.map((gamefowl) => (
            <option key={gamefowl.id} value={gamefowl.id}>
              {gamefowl.name} ({gamefowl.bloodline}) - {gamefowl.age} -{" "}
              {gamefowl.status}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="damId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Dam
        </label>
        <select
          id="damId"
          value={damId}
          onChange={(e) => setDamId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          required
        >
          <option value="">Select a dam</option>
          {femaleGamefowls.map((gamefowl) => (
            <option key={gamefowl.id} value={gamefowl.id}>
              {gamefowl.name} ({gamefowl.bloodline}) - {gamefowl.age} -{" "}
              {gamefowl.status}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="startDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          required
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="endDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          End Date
        </label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Breeding Description
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          rows={4}
          required
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          required
        >
          <option value="ONGOING">Ongoing</option>
          <option value="FINISHED">Finished</option>
        </select>
      </div>
      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("closeModal"));
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2 px-6 rounded-md border-none w-max transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {type === "create" ? "Creating..." : "Updating..."}
            </>
          ) : type === "create" ? (
            "Add Breeding Record"
          ) : (
            "Update Breeding Record"
          )}
        </button>
      </div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={handleNotificationClose}
        />
      )}
    </form>
  );
};

export default BreedingForm;
