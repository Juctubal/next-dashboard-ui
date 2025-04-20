import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Batch, Breeding, Incubation, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import IncubationTableRow from "./IncubationTableRow";
import BatchListButton from "./BatchListButton";

type IncubationWithRelations = Incubation & {
  batch: Batch[];
  breeding?: Breeding & {
    sire: { name: string };
    dam: { name: string };
  };
};

const columns = [
  {
    header: "ID",
    accessor: "id",
  },
  {
    header: "Start Date",
    accessor: "incStart",
  },
  {
    header: "End Date",
    accessor: "incEnd",
  },
  {
    header: "Egg Count",
    accessor: "eggCount",
  },
  {
    header: "Status",
    accessor: "status",
  },
  {
    header: "Breeding",
    accessor: "breeding",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const renderRow = (item: IncubationWithRelations) => {
  return <IncubationTableRow item={item} />;
};

const IncubationListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, showArchived, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;
  const isArchived = showArchived === "true";

  // URL PARAMS CONDITION
  const query: Prisma.IncubationWhereInput = {};

  if (queryParams.search) {
    const search = queryParams.search;

    const isNumeric = /^\d+$/.test(search);

    query.OR = [
      ...(isNumeric ? [{ id: parseInt(search) }] : []),
      ...(isNumeric ? [{ eggCount: parseInt(search) }] : []),
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.incubation.findMany({
      where: query,
      include: {
        batch: {
          select: {
            id: true,
            hatchRate: true,
            dateHatched: true,
            incubate_id: true,
          },
        },
        breeding: {
          include: {
            sire: {
              select: {
                name: true,
              },
            },
            dam: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.incubation.count({ where: query }),
  ]);

  // Get total count of incubation records in the database (regardless of search or filter)
  const totalIncubationCount = await prisma.incubation.count();

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold dark:text-gray-200">
          All Incubation Records
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <BatchListButton />
            <TableSearch disabled={totalIncubationCount === 0} />
          </div>
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            <FormModal table="incubation" type="create" />
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default IncubationListPage;
