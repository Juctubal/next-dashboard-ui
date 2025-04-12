import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Elo, Gamefowl, Prisma, Sparring } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";

// Define a type for Gamefowl with Elo
type GamefowlWithElo = Gamefowl & {
  gamefowl: Elo | null;
};

type SparringWithGamefowls = Sparring & {
  gamefowl1: GamefowlWithElo;
  gamefowl2: GamefowlWithElo;
  winner: GamefowlWithElo;
  loser: GamefowlWithElo;
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
];

const renderRow = (item: SparringWithGamefowls) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-ggPurpleLight"
  >
    <td className="p-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Image
            src={item.gamefowl1.img || "/noAvatar.png"}
            alt={item.gamefowl1.name}
            width={30}
            height={30}
            className="rounded-full object-cover"
          />
          <div className="flex flex-col">
            <span className="font-medium">{item.gamefowl1.name}</span>
            <span className="text-xs text-gray-500">
              ({item.gamefowl1.gamefowl?.eloRating})
            </span>
            <span className="text-xs text-gray-400">
              ID: {item.gamefowl1.id}
            </span>
          </div>
        </div>
        <span className="text-gray-500">vs</span>
        <div className="flex items-center gap-1">
          <Image
            src={item.gamefowl2.img || "/noAvatar.png"}
            alt={item.gamefowl2.name}
            width={30}
            height={30}
            className="rounded-full object-cover"
          />
          <div className="flex flex-col">
            <span className="font-medium">{item.gamefowl2.name}</span>
            <span className="text-xs text-gray-500">
              ({item.gamefowl2.gamefowl?.eloRating})
            </span>
            <span className="text-xs text-gray-400">
              ID: {item.gamefowl2.id}
            </span>
          </div>
        </div>
      </div>
    </td>
    <td className="p-4">
      <div className="flex flex-col">
        <span className="font-semibold text-green-600">
          {item.winner.name} won
        </span>
        <span className="text-xs text-gray-500">
          +{item.winner_elo_change} / -{item.loser_elo_change} ELO
        </span>
      </div>
    </td>
    <td className="p-4">{new Date(item.sparringDate).toLocaleDateString()}</td>
    <td className="hidden md:table-cell p-4">
      <p className="text-gray-600 line-clamp-2">{item.notes}</p>
    </td>
  </tr>
);

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

  const [data, count] = await prisma.$transaction([
    prisma.sparring.findMany({
      where: query,
      include: {
        gamefowl1: {
          include: {
            gamefowl: true,
          },
        },
        gamefowl2: {
          include: {
            gamefowl: true,
          },
        },
        winner: {
          include: {
            gamefowl: true,
          },
        },
        loser: {
          include: {
            gamefowl: true,
          },
        },
      },
      orderBy: {
        sparringDate: "desc",
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.sparring.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Sparring History
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
          </div>
        </div>
      </div>
      {/* LIST */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 text-left">
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  className={`p-4 font-semibold ${column.className || ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{data.map((item) => renderRow(item))}</tbody>
        </table>
      </div>
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default SparringListPage;
