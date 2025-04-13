import { useState, useEffect } from "react";

interface Gamefowl {
  id: number;
  name: string;
  bloodline: string;
  age: string | null;
  sex: "MALE" | "FEMALE";
}

const BreedingForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const [sireId, setSireId] = useState(data?.sireId || "");
  const [damId, setDamId] = useState(data?.damId || "");
  const [notes, setNotes] = useState(data?.notes || "");
  const [status, setStatus] = useState(data?.status || "ONGOING");
  const [startDate, setStartDate] = useState(
    data?.startDate
      ? new Date(data.startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    data?.endDate ? new Date(data.endDate).toISOString().split("T")[0] : ""
  );
  const [gamefowls, setGamefowls] = useState<Gamefowl[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
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

      // Close the modal and refresh the page
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
              {gamefowl.name} ({gamefowl.bloodline}) - {gamefowl.age}
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
              {gamefowl.name} ({gamefowl.bloodline}) - {gamefowl.age}
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
      <button
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2 px-6 rounded-md border-none w-max self-center transition-colors mt-4"
      >
        {type === "create" ? "Add Breeding Record" : "Update Breeding Record"}
      </button>
    </form>
  );
};

export default BreedingForm;
