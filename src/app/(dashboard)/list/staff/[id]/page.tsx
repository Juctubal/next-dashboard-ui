import FormModal from "@/components/FormModal";
import StaffTasks from "@/components/StaffTasks";
import Image from "next/image";
import Link from "next/link";
import { fetchStaffById } from "../fetchStaffData";
import { prisma } from "@/lib/prisma";
import {
  OneTimeSched,
  Prisma,
  RecurrentSchedules,
  Schedule,
  TaskCategory,
  UserRole,
  EventStatus,
} from "@prisma/client";

interface SingleStaffPageProps {
  params: {
    id: string;
  };
}

// Define the type for calendar events
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type: string;
  status?: string;
}

// Define the type for schedule with included relations
type ScheduleWithRelations = Schedule & {
  oneTime: OneTimeSched[];
  recurrent: RecurrentSchedules[];
  status: EventStatus;
};

const SingleStaffPage = async ({ params }: SingleStaffPageProps) => {
  const { id } = params;
  const staff = await fetchStaffById(id);

  if (!staff) {
    return <div className="p-4">Staff member not found</div>;
  }

  // Fetch schedules associated with this staff member
  const staffSchedules = (await prisma.schedule.findMany({
    where: {
      staffId: id,
      staffType: staff.role,
    },
    include: {
      oneTime: true,
      recurrent: true,
    },
  })) as ScheduleWithRelations[];

  // Count the number of schedules
  const scheduleCount = staffSchedules.length;

  // Fetch conditioning records for this handler
  const conditioningRecords = await prisma.conditioning.findMany({
    where: {
      handlerId: id,
    },
  });

  // Count the number of conditioning records
  const conditioningCount = conditioningRecords.length;

  console.log("Raw staff schedules:", staffSchedules);
  console.log("Conditioning records:", conditioningRecords);

  // Create calendar events from schedules
  const calendarEvents: CalendarEvent[] = [];

  // Add one-time schedules
  staffSchedules.forEach((schedule) => {
    console.log("Processing schedule:", schedule);
    schedule.oneTime.forEach((oneTime) => {
      console.log("Processing one-time schedule:", oneTime);
      calendarEvents.push({
        id: `oneTime-${oneTime.id}`,
        title: `${schedule.taskName}: ${oneTime.taskName}`,
        start: new Date(oneTime.taskDate),
        end: new Date(new Date(oneTime.taskDate).getTime() + 60 * 60 * 1000), // 1 hour duration
        allDay: false,
        type: "oneTime",
        status: schedule.status.toString(),
      });
    });

    // Add recurrent schedules
    schedule.recurrent.forEach((recurrent) => {
      console.log("Processing recurrent schedule:", recurrent);
      calendarEvents.push({
        id: `recurrent-${recurrent.id}`,
        title: `${schedule.taskName} (${recurrent.reccurencePattern})`,
        start: new Date(recurrent.startDate),
        end: new Date(new Date(recurrent.startDate).getTime() + 60 * 60 * 1000), // 1 hour duration
        allDay: false,
        type: "recurrent",
        status: schedule.status.toString(),
      });
    });
  });

  console.log("Final calendar events:", calendarEvents);

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-ggSky dark:bg-gray-800 py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src={staff.img || "/noAvatar.png"}
                alt={`${staff.first_name} ${staff.last_name}`}
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover border-4 border-white dark:border-gray-700"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{`${staff.first_name} ${staff.last_name}`}</h1>
                <FormModal table="staff" type="update" id={staff.id} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {staff.role} - {staff.status}
              </p>
              <div className="flex flex-col gap-2 text-xs font-medium">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Image src="/username.png" alt="" width={14} height={14} />
                  <span>Username: {staff.username}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Image src="/ID.png" alt="" width={14} height={14} />
                  <span>ID: {staff.id}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>Phone: {staff.phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>Email: {staff.email || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="flex flex-col w-full">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Conditioning
                </h1>
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                    {conditioningCount}
                  </span>
                </div>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="flex flex-col w-full">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Schedules
                </h1>
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                    {scheduleCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4">
          <StaffTasks events={calendarEvents} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex-col gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-md w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] flex gap-4">
          <Image
            src="/shortcut.svg"
            alt=""
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <div className="flex flex-col w-full">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Shortcuts
            </h1>
            <div className="mt-4 flex flex-col gap-2 text-xs text-gray-500">
              {staff.role === "handler" ? (
                <>
                  <Link
                    className="p-3 rounded-md bg-ggSkyLight dark:bg-blue-900/30 hover:bg-ggSky dark:hover:bg-blue-900/50 transition-colors text-gray-700 dark:text-gray-200 w-fit"
                    href="/list/conditioning"
                  >
                    Conditioning
                  </Link>
                  <Link
                    className="p-3 rounded-md bg-ggPurpleLight dark:bg-purple-900/30 hover:bg-ggPurple dark:hover:bg-purple-900/50 transition-colors text-gray-700 dark:text-gray-200 w-fit"
                    href="/list/events"
                  >
                    Events
                  </Link>
                  <Link
                    className="p-3 rounded-md bg-ggYellowLight dark:bg-yellow-900/30 hover:bg-ggYellow dark:hover:bg-yellow-900/50 transition-colors text-gray-700 dark:text-gray-200 w-fit"
                    href="/list/sparring"
                  >
                    Sparring
                  </Link>
                </>
              ) : staff.role === "breeder" ? (
                <>
                  <Link
                    className="p-3 rounded-md bg-ggSkyLight dark:bg-blue-900/30 hover:bg-ggSky dark:hover:bg-blue-900/50 transition-colors text-gray-700 dark:text-gray-200 w-fit"
                    href="/list/breeding"
                  >
                    Breeding
                  </Link>
                  <Link
                    className="p-3 rounded-md bg-ggPurpleLight dark:bg-purple-900/30 hover:bg-ggPurple dark:hover:bg-purple-900/50 transition-colors text-gray-700 dark:text-gray-200 w-fit"
                    href="/list/schedules"
                  >
                    Schedules
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    className="p-3 rounded-md bg-ggSkyLight dark:bg-blue-900/30 hover:bg-ggSky dark:hover:bg-blue-900/50 transition-colors text-gray-700 dark:text-gray-200 w-fit"
                    href="/"
                  >
                    Staff's Classes
                  </Link>
                  <Link
                    className="p-3 rounded-md bg-ggPurpleLight dark:bg-purple-900/30 hover:bg-ggPurple dark:hover:bg-purple-900/50 transition-colors text-gray-700 dark:text-gray-200 w-fit"
                    href="/"
                  >
                    Staff's Students
                  </Link>
                  <Link
                    className="p-3 rounded-md bg-ggYellowLight dark:bg-yellow-900/30 hover:bg-ggYellow dark:hover:bg-yellow-900/50 transition-colors text-gray-700 dark:text-gray-200 w-fit"
                    href="/"
                  >
                    Staff's Lessons
                  </Link>
                  <Link
                    className="p-3 rounded-md bg-pink-50 dark:bg-pink-900/30 hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors text-gray-700 dark:text-gray-200 w-fit"
                    href="/"
                  >
                    Staff's Exams
                  </Link>
                  <Link
                    className="p-3 rounded-md bg-ggSkyLight dark:bg-blue-900/30 hover:bg-ggSky dark:hover:bg-blue-900/50 transition-colors text-gray-700 dark:text-gray-200 w-fit"
                    href="/"
                  >
                    Staff's Assignments
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleStaffPage;
