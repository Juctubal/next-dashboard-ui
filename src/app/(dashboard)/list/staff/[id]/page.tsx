import FormModal from "@/components/FormModal";
import StaffTasks from "@/components/StaffTasks";
import StaffProfileSection from "@/components/StaffProfileSection";
import Link from "next/link";
import Image from "next/image";
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
  RecurringTaskCompletion,
} from "@prisma/client";
import ProfilePictureModal from "@/components/ProfilePictureModal";
import { useState } from "react";
import { currentUser } from "@clerk/nextjs/server";
import StaffTaskDetailsModalWrapper from "@/components/StaffTaskDetailsModalWrapper";
import { format } from "date-fns";

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
  oneTimeId?: string;
  recurrentId?: string;
  completionId?: string;
  scheduleStartDate?: Date;
  scheduleEndDate?: Date;
  taskType?: string;
  taskCategory?: string;
  description?: string;
  completed?: boolean;
  taskDate?: Date;
  completionStatus?: boolean;
  repeatIndefinitely?: boolean;
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
  const currentUserData = await currentUser();
  const currentUserId = currentUserData?.id;
  const currentUserRole = currentUserData?.publicMetadata?.role as string;

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

  // Fetch all recurring task completions for this staff member
  const recurringTaskCompletions =
    await prisma.recurringTaskCompletion.findMany({
      where: {
        recurrentId: {
          in: staffSchedules.flatMap((schedule) =>
            schedule.recurrent.map((recurrent) => recurrent.id)
          ),
        },
      },
      include: {
        recurrentSchedule: {
          include: {
            schedule: true,
          },
        },
      },
    });

  console.log("=== DEBUG: Recurring Task Completions ===");
  console.log("Number of completion records:", recurringTaskCompletions.length);
  console.log(
    "Completion records:",
    JSON.stringify(recurringTaskCompletions, null, 2)
  );

  // Count the number of schedules
  const scheduleCount = staffSchedules.length;

  // Fetch conditioning records for this handler
  const conditioningRecords = await prisma.conditioning.findMany({
    where: {
      handlerId: id,
    },
  });

  // Fetch all breeding records for breeders
  const breedingRecords =
    staff.role === "breeder"
      ? await prisma.breeding.findMany({
          where: {
            isArchived: false,
          },
        })
      : [];

  // Count the number of conditioning records
  const conditioningCount = conditioningRecords.length;

  // Count the number of breeding records
  const breedingCount = breedingRecords.length;

  console.log("Raw staff schedules:", staffSchedules);
  console.log("Conditioning records:", conditioningRecords);
  console.log("Breeding records:", breedingRecords);

  // Create calendar events from schedules
  const calendarEvents: CalendarEvent[] = [];

  // Add one-time schedules
  staffSchedules.forEach((schedule) => {
    schedule.oneTime.forEach((oneTime) => {
      const [hours, minutes] = oneTime.time_of_day.split(":").map(Number);
      const startDate = new Date(oneTime.taskDate);
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);

      calendarEvents.push({
        id: `oneTime-${schedule.id}-${oneTime.id}`,
        title: `${schedule.taskName}: ${oneTime.taskName}`,
        start: startDate,
        end: endDate,
        allDay: false,
        type: "oneTime",
        status: schedule.status.toString(),
        oneTimeId: oneTime.id.toString(),
        taskType: schedule.taskType,
        taskCategory: schedule.taskCategory,
        description: schedule.descript,
      });
    });

    // Add recurrent schedules
    schedule.recurrent.forEach((recurrent) => {
      console.log(
        `\n=== DEBUG: Processing Recurrent Schedule ${recurrent.id} ===`
      );
      console.log("Recurrent schedule:", JSON.stringify(recurrent, null, 2));

      const [hours, minutes] = recurrent.time_of_day.split(":").map(Number);

      // For DAILY pattern, generate events for each day in the range
      if (recurrent.reccurencePattern === "DAILY") {
        if (!recurrent.startDate || !recurrent.endDate) return;
        const startDate = new Date(recurrent.startDate);
        const endDate = new Date(recurrent.endDate);
        const currentDate = new Date(startDate);

        console.log(
          `\n=== DEBUG: Generating Daily Events for ${recurrent.id} ===`
        );
        console.log("Start date:", startDate.toISOString());
        console.log("End date:", endDate.toISOString());

        // Generate events for each day in the range
        while (currentDate <= endDate) {
          const eventDate = new Date(currentDate);
          eventDate.setHours(hours, minutes, 0, 0);

          const eventEndDate = new Date(eventDate);
          eventEndDate.setHours(eventEndDate.getHours() + 1);

          // Create completion date in local timezone
          const completionDate = new Date(currentDate);
          completionDate.setHours(0, 0, 0, 0);

          console.log(
            `\n=== DEBUG: Processing Date ${currentDate.toISOString()} ===`
          );
          console.log("Looking for completion record with:", {
            recurrentId: recurrent.id,
            completionDate: completionDate.toISOString(),
          });

          const completionRecord = recurringTaskCompletions.find(
            (completion) => {
              const completionDateUTC = new Date(completion.date);
              completionDateUTC.setHours(0, 0, 0, 0);
              const match =
                completion.recurrentId === recurrent.id &&
                completionDateUTC.getTime() === completionDate.getTime();

              if (match) {
                console.log("Found matching completion record:", {
                  completionId: completion.id,
                  recurrentId: completion.recurrentId,
                  completionDate: completion.date.toISOString(),
                  completed: completion.completed,
                });
              }

              return match;
            }
          );

          calendarEvents.push({
            id: `recurrent-${recurrent.id}-${format(
              currentDate,
              "yyyy-MM-dd"
            )}`,
            title: `${schedule.taskName} (${recurrent.reccurencePattern})`,
            start: eventDate,
            end: eventEndDate,
            allDay: false,
            type: "recurrent",
            status: completionRecord?.completed ? "FINISHED" : "ASSIGNED",
            recurrentId: recurrent.id.toString(),
            scheduleStartDate: new Date(recurrent.startDate),
            scheduleEndDate: new Date(recurrent.endDate),
            taskType: schedule.taskType,
            taskCategory: schedule.taskCategory,
            description: schedule.descript,
            completed: completionRecord?.completed || false,
            completionId: completionRecord?.id.toString(),
            repeatIndefinitely: recurrent.repeatIndefinitely || false,
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else if (recurrent.reccurencePattern === "WEEKLY") {
        if (!recurrent.startDate || !recurrent.endDate) return;
        const startDate = new Date(recurrent.startDate);
        const endDate = new Date(recurrent.endDate);
        const currentDate = new Date(startDate);

        // Parse the weekDays JSON string
        const weekDays = JSON.parse(recurrent.weekDays || "[]") as string[];
        const dayNameToNumber: { [key: string]: number } = {
          Sunday: 0,
          Monday: 1,
          Tuesday: 2,
          Wednesday: 3,
          Thursday: 4,
          Friday: 5,
          Saturday: 6,
        };
        const selectedWeekDays = weekDays.map((day) => dayNameToNumber[day]);

        console.log(
          `\n=== DEBUG: Generating Weekly Events for ${recurrent.id} ===`
        );
        console.log("Selected days:", {
          weekDays,
          selectedWeekDays,
        });

        // Generate events for each day in the range
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay();
          const dayName = Object.keys(dayNameToNumber).find(
            (key) => dayNameToNumber[key] === dayOfWeek
          );

          if (selectedWeekDays.includes(dayOfWeek)) {
            const eventDate = new Date(currentDate);
            eventDate.setHours(hours, minutes, 0, 0);

            const eventEndDate = new Date(eventDate);
            eventEndDate.setHours(eventEndDate.getHours() + 1);

            // Create completion date in local timezone
            const completionDate = new Date(currentDate);
            completionDate.setHours(0, 0, 0, 0);

            console.log(
              `\n=== DEBUG: Processing Date ${currentDate.toISOString()} (${dayName}) ===`
            );
            console.log("Looking for completion record with:", {
              recurrentId: recurrent.id,
              completionDate: completionDate.toISOString(),
            });

            const completionRecord = recurringTaskCompletions.find(
              (completion) => {
                const completionDateUTC = new Date(completion.date);
                completionDateUTC.setHours(0, 0, 0, 0);
                const match =
                  completion.recurrentId === recurrent.id &&
                  completionDateUTC.getTime() === completionDate.getTime();

                if (match) {
                  console.log("Found matching completion record:", {
                    completionId: completion.id,
                    recurrentId: completion.recurrentId,
                    completionDate: completion.date.toISOString(),
                    completed: completion.completed,
                  });
                }

                return match;
              }
            );

            calendarEvents.push({
              id: `recurrent-${recurrent.id}-${format(
                currentDate,
                "yyyy-MM-dd"
              )}`,
              title: `${schedule.taskName} (${recurrent.reccurencePattern})`,
              start: eventDate,
              end: eventEndDate,
              allDay: false,
              type: "recurrent",
              status: completionRecord?.completed ? "FINISHED" : "ASSIGNED",
              recurrentId: recurrent.id.toString(),
              scheduleStartDate: new Date(recurrent.startDate),
              scheduleEndDate: new Date(recurrent.endDate),
              taskType: schedule.taskType,
              taskCategory: schedule.taskCategory,
              description: schedule.descript,
              completed: completionRecord?.completed || false,
              completionId: completionRecord?.id.toString(),
              repeatIndefinitely: recurrent.repeatIndefinitely || false,
            });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else if (recurrent.reccurencePattern === "CUSTOM") {
        if (!recurrent.customDate) return;

        try {
          const customDates = JSON.parse(recurrent.customDate) as string[];
          if (customDates.length === 0) return;

          // Use first and last custom dates as schedule start and end dates
          const scheduleStartDate = new Date(customDates[0]);
          const scheduleEndDate = new Date(customDates[customDates.length - 1]);

          // Generate events for each custom date
          for (const dateStr of customDates) {
            const currentDate = new Date(dateStr);
            const eventDate = new Date(currentDate);
            eventDate.setHours(hours, minutes, 0, 0);

            const eventEndDate = new Date(eventDate);
            eventEndDate.setHours(eventEndDate.getHours() + 1);

            // Create completion date in local timezone
            const completionDate = new Date(currentDate);
            completionDate.setHours(0, 0, 0, 0);

            console.log(
              `\n=== DEBUG: Processing Custom Date ${currentDate.toISOString()} ===`
            );
            console.log("Looking for completion record with:", {
              recurrentId: recurrent.id,
              completionDate: completionDate.toISOString(),
            });

            const completionRecord = recurringTaskCompletions.find(
              (completion) => {
                const completionDateUTC = new Date(completion.date);
                completionDateUTC.setHours(0, 0, 0, 0);
                const match =
                  completion.recurrentId === recurrent.id &&
                  completionDateUTC.getTime() === completionDate.getTime();

                if (match) {
                  console.log("Found matching completion record:", {
                    completionId: completion.id,
                    recurrentId: completion.recurrentId,
                    completionDate: completion.date.toISOString(),
                    completed: completion.completed,
                  });
                }

                return match;
              }
            );

            calendarEvents.push({
              id: `recurrent-${recurrent.id}-${format(
                currentDate,
                "yyyy-MM-dd"
              )}`,
              title: `${schedule.taskName} (${recurrent.reccurencePattern})`,
              start: eventDate,
              end: eventEndDate,
              allDay: false,
              type: "recurrent",
              status: completionRecord?.completed ? "FINISHED" : "ASSIGNED",
              recurrentId: recurrent.id.toString(),
              scheduleStartDate,
              scheduleEndDate,
              taskType: schedule.taskType,
              taskCategory: schedule.taskCategory,
              description: schedule.descript,
              completed: completionRecord?.completed || false,
              completionId: completionRecord?.id.toString(),
              repeatIndefinitely: recurrent.repeatIndefinitely || false,
            });
          }
        } catch (error) {
          console.error("Error parsing custom dates:", error);
        }
      } else {
        if (!recurrent.startDate || !recurrent.endDate) return;
        const startDate = new Date(recurrent.startDate);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);

        const completionDate = new Date(startDate);
        completionDate.setHours(0, 0, 0, 0);

        console.log(
          `\n=== DEBUG: Processing Non-Daily Schedule ${recurrent.id} ===`
        );
        console.log("Looking for completion record with:", {
          recurrentId: recurrent.id,
          completionDate: completionDate.toISOString(),
        });

        const completionRecord = recurringTaskCompletions.find((completion) => {
          const completionDateUTC = new Date(completion.date);
          completionDateUTC.setHours(0, 0, 0, 0);
          const match =
            completion.recurrentId === recurrent.id &&
            completionDateUTC.getTime() === completionDate.getTime();

          if (match) {
            console.log("Found matching completion record:", {
              completionId: completion.id,
              recurrentId: completion.recurrentId,
              completionDate: completion.date.toISOString(),
              completed: completion.completed,
            });
          }

          return match;
        });

        calendarEvents.push({
          id: `recurrent-${recurrent.id}-${format(startDate, "yyyy-MM-dd")}`,
          title: `${schedule.taskName} (${recurrent.reccurencePattern})`,
          start: startDate,
          end: endDate,
          allDay: false,
          type: "recurrent",
          status: completionRecord?.completed ? "FINISHED" : "ASSIGNED",
          recurrentId: recurrent.id.toString(),
          scheduleStartDate: new Date(recurrent.startDate),
          scheduleEndDate: new Date(recurrent.endDate),
          taskType: schedule.taskType,
          taskCategory: schedule.taskCategory,
          description: schedule.descript,
          completed: completionRecord?.completed || false,
          completionId: completionRecord?.id.toString(),
          repeatIndefinitely: recurrent.repeatIndefinitely || false,
        });
      }
    });
  });

  console.log("\n=== DEBUG: Final Calendar Events ===");
  console.log("Number of events:", calendarEvents.length);
  console.log("Events:", JSON.stringify(calendarEvents, null, 2));

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* Include the modal wrapper component */}
      <StaffTaskDetailsModalWrapper />

      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-ggSky dark:bg-gray-800 py-6 px-4 rounded-md flex-1 flex gap-4">
            <StaffProfileSection staff={staff} />
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{`${staff.first_name} ${staff.last_name}`}</h1>
                {(currentUserRole === "admin" ||
                  currentUserId === staff.id) && (
                  <FormModal table="staff" type="update" id={staff.id} />
                )}
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
                  {staff.role === "handler"
                    ? "Conditioning"
                    : "Breeding Projects"}
                </h1>
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                    {staff.role === "handler"
                      ? conditioningCount
                      : breedingCount}
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
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* Shortcuts */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-md w-full flex gap-4">
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
