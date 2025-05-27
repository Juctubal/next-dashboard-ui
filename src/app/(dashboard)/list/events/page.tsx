"use client";

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { eventsData, role } from "@/lib/data";
import { ITEM_PER_PAGE } from "@/lib/settings";
import {
  Conditioning,
  ConditioningProgram,
  Event,
  Handler,
  Prisma,
  EventGamefowl,
  Gamefowl,
  EventType,
  AgeCategory,
  EventStatus,
  ConditioningStatus,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ColumnDef, Row } from "@tanstack/react-table";
import EventTableRow from "./EventTableRow";
import ConditioningTableRow from "./ConditioningTableRow";
import EventFilters from "./EventFilters";
import ConditioningFilters from "./ConditioningFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { EventWithRelations } from "@/types/event";

// Event columns
const eventColumns = [
  {
    header: "Event Name",
    accessor: "eventName",
  },
  {
    header: "Event Type",
    accessor: "eventType",
    className: "hidden lg:table-cell",
  },
  {
    header: "Age Category",
    accessor: "ageCategory",
    className: "hidden lg:table-cell",
  },
  {
    header: "Event Date",
    accessor: "eventDate",
    className: "hidden lg:table-cell",
  },
  {
    header: "Gamefowls",
    accessor: "gamefowl",
    className: "hidden lg:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

// Conditioning Program columns
const conditioningProgramColumns = [
  {
    header: "Program Name",
    accessor: "programName",
  },
  {
    header: "Description",
    accessor: "description",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

// Conditioning columns
const conditioningColumns = [
  {
    header: "Gamefowls",
    accessor: "gamefowls",
  },
  {
    header: "Program Name",
    accessor: "programName",
  },
  {
    header: "Event Name",
    accessor: "eventName",
  },
  {
    header: "Handler Name",
    accessor: "handlerName",
    className: "hidden lg:table-cell",
  },
  {
    header: "Start Date",
    accessor: "startDate",
    className: "hidden md:table-cell",
  },
  {
    header: "End Date",
    accessor: "endDate",
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

const renderConditioningProgramRow = (item: ConditioningProgram) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
  >
    <td className="p-4 dark:text-gray-200">
      <div className="flex flex-col">
        <span>{item.programName}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ID: {item.id}
        </span>
      </div>
    </td>
    <td className="hidden md:table-cell p-4 dark:text-gray-200">
      {item.description}
    </td>
    <td>
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            <FormModal table="conditioningProgram" type="update" data={item} />
            <FormModal table="conditioningProgram" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

const renderConditioningRow = (
  item: Conditioning & {
    conProg: ConditioningProgram;
    event: Event;
    handler: Handler;
    gamefowls: {
      gamefowl: Gamefowl;
    }[];
  }
) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
  >
    <td className="p-4 dark:text-gray-200">
      <div className="flex flex-wrap gap-1">
        {item.gamefowls.map(({ gamefowl }) => (
          <span
            key={gamefowl.id}
            className="px-2 py-1 bg-ggPurpleLight dark:bg-gray-700 rounded-md text-xs"
          >
            {gamefowl.name} (ID: {gamefowl.id})
          </span>
        ))}
      </div>
    </td>
    <td className="p-4 dark:text-gray-200">{item.conProg.programName}</td>
    <td className="p-4 dark:text-gray-200">
      {item.event?.eventName || "No event"}
    </td>
    <td className="p-4 dark:text-gray-200">
      {item.handler.first_name} {item.handler.last_name}
    </td>
    <td className="hidden md:table-cell p-4 dark:text-gray-200">
      {new Intl.DateTimeFormat("en-US").format(item.startDate)}
    </td>
    <td className="hidden md:table-cell p-4 dark:text-gray-200">
      {item.endDate
        ? new Intl.DateTimeFormat("en-US").format(item.endDate)
        : "Not set"}
    </td>
    <td className="p-4 dark:text-gray-200">
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          item.status === "ASSIGNED"
            ? "bg-blue-100 text-blue-800"
            : "bg-green-100 text-green-800"
        }`}
      >
        {item.status}
      </span>
    </td>
    <td>
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            <FormModal table="conditioning" type="update" data={item} />
            <FormModal table="conditioning" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

const EventListPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const {
    page,
    tab = "events",
    sortBy,
    sortOrder = "desc",
    eventType,
    ageCategory,
    status,
    startDate,
    endDate,
  } = Object.fromEntries(searchParams.entries());

  const p = page ? parseInt(page) : 1;

  const getTabParams = (targetTab: string) => {
    // Only include tab and page when switching tabs
    return {
      tab: targetTab,
      ...(page && { page: "1" }), // Reset to first page when switching tabs
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: p.toString(),
          tab,
          ...(sortBy && { sortBy }),
          sortOrder,
          ...(eventType && { eventType }),
          ...(ageCategory && { ageCategory }),
          ...(status && { status }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        });

        const response = await fetch(`/api/events?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        setData(result.data || []);
        setCount(result.count || 0);
      } catch (error) {
        console.error("Error fetching data:", error);
        setData([]);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    p,
    tab,
    sortBy,
    sortOrder,
    eventType,
    ageCategory,
    status,
    startDate,
    endDate,
  ]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold dark:text-gray-200">
          Events & Conditioning
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch disabled={loading || !data || data.length === 0} />
          <div className="flex items-center gap-4 self-end">
            {tab === "events" && (
              <EventFilters
                eventType={eventType}
                ageCategory={ageCategory}
                status={status}
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            )}
            {tab === "conditioning" && (
              <ConditioningFilters
                status={status}
                startDate={startDate}
                endDate={endDate}
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            )}
            {role === "admin" && (
              <>
                {tab === "events" && <FormModal table="event" type="create" />}
                {tab === "conditioningPrograms" && (
                  <FormModal table="conditioningProgram" type="create" />
                )}
                {tab === "conditioning" && (
                  <FormModal table="conditioning" type="create" />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 mt-4">
        <Link
          href={{
            pathname: "/list/events",
            query: getTabParams("events"),
          }}
          className={`px-4 py-2 font-medium text-sm ${
            tab === "events"
              ? "border-b-2 border-ggPurple text-ggPurple dark:text-ggPurple"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Events
        </Link>
        <Link
          href={{
            pathname: "/list/events",
            query: getTabParams("conditioningPrograms"),
          }}
          className={`px-4 py-2 font-medium text-sm ${
            tab === "conditioningPrograms"
              ? "border-b-2 border-ggPurple text-ggPurple dark:text-ggPurple"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Conditioning Programs
        </Link>
        <Link
          href={{
            pathname: "/list/events",
            query: getTabParams("conditioning"),
          }}
          className={`px-4 py-2 font-medium text-sm ${
            tab === "conditioning"
              ? "border-b-2 border-ggPurple text-ggPurple dark:text-ggPurple"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Conditioning
        </Link>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ggPurple"></div>
        </div>
      ) : (
        <>
          {tab === "events" && (
            <Table
              columns={eventColumns}
              renderRow={(item) => <EventTableRow item={item} role={role} />}
              data={data}
            />
          )}
          {tab === "conditioningPrograms" && (
            <Table
              columns={conditioningProgramColumns}
              renderRow={renderConditioningProgramRow}
              data={data}
            />
          )}
          {tab === "conditioning" && (
            <Table
              columns={conditioningColumns}
              renderRow={(item) => (
                <ConditioningTableRow item={item} role={role} />
              )}
              data={data}
            />
          )}
        </>
      )}

      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default EventListPage;
