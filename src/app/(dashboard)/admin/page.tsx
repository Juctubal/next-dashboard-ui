import Announcements from "@/components/Announcements";
import GamefowlAgeChart from "@/components/AttendanceChart";
import CountChart from "@/components/CountChart";
import EventCalendar from "@/components/EventCalendar";
import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";
import Link from "next/link";

const AdminPage = () => {
  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* USER CARDS  */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="gamefowl" />
          <UserCard type="handler" />
          <UserCard type="breeder" />
          <UserCard type="events" />
        </div>
        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* COUNT CHART */}
          <div className="w-full lg:w-1/3 h-[450px] bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <CountChart />
          </div>
          {/* GAMEFOWL AGE CHART */}
          <div className="w-full lg:w-2/3 h-[450px] bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <GamefowlAgeChart />
          </div>
        </div>

        {/* BOTTOM CHART */}
        {/* <div className="w-full h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <FinanceChart />
        </div> */}
      </div>
      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <EventCalendar />
        </div>
        {/* <Announcements /> */}
      </div>
    </div>
  );
};

export default AdminPage;
