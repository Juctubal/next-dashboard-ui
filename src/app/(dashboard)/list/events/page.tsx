import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { eventsData, role } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Event, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

const columns = [
  {
    header: "Event Name",
    accessor: "eventName",
  },
  {
    header: "Event Type",
    accessor: "eventType",
    className: "hidden md:table-cell",
  },
  {
    header: "Age Category",
    accessor: "ageCategory",
    className: "hidden md:table-cell",
  },
  {
    header: "Event Date",
    accessor: "date",
    className: "hidden md:table-cell",
  },
  {
    header: "Description",
    accessor: "desc",
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

const renderRow = (item: Event) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-ggPurpleLight"
  >
    <td className="flex items-center gap-4 p-4">{item.eventName}</td>
    <td className="hidden md:table-cell">{item.eventType}</td>
    <td className="hidden md:table-cell text-center align-middle">
      {item.ageCategory}
    </td>
    <td className="hidden md:table-cell">
      {new Intl.DateTimeFormat("en-US").format(item.eventDate)}
    </td>
    <td className="hidden md:table-cell">{item.description}</td>
    <td className="hidden md:table-cell">{item.status}</td>
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
            <FormModal table="exam" type="update" data={item} />
            <FormModal table="exam" type="delete" id={item.id} />
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
  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.EventWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "eventId":
            query.conditioning = {
              some: {
                eventId: parseInt(value),
              },
            };
            break;
          case "search":
            query.OR = [
              { eventName: { contains: value, mode: "insensitive" } },
              { description: { contains: value, mode: "insensitive" } },
            ];
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.event.findMany({
      where: query,
      include: {
        conditioning: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.event.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Events</h1>
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
              // <button className="w-8 h-8 flex items-center justify-center rounded-full bg-ggYellow">
              //   <Image src="/plus.png" alt="" width={14} height={14} />
              // </button>
              <FormModal table="event" type="create" />
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

export default EventListPage;
