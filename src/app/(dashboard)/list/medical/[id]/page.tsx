import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface MedicalPageProps {
  params: {
    id: string;
  };
  searchParams: {
    gamefowlId: string;
  };
}

const MedicalPage = async ({ params, searchParams }: MedicalPageProps) => {
  const gamefowlId = parseInt(searchParams.gamefowlId);

  if (!gamefowlId) {
    notFound();
  }

  // Fetch the gamefowl and its medical data
  const gamefowl = await prisma.gamefowl.findUnique({
    where: { id: gamefowlId },
    include: {
      vaccine: true,
      deworming: true,
    },
  });

  if (!gamefowl) {
    notFound();
  }

  // Combine and sort all medical records
  const allMedicalRecords = [
    ...gamefowl.vaccine.map((record) => ({
      ...record,
      type: "vaccination" as const,
      date: record.vaccinationDate,
    })),
    ...gamefowl.deworming.map((record) => ({
      ...record,
      type: "deworming" as const,
      date: record.dewormDate,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 w-full">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
        <Link
          href="/list/gamefowls"
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Gamefowls
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/list/gamefowls/${gamefowlId}`}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {gamefowl.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          Medical Records
        </span>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          Medical Records for {gamefowl.name}
        </h1>

        {allMedicalRecords.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No medical records found for this gamefowl.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {allMedicalRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          record.type === "vaccination"
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            : "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                        }`}
                      >
                        {record.type === "vaccination"
                          ? "Vaccination"
                          : "Deworming"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {record.name || "Unnamed"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                      {record.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalPage;
