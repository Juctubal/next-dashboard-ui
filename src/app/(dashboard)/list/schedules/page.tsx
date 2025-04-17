import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { role, subjectsData } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import {
  OneTimeSched,
  Prisma,
  RecurrentSchedules,
  Schedule,
  UserRole,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type ScheduleList = Schedule & {
  oneTime: OneTimeSched[];
  recurrent: RecurrentSchedules[];
  staffId?: string;
  staffType?: UserRole;
};

const columns = [
  {
    header: "Task Name",
    accessor: "taskName",
  },
  {
    header: "Task Type",
    accessor: "taskType",
    className: "hidden md:table-cell",
  },
  {
    header: "Task Category",
    accessor: "taskCategory",
    className: "hidden md:table-cell",
  },
  {
    header: "Task Description",
    accessor: "taskDesc",
    className: "hidden md:table-cell",
  },
  {
    header: "Staff",
    accessor: "staff",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const renderRow = (item: ScheduleList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
  >
    <td className="flex items-center gap-4 p-4 dark:text-gray-200">
      {item.taskName}
    </td>
    <td className="hidden md:table-cell dark:text-gray-200">{item.taskType}</td>
    <td className="hidden md:table-cell dark:text-gray-200">
      {item.taskCategory}
    </td>
    <td className="hidden md:table-cell dark:text-gray-200">{item.descript}</td>
    <td className="hidden md:table-cell dark:text-gray-200">
      {item.staffId ? (
        <span>
          {item.staffType === "HANDLER" ? "Handler" : "Breeder"}: {item.staffId}
        </span>
      ) : (
        <span>Not assigned</span>
      )}
    </td>
    <td>
      <div className="flex items-center gap-2">
        {/* <Link href={"/list/teachers/${item.id}"}>
          <button className="w-7 h-7 flex items-center justify-center rounded-full bg-ggSky">
            <Image src="/edit.png" alt="" width={16} height={16} />
          </button>
        </Link> */}
        {role === "admin" && (
          // <button className="w-7 h-7 flex items-center justify-center rounded-full bg-ggPurple">
          //   <Image src="/delete.png" alt="" width={16} height={16} />
          // </button>
          <>
            <FormModal table="schedule" type="update" data={item} />
            <FormModal table="schedule" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);
const ScheduleListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.ScheduleWhereInput = {};

  if (queryParams.search) {
    const search = queryParams.search;

    const isNumeric = /^\d+$/.test(search);

    query.OR = [
      { descript: { contains: search, mode: "insensitive" } },
      { taskName: { contains: search, mode: "insensitive" } },
      // We'll handle staffId search in the frontend for now
      ...(isNumeric ? [{ id: parseInt(search) }] : []),
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.schedule.findMany({
      where: query,
      include: {
        oneTime: true,
        recurrent: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.schedule.count({ where: query }),
  ]);

  // Process the data to include staff information
  const processedData = data.map((schedule) => {
    // Use type assertion to tell TypeScript about our new fields
    const scheduleWithStaff = schedule as unknown as ScheduleList;
    return {
      ...scheduleWithStaff,
      staffId: scheduleWithStaff.staffId || null,
      staffType: scheduleWithStaff.staffType || null,
    };
  });

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold dark:text-gray-200">
          All Schedules
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow dark:bg-ggYellow/80">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow dark:bg-ggYellow/80">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              // <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
              //   <Image src="/plus.png" alt="" width={14} height={14} />
              // </button>
              <FormModal table="schedule" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* lIST */}
      <Table columns={columns} renderRow={renderRow} data={processedData} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ScheduleListPage;
