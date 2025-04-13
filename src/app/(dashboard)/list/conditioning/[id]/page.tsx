import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface ConditioningPageProps {
  params: {
    id: string;
  };
  searchParams: {
    gamefowlId: string;
  };
}

const ConditioningPage = async ({
  params,
  searchParams,
}: ConditioningPageProps) => {
  const gamefowlId = parseInt(searchParams.gamefowlId);

  if (!gamefowlId) {
    notFound();
  }

  // Fetch the gamefowl and its conditioning data
  const gamefowl = await prisma.gamefowl.findUnique({
    where: { id: gamefowlId },
    include: {
      conditioning: {
        include: {
          conProg: true,
          event: true,
          handler: true,
        },
      },
    },
  });

  if (!gamefowl) {
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 w-full">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center text-sm text-gray-500 mb-2">
        <Link
          href="/list/gamefowls"
          className="hover:text-blue-600 transition-colors"
        >
          Gamefowls
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/list/gamefowls/${gamefowlId}`}
          className="hover:text-blue-600 transition-colors"
        >
          {gamefowl.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 font-medium">
          Conditioning Information
        </span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Conditioning Information for {gamefowl.name}
        </h1>

        {gamefowl.conditioning.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No conditioning information found for this gamefowl.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handler
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gamefowl.conditioning.map((conditioning) => (
                  <tr key={conditioning.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {conditioning.conProg.programName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {conditioning.event.eventName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {conditioning.handler.first_name}{" "}
                      {conditioning.handler.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(conditioning.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(conditioning.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          conditioning.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : conditioning.status === "ONGOING"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {conditioning.status}
                      </span>
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

export default ConditioningPage;
