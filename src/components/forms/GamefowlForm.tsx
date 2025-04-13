import { useState, useEffect } from "react";
import { calculateGamefowlAge } from "@/lib/utils";

const GamefowlForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const [name, setName] = useState(data?.name || "");
  const [bloodline, setBloodline] = useState(data?.bloodline || "");
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

  // Calculate age whenever date_hatched changes
  useEffect(() => {
    if (dateHatched) {
      const age = calculateGamefowlAge(new Date(dateHatched), sex);
      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  }, [dateHatched, sex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
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

      // Close the modal and refresh the page
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
        <input
          type="text"
          id="bloodline"
          value={bloodline}
          onChange={(e) => setBloodline(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          required
        />
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
      <button
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2 px-6 rounded-md border-none w-max self-center transition-colors mt-4"
      >
        {type === "create" ? "Add Gamefowl" : "Update Gamefowl"}
      </button>
    </form>
  );
};

export default GamefowlForm;
