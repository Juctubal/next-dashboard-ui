"use client";

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { eventsData, role } from "@/lib/data";

import {
  Conditioning,
  Event,
  Handler,
  Gamefowl,
} from "@prisma/client";
// Use the correct ConditioningProgram interface for the frontend table row
interface ConditioningProgram {
  id: string;
  programName: string;
  description: string;
  isArchived: boolean;
}
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { ColumnDef, Row } from "@tanstack/react-table";
import EventTableRow from "./EventTableRow";
import ConditioningTableRow from "./ConditioningTableRow";
import EventFilters from "./EventFilters";
import ConditioningFilters from "./ConditioningFilters";
import ConditioningProgramFilters from "./ConditioningProgramFilters";
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

import ConditioningProgramTableRow from "./ConditioningProgramTableRow";

const renderConditioningProgramRow = (item: ConditioningProgram) => (
  <ConditioningProgramTableRow item={item} role={role} />
); // type is already present, but ensure ConditioningProgram is imported from the correct interface

// If you want to be explicit and avoid any confusion, you can do:
// const renderConditioningProgramRow = (item: ConditioningProgram): JSX.Element => (
//   <ConditioningProgramTableRow item={item} role={role} />
// );

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

// We don't need a separate context for refreshing
import React from 'react';

const EventListPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Add a key to force remounting

  // Function to force a data refresh
  const forceRefresh = useCallback(() => {
    console.log('Force refreshing data...');
    setRefreshKey(prev => prev + 1);
  }, []);

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
    showArchived = "false",
  } = Object.fromEntries(searchParams.entries());

  const p = page ? parseInt(page) : 1;

  const getTabParams = (targetTab: string) => {
    // Create a clean object with just the parameters we want to keep
    const params: Record<string, string> = { tab: targetTab };
    
    // Keep other relevant parameters when switching tabs
    params.page = "1"; // Reset to page 1 when switching tabs
    
    if (showArchived === "true") {
      params.showArchived = "true";
    }
    
    const searchValue = searchParams.get("search");
    if (searchValue) {
      params.search = searchValue;
    }
    
    if (sortBy) {
      params.sortBy = sortBy;
    }
    
    if (sortOrder) {
      params.sortOrder = sortOrder;
    }
    
    return params;
  };

  // Toggle archive visibility
  const toggleArchived = () => {
    const newShowArchived = showArchived === "true" ? "false" : "true";
    const params = new URLSearchParams(window.location.search);
    params.set("showArchived", newShowArchived);
    params.set("page", "1"); // Reset to page 1 when toggling archived
    
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  useEffect(() => {
    // This effect will run whenever refreshKey changes
    console.log('Effect triggered with refreshKey:', refreshKey);
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Debug: Log current state of showArchived
        console.log('Current showArchived param:', { showArchived, type: typeof showArchived });
        
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
          showArchived,  // "true" or "false" as string
        });
        
        // Debug: Log constructed URL params
        console.log('API request URL params:', params.toString());

        const response = await fetch(`/api/events?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        
        // Debug: Log API response
        console.log('API response:', result);
    if (tab === "conditioningPrograms" && Array.isArray(result.data)) {
      setData(result.data.map((item: ConditioningProgram) => ({
        ...item,
        id: typeof item.id === 'number' ? String(item.id) : item.id,
        programName: item.programName ?? '',
        description: item.description ?? '',
        isArchived: typeof item.isArchived === 'boolean' ? item.isArchived : false,
      })));
    } else {
      setData(result.data || []);
    }
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
    console.log('Data fetch triggered with dependencies:', { 
      page: p, 
      sortBy, 
      sortOrder, 
      eventType, 
      ageCategory, 
      status, 
      startDate, 
      endDate, 
      tab, 
      showArchived 
    });
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
    showArchived,
  ]);

  return (
    <div key={refreshKey} className="bg-white dark:bg-gray-800 p-4 rounded-md flex-1 m-4 mt-0">
        {/* TOP */}
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold dark:text-gray-200">
            Events & Conditioning
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch disabled={loading || !data || data.length === 0} />
            <div className="flex items-center gap-4 self-end">
              {/* Archive Toggle Button */}
              <button
                onClick={toggleArchived}
                className={`flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium ${showArchived === "true" ? "bg-ggPurple text-white hover:bg-ggPurpleLight" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
              >
                {showArchived === "true" ? "Showing Archived" : "Archive"}
              </button>
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
              {tab === "conditioningPrograms" && (
                <ConditioningProgramFilters
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
              renderRow={(item) => (
                <EventTableRow
                  item={{
                    ...item,
                    eventDate: typeof item.eventDate === "string" ? new Date(item.eventDate) : item.eventDate,
                  }}
                  role={role}
                />
              )}
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
