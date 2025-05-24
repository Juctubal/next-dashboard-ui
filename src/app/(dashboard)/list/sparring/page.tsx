import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Gamefowl, Prisma, Sparring } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import GamefowlEloList from "@/components/GamefowlEloList";
import NewBattleButton from "@/components/NewBattleButton";
import SparringListRow from "@/components/SparringListRow";

// Define a type for Gamefowl (no longer need Elo)
// Using the Gamefowl type directly from Prisma
type GamefowlType = Gamefowl;

type SparringWithGamefowls = Sparring & {
  gamefowl1: GamefowlType;
  gamefowl2: GamefowlType;
  winner: GamefowlType;
  loser: GamefowlType;
};

const columns = [
  {
    header: "Gamefowls",
    accessor: "gamefowls",
  },
  {
    header: "Result",
    accessor: "result",
  },
  {
    header: "Date",
    accessor: "date",
  },
  {
    header: "Notes",
    accessor: "notes",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const SparringListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.SparringWhereInput = {};

  if (queryParams.search) {
    const search = queryParams.search;
    const isNumeric = /^\d+$/.test(search);

    query.OR = [
      // Search by gamefowl ID if the search term is numeric
      ...(isNumeric
        ? [
            {
              gamefowl1: {
                id: parseInt(search),
              },
            },
            {
              gamefowl2: {
                id: parseInt(search),
              },
            },
            {
              winner: {
                id: parseInt(search),
              },
            },
            {
              loser: {
                id: parseInt(search),
              },
            },
          ]
        : []),
      // Search by gamefowl name
      {
        gamefowl1: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        gamefowl2: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        winner: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        loser: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const [data, count, gamefowls] = await prisma.$transaction([
    prisma.sparring.findMany({
      where: query,
      include: {
        gamefowl1: true,
        gamefowl2: true,
        winner: true,
        loser: true,
      },
      orderBy: {
        sparringDate: "desc",
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.sparring.count({ where: query }),
    prisma.gamefowl.findMany({
      where: {
        isArchived: false,
        sex: "MALE",
        status: {
          notIn: ["INJURED", "BREEDING", "DECEASED", "SOLD"],
        },
      },
      orderBy: {
        eloRating: "desc",
      },
    }),
  ]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold dark:text-gray-200">
          Sparring History
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch className="mb-4" />
          <div className="flex items-center gap-4 self-end">
            <NewBattleButton gamefowls={gamefowls} />
            <GamefowlEloList gamefowls={gamefowls} />
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-ggYellow mb-4">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-ggYellow mb-4">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
          </div>
        </div>
      </div>
      {/* LIST */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 text-left">
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  className={`p-4 font-semibold dark:text-gray-200 ${
                    column.className || ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <SparringListRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      </div>
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default SparringListPage;
