import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Table from "@/components/Table";

interface EventsPageProps {
  params: {
    id: string;
  };
  searchParams: {
    gamefowlId: string;
  };
}

const EventsPage = async ({ params, searchParams }: EventsPageProps) => {
  const gamefowlId = parseInt(searchParams.gamefowlId);

  if (!gamefowlId) {
    notFound();
  }

  // Fetch the gamefowl and its event data through conditioning
  const gamefowl = await prisma.gamefowl.findUnique({
    where: { id: gamefowlId },
    include: {
      conditioning: {
        include: {
          conditioning: {
            include: {
              event: true,
              handler: true,
            },
          },
        },
      },
    },
  });

  if (!gamefowl) {
    notFound();
  }

  // Extract unique events from conditioning records
  const events = gamefowl.conditioning.map((conditioningGamefowl) => ({
    id: conditioningGamefowl.conditioning.event?.id,
    eventName: conditioningGamefowl.conditioning.event?.eventName,
    eventType: conditioningGamefowl.conditioning.event?.eventType,
    ageCategory: conditioningGamefowl.conditioning.event?.ageCategory,
    eventDate: conditioningGamefowl.conditioning.event?.eventDate,
    description: conditioningGamefowl.conditioning.event?.description,
    status: conditioningGamefowl.conditioning.event?.status,
    handler: conditioningGamefowl.conditioning.handler,
    startDate: conditioningGamefowl.conditioning.startDate,
    endDate: conditioningGamefowl.conditioning.endDate,
  }));

  // Remove duplicates based on event ID
  const uniqueEvents = events.filter(
    (event, index, self) => index === self.findIndex((e) => e.id === event.id)
  );

  // TODO: Replace with real data fetching
  const conditioningPrograms: any[] = [];
  const gamefowlColumns = [
    { header: "Name", accessor: "name" },
    { header: "Breed", accessor: "breed" },
    { header: "Age", accessor: "age" },
    { header: "Status", accessor: "status" },
  ];
  const gamefowls: any[] = [];

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-md">
          <h1 className="text-lg font-semibold dark:text-gray-200">
            {gamefowl.name}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Event Type
              </span>
              <span className="font-medium dark:text-gray-200">
                {gamefowl.conditioning[0]?.conditioning.event?.eventType}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Age Category
              </span>
              <span className="font-medium dark:text-gray-200">
                {gamefowl.conditioning[0]?.conditioning.event?.ageCategory}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Event Date
              </span>
              <span className="font-medium dark:text-gray-200">
                {gamefowl.conditioning[0]?.conditioning.event?.eventDate &&
                  new Intl.DateTimeFormat("en-US").format(
                    new Date(
                      gamefowl.conditioning[0].conditioning.event.eventDate
                    )
                  )}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Status
              </span>
              <span className="font-medium dark:text-gray-200">
                {gamefowl.conditioning[0]?.conditioning.event?.status}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Description
              </span>
              <span className="font-medium dark:text-gray-200">
                {gamefowl.conditioning[0]?.conditioning.event?.description}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-md">
          <h2 className="text-lg font-semibold dark:text-gray-200">
            Conditioning Programs
          </h2>
          <div className="mt-4">
            <Table
              columns={conditioningProgramColumns}
              data={conditioningPrograms}
              renderRow={renderConditioningProgramRow}
            />
          </div>
        </div>
      </div>

      <div className="w-full xl:w-80 flex flex-col gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-md">
          <h2 className="text-lg font-semibold dark:text-gray-200">
            Gamefowls
          </h2>
          <div className="mt-4">
            <Table
              columns={gamefowlColumns}
              data={gamefowls}
              renderRow={renderGamefowlRow}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Conditioning Program columns
const conditioningProgramColumns = [
  { header: "Program Name", accessor: "programName" },
  {
    header: "Description",
    accessor: "description",
    className: "hidden md:table-cell",
  },
  { header: "Actions", accessor: "action" },
];

// Types for table rows (replace with real types as needed)
type ConditioningProgram = any;
type Gamefowl = any;

const renderConditioningProgramRow = (program: ConditioningProgram) => (
  <tr
    key={program.id}
    className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
  >
    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">
      {program.programName}
    </td>
    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">
      {program.startDate
        ? new Date(program.startDate).toLocaleDateString()
        : "Not started"}
    </td>
    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">
      {program.endDate
        ? new Date(program.endDate).toLocaleDateString()
        : "Not ended"}
    </td>
    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">
      {program.status}
    </td>
  </tr>
);

const renderGamefowlRow = (gamefowl: Gamefowl) => (
  <tr
    key={gamefowl.id}
    className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
  >
    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">
      {gamefowl.name}
    </td>
    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">
      {gamefowl.breed}
    </td>
    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">
      {gamefowl.age}
    </td>
    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">
      {gamefowl.status}
    </td>
  </tr>
);

export default EventsPage;
