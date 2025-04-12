import { useState } from "react";
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
  const [error, setError] = useState<string | null>(null);

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
          age: calculateGamefowlAge(dateHatched ? new Date(dateHatched) : null),
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
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Add New Gamefowl" : "Update Gamefowl"}
      </h1>
      {error && <p className="text-red-500">{error}</p>}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label
          htmlFor="bloodline"
          className="block text-sm font-medium text-gray-700"
        >
          Bloodline
        </label>
        <input
          type="text"
          id="bloodline"
          value={bloodline}
          onChange={(e) => setBloodline(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label
          htmlFor="dateHatched"
          className="block text-sm font-medium text-gray-700"
        >
          Date Hatched
        </label>
        <input
          type="date"
          id="dateHatched"
          value={dateHatched}
          onChange={(e) => setDateHatched(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="sireId"
          className="block text-sm font-medium text-gray-700"
        >
          Sire ID
        </label>
        <input
          type="number"
          id="sireId"
          value={sireId}
          onChange={(e) => setSireId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="damId"
          className="block text-sm font-medium text-gray-700"
        >
          Dam ID
        </label>
        <input
          type="number"
          id="damId"
          value={damId}
          onChange={(e) => setDamId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="batchId"
          className="block text-sm font-medium text-gray-700"
        >
          Batch ID
        </label>
        <input
          type="number"
          id="batchId"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <button
        type="submit"
        className="bg-indigo-600 text-white py-2 px-4 rounded-md border-none w-max self-center"
      >
        {type === "create" ? "Add Gamefowl" : "Update Gamefowl"}
      </button>
    </form>
  );
};

export default GamefowlForm;
