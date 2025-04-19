import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { eventsData, role } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import {
  Conditioning,
  ConditioningProgram,
  Event,
  Handler,
  Prisma,
  EventGamefowl,
  Gamefowl,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { ColumnDef, Row } from "@tanstack/react-table";

type EventWithRelations = Event & {
  gamefowl: (EventGamefowl & {
    gamefowl: Gamefowl;
  })[];
};

// Event columns
const eventColumns = [
  {
    header: "Event Name",
    accessor: "eventName",
  },
  {
    header: "Event Type",
    accessor: "eventType",
  },
  {
    header: "Age Category",
    accessor: "ageCategory",
  },
  {
    header: "Event Date",
    accessor: "eventDate",
  },
  {
    header: "Status",
    accessor: "status",
  },
  {
    header: "Gamefowls",
    accessor: "gamefowl",
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
    header: "Actions",
    accessor: "action",
  },
];

const renderEventRow = (
  item: Event & { gamefowl: { gamefowl: { id: number; name: string } }[] }
) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
  >
    <td className="flex items-center gap-4 p-4 dark:text-gray-200">
      {item.eventName}
    </td>
    <td className="hidden md:table-cell dark:text-gray-200">
      {item.eventType}
    </td>
    <td className="hidden md:table-cell text-center align-middle dark:text-gray-200">
      {item.ageCategory}
    </td>
    <td className="hidden md:table-cell dark:text-gray-200">
      {new Intl.DateTimeFormat("en-US").format(item.eventDate)}
    </td>
    {/* <td className="hidden md:table-cell dark:text-gray-200">
      {item.description}
    </td> */}
    <td className="hidden md:table-cell dark:text-gray-200">{item.status}</td>
    <td className="hidden md:table-cell dark:text-gray-200">
      {item.gamefowl && item.gamefowl.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {item.gamefowl.map((gamefowl) => (
            <span
              key={gamefowl.gamefowl.id}
              className="px-2 py-1 bg-ggPurpleLight dark:bg-gray-700 rounded-md text-xs"
            >
              {gamefowl.gamefowl.name} (ID: {gamefowl.gamefowl.id})
            </span>
          ))}
        </div>
      ) : (
        <span className="text-gray-400">No gamefowls</span>
      )}
    </td>
    <td>
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            <FormModal table="event" type="update" data={item} />
            <FormModal table="event" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

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
    <td className="p-4 dark:text-gray-200">{item.event.eventName}</td>
    <td className="p-4 dark:text-gray-200">
      {item.handler.first_name} {item.handler.last_name}
    </td>
    <td className="hidden md:table-cell p-4 dark:text-gray-200">
      {new Intl.DateTimeFormat("en-US").format(item.startDate)}
    </td>
    <td className="hidden md:table-cell p-4 dark:text-gray-200">
      {new Intl.DateTimeFormat("en-US").format(item.endDate)}
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

const EventListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, tab = "events", ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const eventQuery: Prisma.EventWhereInput = {};
  const conditioningProgramQuery: Prisma.ConditioningProgramWhereInput = {};
  const conditioningQuery: Prisma.ConditioningWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "eventId":
            conditioningQuery.eventId = parseInt(value);
            break;
          case "search":
            if (tab === "events") {
              eventQuery.OR = [
                { eventName: { contains: value, mode: "insensitive" } },
                { description: { contains: value, mode: "insensitive" } },
              ];
            } else if (tab === "conditioningPrograms") {
              conditioningProgramQuery.OR = [
                { programName: { contains: value, mode: "insensitive" } },
                { description: { contains: value, mode: "insensitive" } },
              ];
            } else if (tab === "conditioning") {
              conditioningQuery.OR = [
                {
                  gamefowls: {
                    some: {
                      gamefowl: {
                        id: parseInt(value) || undefined,
                      },
                    },
                  },
                },
                {
                  conProg: {
                    programName: { contains: value, mode: "insensitive" },
                  },
                },
                {
                  event: {
                    eventName: { contains: value, mode: "insensitive" },
                  },
                },
                {
                  handler: {
                    OR: [
                      { first_name: { contains: value, mode: "insensitive" } },
                      { last_name: { contains: value, mode: "insensitive" } },
                    ],
                  },
                },
              ];
            }
            break;
        }
      }
    }
  }

  // Fetch data based on the active tab
  let data: any[] = [];
  let count = 0;

  if (tab === "events") {
    const events = await prisma.event.findMany({
      include: {
        gamefowl: {
          include: {
            gamefowl: true,
          },
        },
      },
      orderBy: {
        eventDate: "desc",
      },
    });
    data = events;
    count = events.length;
  } else if (tab === "conditioningPrograms") {
    [data, count] = await prisma.$transaction([
      prisma.conditioningProgram.findMany({
        where: conditioningProgramQuery,
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.conditioningProgram.count({ where: conditioningProgramQuery }),
    ]);
  } else if (tab === "conditioning") {
    [data, count] = await prisma.$transaction([
      prisma.conditioning.findMany({
        where: conditioningQuery,
        include: {
          conProg: true,
          event: true,
          handler: true,
          gamefowls: {
            include: {
              gamefowl: true,
            },
          },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.conditioning.count({ where: conditioningQuery }),
    ]);
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold dark:text-gray-200">
          Events & Conditioning
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch disabled={data.length === 0} />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
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
            query: { ...queryParams, tab: "events" },
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
            query: { ...queryParams, tab: "conditioningPrograms" },
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
            query: { ...queryParams, tab: "conditioning" },
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
      {tab === "events" && (
        <Table columns={eventColumns} renderRow={renderEventRow} data={data} />
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
          renderRow={renderConditioningRow}
          data={data}
        />
      )}

      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default EventListPage;
