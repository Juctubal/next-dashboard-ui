import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { lessonsData, role } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Breeding, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

const columns = [
  {
    header: "Breeding ID",
    accessor: "breedingId",
  },
  {
    header: "Sire ID",
    accessor: "sireId",
  },
  {
    header: "Dam Id",
    accessor: "damId",
    className: "hidden md:table-cell",
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

const renderRow = (item: Breeding) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-ggPurpleLight"
  >
    <td className="flex items-center gap-4 p-4">{item.id}</td>
    <td>{item.sireId}</td>
    <td className="hidden md:table-cell">{item.damId}</td>
    <td className="hidden md:table-cell">{item.notes}</td>
    <td className="hidden md:table-cell">{item.status}</td>
    <td>
      <div className="flex items-center gap-2">
        {/* <Link href={`/list/gamefowls/${item.id}`}>
          <button className="w-7 h-7 flex items-center justify-center rounded-full bg-ggSky">
            <Image src="/edit.png" alt="" width={16} height={16} />
          </button>
        </Link> */}
        {role === "admin" && (
          // <button className="w-7 h-7 flex items-center justify-center rounded-full bg-ggPurple">
          //   <Image src="/delete.png" alt="" width={16} height={16} />
          // </button>
          <>
            <FormModal table="class" type="update" data={item} />
            <FormModal table="class" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);
const BreedingListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.BreedingWhereInput = {};

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
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Breeding</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
                <Image src="/plus.png" alt="" width={14} height={14} />
              </button>
            )}
          </div>
        </div>
      </div>
      {/* lIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default BreedingListPage;
