import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { role } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Deworming, Prisma, Vaccine } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

// Common columns for both vaccine and deworming records
const commonColumns = [
  {
    header: "Record ID",
    accessor: "recordId",
  },
  {
    header: "Gamefowl ID",
    accessor: "gamefowlId",
    className: "hidden md:table-cell",
  },
  {
    header: "Medicine Name",
    accessor: "medName",
    className: "hidden md:table-cell",
  },
  {
    header: "Description",
    accessor: "notes",
    className: "hidden md:table-cell",
  },
  {
    header: "Date Administered",
    accessor: "adminsteredDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

// Render row for vaccine records
const renderVaccineRow = (item: Vaccine) => (
  <tr
    key={`vaccine-${item.id}`}
    className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
  >
    <td className="p-4 dark:text-gray-200">{item.id}</td>
    <td className="hidden md:table-cell p-4 dark:text-gray-200">
      {item.gamefowlId}
    </td>
    <td className="hidden md:table-cell p-4 dark:text-gray-200">{item.name}</td>
    <td className="hidden md:table-cell p-4 dark:text-gray-200">
      {item.notes}
    </td>
    <td className="hidden md:table-cell p-4 dark:text-gray-200">
      {new Intl.DateTimeFormat("en-US").format(item.vaccinationDate)}
    </td>
    <td className="p-4">
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            <FormModal table="vaccine" type="update" data={item} />
            <FormModal table="vaccine" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

// Render row for deworming records
const renderDewormingRow = (item: Deworming) => (
  <tr
    key={`deworming-${item.id}`}
    className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
  >
    <td className="p-4 dark:text-gray-200">{item.id}</td>
    <td className="hidden md:table-cell p-4 dark:text-gray-200">
      {item.gamefowlId}
    </td>
    <td className="hidden md:table-cell p-4 dark:text-gray-200">{item.name}</td>
    <td className="hidden md:table-cell p-4 dark:text-gray-200">
      {item.notes}
    </td>
    <td className="hidden md:table-cell p-4 dark:text-gray-200">
      {new Intl.DateTimeFormat("en-US").format(item.dewormDate)}
    </td>
    <td className="p-4">
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            <FormModal table="deworming" type="update" data={item} />
            <FormModal table="deworming" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

const MedicalRecordsPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, type = "vaccine", ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const vaccineQuery: Prisma.VaccineWhereInput = {};
  const dewormingQuery: Prisma.DewormingWhereInput = {};

  if (queryParams.search) {
    const search = queryParams.search;
    const isNumeric = /^\d+$/.test(search);

    // Common search conditions for both vaccine and deworming
    const commonSearchConditions = [
      { notes: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      ...(isNumeric ? [{ gamefowlId: parseInt(search) }] : []),
      ...(isNumeric ? [{ id: parseInt(search) }] : []),
    ];

    vaccineQuery.OR = commonSearchConditions as Prisma.VaccineWhereInput[];
    dewormingQuery.OR = commonSearchConditions as Prisma.DewormingWhereInput[];
  }

  // Fetch data based on the selected type
  const [vaccineData, vaccineCount, dewormingData, dewormingCount] =
    await prisma.$transaction([
      prisma.vaccine.findMany({
        where: vaccineQuery,
        include: {
          gamefowl: true,
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.vaccine.count({ where: vaccineQuery }),
      prisma.deworming.findMany({
        where: dewormingQuery,
        include: {
          gamefowl: true,
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.deworming.count({ where: dewormingQuery }),
    ]);

  // Determine which data to display based on the selected type
  const data = type === "vaccine" ? vaccineData : dewormingData;
  const count = type === "vaccine" ? vaccineCount : dewormingCount;
  const renderRow = type === "vaccine" ? renderVaccineRow : renderDewormingRow;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold dark:text-gray-200">
          Medical Records
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
            {role === "admin" && (
              <FormModal
                table={type === "vaccine" ? "vaccine" : "deworming"}
                type="create"
              />
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mt-4">
        <Link
          href={`/list/medical?type=vaccine${
            queryParams.search ? `&search=${queryParams.search}` : ""
          }`}
          className={`py-2 px-4 ${
            type === "vaccine"
              ? "border-b-2 border-ggPurple text-ggPurple dark:text-ggPurple font-medium"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Vaccines
        </Link>
        <Link
          href={`/list/medical?type=deworming${
            queryParams.search ? `&search=${queryParams.search}` : ""
          }`}
          className={`py-2 px-4 ${
            type === "deworming"
              ? "border-b-2 border-ggPurple text-ggPurple dark:text-ggPurple font-medium"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Deworming
        </Link>
      </div>

      {/* LIST */}
      <Table columns={commonColumns} renderRow={renderRow} data={data} />

      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default MedicalRecordsPage;
