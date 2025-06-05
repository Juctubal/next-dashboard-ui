import { useState, useEffect } from "react";
import { calculateGamefowlAge } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Notification from "../ui/Notification";

const GamefowlForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const router = useRouter();
  const [name, setName] = useState(data?.name || "");
  const [bloodline, setBloodline] = useState(data?.bloodline || "");
  const [availableBloodlines, setAvailableBloodlines] = useState<string[]>([]);
  const [showBloodlineDropdown, setShowBloodlineDropdown] = useState(false);
  const [dateHatched, setDateHatched] = useState(
    data?.date_hatched
      ? new Date(data.date_hatched).toISOString().split("T")[0]
      : ""
  );
  const [sireId, setSireId] = useState(data?.sireId || "");
  const [damId, setDamId] = useState(data?.damId || "");
  const [batchId, setBatchId] = useState(data?.batchId || "");
  const [sex, setSex] = useState(data?.sex || "MALE");
  const [error, setError] = useState<string | null>(null);
  const [calculatedAge, setCalculatedAge] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Fetch available bloodlines on component mount
  useEffect(() => {
    const fetchBloodlines = async () => {
      try {
        const response = await fetch("/api/gamefowls/bloodlines");
        if (response.ok) {
          const bloodlines = await response.json();
          setAvailableBloodlines(bloodlines);
        }
      } catch (error) {
        console.error("Error fetching bloodlines:", error);
      }
    };

    fetchBloodlines();
  }, []);

  // Calculate age whenever date_hatched changes
  useEffect(() => {
    if (dateHatched) {
      const age = calculateGamefowlAge(new Date(dateHatched), sex);
      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  }, [dateHatched, sex]);

  const handleNotificationClose = () => {
    setNotification(null);
  };

  // Filter bloodlines based on current input
  const filteredBloodlines = availableBloodlines.filter((bl) =>
    bl.toLowerCase().includes(bloodline.toLowerCase())
  );

  const handleBloodlineChange = (value: string) => {
    setBloodline(value);
    setShowBloodlineDropdown(true);
  };

  const selectBloodline = (selectedBloodline: string) => {
    setBloodline(selectedBloodline);
    setShowBloodlineDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setNotification(null);

    try {
      // Add a delay to match event creation loading time
      await new Promise((resolve) => setTimeout(resolve, 800));

      const response = await fetch("/api/gamefowl", {
        method: type === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: data?.id,
          name,
          bloodline,
          date_hatched: dateHatched ? new Date(dateHatched) : null,
          age: calculatedAge, // Use the calculated age
          sex,
          sireId: sireId ? parseInt(sireId) : null,
          damId: damId ? parseInt(damId) : null,
          batchId: batchId ? parseInt(batchId) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save gamefowl");
      }

      // Show success message
      setNotification({
        message: `Gamefowl ${
          type === "create" ? "created" : "updated"
        } successfully`,
        type: "success",
      });

      // Close the modal after a delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("closeModal"));
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setNotification({
        message: `Failed to ${type} gamefowl`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
        {type === "create" ? "Add New Gamefowl" : "Update Gamefowl"}
      </h1>
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          required
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="bloodline"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Bloodline
        </label>
        <div className="relative">
          <input
            type="text"
            id="bloodline"
            value={bloodline}
            onChange={(e) => handleBloodlineChange(e.target.value)}
            onFocus={() => setShowBloodlineDropdown(true)}
            onBlur={() => {
              // Delay hiding dropdown to allow selection
              setTimeout(() => setShowBloodlineDropdown(false), 200);
            }}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            placeholder="Type or select a bloodline"
            required
          />
          {showBloodlineDropdown && filteredBloodlines.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredBloodlines.map((bl, index) => (
                <div
                  key={index}
                  onClick={() => selectBloodline(bl)}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-200"
                >
                  {bl}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="sex"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Sex
        </label>
        <select
          id="sex"
          value={sex}
          onChange={(e) => setSex(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          required
        >
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="dateHatched"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Date Hatched
        </label>
        <input
          type="date"
          id="dateHatched"
          value={dateHatched}
          onChange={(e) => setDateHatched(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        />
        {calculatedAge && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Age Classification:{" "}
            <span className="font-medium">{calculatedAge}</span>
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label
          htmlFor="sireId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Sire ID
        </label>
        <input
          type="number"
          id="sireId"
          value={sireId}
          onChange={(e) => setSireId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="damId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Dam ID
        </label>
        <input
          type="number"
          id="damId"
          value={damId}
          onChange={(e) => setDamId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="batchId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Batch ID
        </label>
        <input
          type="number"
          id="batchId"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        />
      </div>
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("closeModal"))}
          className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
                className="animate-spin h-5 w-5 text-white"
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
              <span>{type === "create" ? "Creating..." : "Updating..."}</span>
            </>
          ) : type === "create" ? (
            "Add Gamefowl"
          ) : (
            "Update Gamefowl"
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

export default GamefowlForm;
