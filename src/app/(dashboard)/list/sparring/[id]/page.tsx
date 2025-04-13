import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface SparringPageProps {
  params: {
    id: string;
  };
  searchParams: {
    gamefowlId: string;
  };
}

const SparringPage = async ({ params, searchParams }: SparringPageProps) => {
  const gamefowlId = parseInt(searchParams.gamefowlId);

  if (!gamefowlId) {
    notFound();
  }

  // Fetch the gamefowl and its sparring data
  const gamefowl = await prisma.gamefowl.findUnique({
    where: { id: gamefowlId },
    include: {
      sparring_1: {
        include: {
          gamefowl2: true,
        },
      },
      sparring_2: {
        include: {
          gamefowl1: true,
        },
      },
      sparring_winner: true,
      sparring_loser: true,
      gamefowl: true, // For Elo rating
    },
  });

  if (!gamefowl) {
    notFound();
  }

  // Combine all sparring matches
  const allSparringMatches = [
    ...gamefowl.sparring_1.map((match) => ({
      ...match,
      opponent: match.gamefowl2,
      isWinner: gamefowl.sparring_winner.some((w) => w.id === match.id),
      eloChange: match.winner_elo_change,
    })),
    ...gamefowl.sparring_2.map((match) => ({
      ...match,
      opponent: match.gamefowl1,
      isWinner: gamefowl.sparring_winner.some((w) => w.id === match.id),
      eloChange: match.loser_elo_change,
    })),
  ].sort(
    (a, b) =>
      new Date(b.sparringDate).getTime() - new Date(a.sparringDate).getTime()
  );

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
          Sparring History
        </span>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Sparring History for {gamefowl.name}
          </h1>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Current Elo Rating
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {gamefowl.gamefowl?.eloRating || 1000}
            </p>
          </div>
        </div>

        {allSparringMatches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No sparring history found for this gamefowl.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Opponent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Elo Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {allSparringMatches.map((match) => (
                  <tr
                    key={match.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {new Date(match.sparringDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {match.opponent?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          match.isWinner
                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                        }`}
                      >
                        {match.isWinner ? "Win" : "Loss"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`${
                          match.eloChange >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {match.eloChange >= 0 ? "+" : ""}
                        {match.eloChange}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                      {match.notes}
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

export default SparringPage;
