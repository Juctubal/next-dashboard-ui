import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { lessonsData, role } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Breeding, Gamefowl, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import BreedingForm from "@/components/forms/BreedingForm";
import BreedingTableRow from "./BreedingTableRow";

type BreedingWithRelations = Breeding & {
  sire: Gamefowl;
  dam: Gamefowl;
  startDate: Date;
  endDate: Date | null;
};

const columns = [
  {
    header: "Breeding ID",
    accessor: "breedingId",
  },
  {
    header: "Sire",
    accessor: "sireId",
  },
  {
    header: "Dam",
    accessor: "damId",
    className: "hidden md:table-cell",
  },
  {
    header: "Start Date",
    accessor: "startDate",
    className: "hidden lg:table-cell",
  },
  {
    header: "End Date",
    accessor: "endDate",
    className: "hidden lg:table-cell",
  },
  {
    header: "Breeding Description",
    accessor: "notes",
    className: "hidden md:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const renderRow = (item: BreedingWithRelations) => {
  return <BreedingTableRow item={item} />;
};

const BreedingListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, showArchived, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;
  const isArchived = showArchived === "true";

  // URL PARAMS CONDITION

  const query: Prisma.BreedingWhereInput = {
    isArchived: isArchived,
  };

  if (queryParams.search) {
    const search = queryParams.search;

    const isNumeric = /^\d+$/.test(search);

    query.OR = [
      { notes: { contains: search, mode: "insensitive" } },
      ...(isNumeric ? [{ damId: parseInt(search) }] : []),
      ...(isNumeric ? [{ sireId: parseInt(search) }] : []),
      ...(isNumeric ? [{ id: parseInt(search) }] : []),
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.breeding.findMany({
      where: query,
      include: {
        dam: true,
        sire: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.breeding.count({ where: query }),
  ]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold dark:text-gray-200">
          {isArchived ? "Archived Breeding" : "All Breeding"}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {role === "admin" && (
            <Link
              href={`/list/breeding?showArchived=${!isArchived}${
                queryParams.search ? `&search=${queryParams.search}` : ""
              }`}
              className={`px-3 py-1 text-sm rounded-md text-center ${
                isArchived
                  ? "bg-ggPurple text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {isArchived ? "Active" : "Archive"}
            </Link>
          )}
          <TableSearch disabled={data.length === 0} />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            <FormModal table="breeding" type="create" />
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

export default BreedingListPage;
