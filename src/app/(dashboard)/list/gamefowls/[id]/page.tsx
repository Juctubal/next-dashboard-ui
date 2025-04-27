import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import Performance from "@/components/Performance";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calculateGamefowlAge } from "@/lib/utils";
import { notFound } from "next/navigation";
import GamefowlTasks from "@/components/GamefowlTasks";
import { GamefowlSex } from "@prisma/client";
import GamefowlProfileSection from "@/components/GamefowlProfileSection";
import GamefowlSparringModalWrapper from "@/components/GamefowlSparringModalWrapper";
import SparringMatchesCard from "@/components/SparringMatchesCard";
import SparringMatchModalWrapper from "@/components/SparringMatchModalWrapper";
import TaskDetailsModalWrapper from "@/components/TaskDetailsModalWrapper";

// Define the props for the page
interface GamefowlPageProps {
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
}

// Define the type for sparring matches
interface SparringMatch {
  id: number;
  sparringDate: Date;
  gamefowl1: {
    id: number;
    name: string;
    img: string | null;
  };
  gamefowl2: {
    id: number;
    name: string;
    img: string | null;
  };
  winner: {
    id: number;
    name: string;
  } | null;
  loser: {
    id: number;
    name: string;
  } | null;
  eloChange: number;
}

const SingleGamefowlPage = async ({ params }: GamefowlPageProps) => {
  // Fetch the gamefowl data
  const gamefowl = await prisma.gamefowl.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      conditioning: {
        include: {
          conditioning: {
            include: {
              conProg: {
                include: {
                  activities: true,
                },
              },
              event: true,
              handler: true,
            },
          },
        },
      },
      sparring_1: {
        include: {
          gamefowl1: {
            select: {
              id: true,
              name: true,
              img: true,
            },
          },
          gamefowl2: {
            select: {
              id: true,
              name: true,
              img: true,
            },
          },
          winner: {
            select: {
              id: true,
              name: true,
            },
          },
          loser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      sparring_2: {
        include: {
          gamefowl1: {
            select: {
              id: true,
              name: true,
              img: true,
            },
          },
          gamefowl2: {
            select: {
              id: true,
              name: true,
              img: true,
            },
          },
          winner: {
            select: {
              id: true,
              name: true,
            },
          },
          loser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      sparring_winner: true,
      sparring_loser: true,
      vaccine: true,
      deworming: true,
    },
  });

  // If gamefowl not found, return 404
  if (!gamefowl) {
    notFound();
  }

  // Calculate age category
  const ageCategory =
    gamefowl.age || calculateGamefowlAge(gamefowl.date_hatched, gamefowl.sex);

  // Count sparring matches
  const sparringCount = gamefowl.sparring_1.length + gamefowl.sparring_2.length;

  // Count wins and losses
  const wins = gamefowl.sparring_winner.length;
  const losses = gamefowl.sparring_loser.length;

  // Get Elo rating
  const eloRating = gamefowl.eloRating || 1000;

  // Combine all sparring matches with Elo changes
  const allSparringMatches: SparringMatch[] = [
    ...gamefowl.sparring_1.map((match) => ({
      ...match,
      eloChange:
        match.winner?.id === gamefowl.id
          ? match.winner_elo_change
          : -match.loser_elo_change,
    })),
    ...gamefowl.sparring_2.map((match) => ({
      ...match,
      eloChange:
        match.winner?.id === gamefowl.id
          ? match.winner_elo_change
          : -match.loser_elo_change,
    })),
  ];

  // Create calendar events from conditioning data
  const calendarEvents: CalendarEvent[] = gamefowl.conditioning.map(
    (conditioningGamefowl) => ({
      id: `conditioning-${conditioningGamefowl.conditioning.id}`,
      title: `Conditioning: ${conditioningGamefowl.conditioning.conProg.programName}`,
      start: conditioningGamefowl.conditioning.startDate,
      end: conditioningGamefowl.conditioning.endDate,
      allDay: false,
      type: "conditioning",
    })
  );

  // Add sparring events
  const sparringEvents: CalendarEvent[] = [
    ...gamefowl.sparring_1.map((sparring) => ({
      id: `sparring-1-${sparring.id}`,
      title: `Sparring Match`,
      start: sparring.sparringDate,
      end: new Date(new Date(sparring.sparringDate).getTime() + 60 * 60 * 1000), // 1 hour duration
      allDay: false,
      type: "sparring",
    })),
    ...gamefowl.sparring_2.map((sparring) => ({
      id: `sparring-2-${sparring.id}`,
      title: `Sparring Match`,
      start: sparring.sparringDate,
      end: new Date(new Date(sparring.sparringDate).getTime() + 60 * 60 * 1000), // 1 hour duration
      allDay: false,
      type: "sparring",
    })),
  ];

  // Add medical events
  const medicalEvents: CalendarEvent[] = [
    ...gamefowl.vaccine.map((vaccine) => ({
      id: `medical-${vaccine.id}`,
      title: `Vaccination: ${vaccine.name || "Unnamed"}`,
      start: vaccine.vaccinationDate,
      end: new Date(
        new Date(vaccine.vaccinationDate).getTime() + 30 * 60 * 1000
      ), // 30 minutes duration
      allDay: false,
      type: "medical",
      medicalId: vaccine.id,
    })),
    ...gamefowl.deworming.map((deworming) => ({
      id: `medical-${deworming.id}`,
      title: `Deworming: ${deworming.name || "Unnamed"}`,
      start: deworming.dewormDate,
      end: new Date(new Date(deworming.dewormDate).getTime() + 30 * 60 * 1000), // 30 minutes duration
      allDay: false,
      type: "medical",
      medicalId: deworming.id,
    })),
  ];

  // Combine all events
  const allEvents = [...calendarEvents, ...sparringEvents, ...medicalEvents];

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 w-full">
      {/* Include the modal wrapper components */}
      <GamefowlSparringModalWrapper />
      <SparringMatchModalWrapper />
      <TaskDetailsModalWrapper />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center text-sm text-gray-500 mb-2">
        <Link
          href="/list/gamefowls"
          className="hover:text-blue-600 transition-colors"
        >
          Gamefowls
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 font-medium">{gamefowl.name}</span>
      </div>

      {/* Header Section */}
      <div className="bg-gradient-to-r from-ggSky to-blue-100 dark:from-ggSky/80 dark:to-blue-900/50 rounded-lg p-6 shadow-sm w-full">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Gamefowl Image */}
          <GamefowlProfileSection gamefowl={gamefowl} />

          {/* Gamefowl Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">
              {gamefowl.name}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
              {gamefowl.bloodline}
            </p>

            <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                <Image src="/mail.png" alt="" width={16} height={16} />
                <span className="text-gray-700 dark:text-gray-300">
                  ID: {gamefowl.id}
                </span>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                <Image src="/date.png" alt="" width={16} height={16} />
                <span className="text-gray-700 dark:text-gray-300">
                  {gamefowl.date_hatched
                    ? new Date(gamefowl.date_hatched).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                <Image src="/phone.png" alt="" width={16} height={16} />
                <span className="text-gray-700 dark:text-gray-300">
                  Age: {ageCategory || "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Sparring Count Card */}
        <SparringMatchesCard
          gamefowlId={gamefowl.id}
          gamefowlName={gamefowl.name}
          sparringCount={sparringCount}
          sparringMatches={allSparringMatches}
          sex={gamefowl.sex}
        />

        {/* Wins/Losses Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
              <Image
                src="/singleBranch.png"
                alt=""
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 font-medium">
              Win/Loss Record
            </h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-800 dark:text-gray-200">
              {gamefowl.sex === GamefowlSex.FEMALE
                ? "N/A"
                : `${wins}-${losses}`}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {gamefowl.sex === GamefowlSex.FEMALE ? "" : "win-loss ratio"}
            </span>
          </div>
        </div>

        {/* Elo Rating Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full">
              <Image
                src="/singleLesson.png"
                alt=""
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 font-medium">
              Elo Rating
            </h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-800 dark:text-gray-200">
              {gamefowl.sex === GamefowlSex.FEMALE ? "N/A" : eloRating}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {gamefowl.sex === GamefowlSex.FEMALE ? "" : "skill rating"}
            </span>
          </div>
        </div>

        {/* Age Category Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-full">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 font-medium">
              Age Category
            </h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-800 dark:text-gray-200">
              {ageCategory || "Unknown"}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              current category
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Left Column - Detailed Information */}
        <div className="lg:w-1/3 flex flex-col gap-6">
          {/* Bloodline Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Bloodline Information
            </h2>
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
              <Image src="/blood.png" alt="" width={20} height={20} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bloodline
                </p>
                <p className="font-medium dark:text-gray-200">
                  {gamefowl.bloodline}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Quick Links
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <Link
                className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium flex items-center gap-2 dark:text-gray-200"
                href={`/list/conditioning/${gamefowl.id}?gamefowlId=${gamefowl.id}`}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                Conditioning Information
              </Link>
              <Link
                className="p-3 rounded-md bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium flex items-center gap-2 dark:text-gray-200"
                href={`/list/events/${gamefowl.id}?gamefowlId=${gamefowl.id}`}
              >
                <div className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400"></div>
                Event Information
              </Link>
              <Link
                className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors text-sm font-medium flex items-center gap-2 dark:text-gray-200"
                href={`/list/sparring/${gamefowl.id}?gamefowlId=${gamefowl.id}`}
              >
                <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400"></div>
                Sparring History
              </Link>
              <Link
                className="p-3 rounded-md bg-pink-50 dark:bg-pink-900/30 hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors text-sm font-medium flex items-center gap-2 dark:text-gray-200"
                href={`/list/medical/${gamefowl.id}?gamefowlId=${gamefowl.id}`}
              >
                <div className="w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-400"></div>
                Medical Records
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column - Schedule */}
        <div className="lg:w-2/3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm h-auto min-h-[500px] w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Gamefowl Schedule
              </h2>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <button className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <GamefowlTasks events={allEvents} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleGamefowlPage;
