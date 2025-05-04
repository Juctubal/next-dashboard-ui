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
  EventStatus,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { currentUser } from "@clerk/nextjs/server";

type ScheduleList = Schedule & {
  oneTime: OneTimeSched[];
  recurrent: RecurrentSchedules[];
  staffId?: string;
  staffType?: UserRole;
  staffName: string;
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
    accessor: "staffName",
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

const renderRow = (item: ScheduleList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
  >
    <td className="flex items-center gap-4 p-4 dark:text-gray-200">
      {item.taskName}
      {item.taskName.includes(" - ") && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          (Conditioning Activity)
        </span>
      )}
    </td>
    <td className="hidden md:table-cell dark:text-gray-200">{item.taskType}</td>
    <td className="hidden md:table-cell dark:text-gray-200">
      {item.taskCategory}
    </td>
    <td className="hidden md:table-cell dark:text-gray-200">
      {item.descript}
      {item.recurrent.length > 0 && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {item.recurrent[0].reccurencePattern === "CUSTOM" ? (
            <>
              {item.recurrent[0].customDate ? (
                <>
                  CUSTOM schedule from{" "}
                  {(() => {
                    try {
                      const customDates = JSON.parse(
                        item.recurrent[0].customDate
                      );
                      return customDates.length > 0
                        ? new Date(customDates[0]).toLocaleDateString()
                        : "N/A";
                    } catch (error) {
                      console.error("Error parsing customDate:", error);
                      return "N/A";
                    }
                  })()}{" "}
                  to{" "}
                  {(() => {
                    try {
                      const customDates = JSON.parse(
                        item.recurrent[0].customDate
                      );
                      return customDates.length > 0
                        ? new Date(
                            customDates[customDates.length - 1]
                          ).toLocaleDateString()
                        : "N/A";
                    } catch (error) {
                      console.error("Error parsing customDate:", error);
                      return "N/A";
                    }
                  })()}
                </>
              ) : (
                "CUSTOM schedule (no dates specified)"
              )}
            </>
          ) : (
            <>
              {item.recurrent[0].reccurencePattern} schedule from{" "}
              {item.recurrent[0].startDate
                ? new Date(item.recurrent[0].startDate).toLocaleDateString()
                : "N/A"}{" "}
              to{" "}
              {item.recurrent[0].endDate
                ? new Date(item.recurrent[0].endDate).toLocaleDateString()
                : "N/A"}
            </>
          )}
        </div>
      )}
    </td>
    <td className="hidden md:table-cell dark:text-gray-200">
      {item.staffName}
    </td>
    <td className="hidden md:table-cell dark:text-gray-200">
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          item.status === "ASSIGNED"
            ? "bg-blue-100 text-blue-800"
            : item.status === "FINISHED"
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
      </span>
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

  // Get current user's information
  const user = await currentUser();
  const userRole = user?.publicMetadata.role as string;
  const userId = user?.id;

  // URL PARAMS CONDITION
  const query: Prisma.ScheduleWhereInput = {};

  if (queryParams.search) {
    const search = queryParams.search;
    const isNumeric = /^\d+$/.test(search);
    query.OR = [
      { descript: { contains: search, mode: "insensitive" } },
      { taskName: { contains: search, mode: "insensitive" } },
      ...(isNumeric ? [{ id: parseInt(search) }] : []),
    ];
  }

  // If user is not admin, only show their assigned schedules
  if (userRole !== "admin" && userId) {
    query.staffId = userId;
  }

  console.log("Fetching schedules with query:", query);

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

  console.log("Found schedules:", data);
  console.log("Total count:", count);

  // Process the data to include staff information
  const processedData = await Promise.all(
    data.map(async (schedule) => {
      console.log("Processing schedule:", schedule);
      let staffName = "Not assigned";
      if (schedule.staffId) {
        console.log("Schedule has staffId:", schedule.staffId);
        console.log("Staff type:", schedule.staffType);
        if (schedule.staffType === "handler") {
          const handler = await prisma.handler.findUnique({
            where: { id: schedule.staffId },
            select: { first_name: true, last_name: true },
          });
          console.log("Found handler:", handler);
          if (handler) {
            staffName = `Handler: ${handler.first_name} ${handler.last_name}`;
          }
        } else if (schedule.staffType === "breeder") {
          const breeder = await prisma.breeder.findUnique({
            where: { id: schedule.staffId },
            select: { first_name: true, last_name: true },
          });
          console.log("Found breeder:", breeder);
          if (breeder) {
            staffName = `Breeder: ${breeder.first_name} ${breeder.last_name}`;
          }
        }
      }
      return {
        ...schedule,
        staffName,
      };
    })
  );

  console.log("Processed data:", processedData);

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
            {(role === "admin" || role === "HANDLER") && (
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
