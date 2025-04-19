"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const UserCard = ({ type }: { type: string }) => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentMonth, setCurrentMonth] = useState<string>("");

  useEffect(() => {
    // Get current month name
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const currentDate = new Date();
    setCurrentMonth(monthNames[currentDate.getMonth()]);

    const fetchCount = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/counts");

        if (!response.ok) {
          throw new Error("Failed to fetch counts");
        }

        const data = await response.json();

        // Set the count based on the card type
        switch (type.toLowerCase()) {
          case "gamefowl":
            setCount(data.gamefowlCount);
            break;
          case "handler":
            setCount(data.handlerCount);
            break;
          case "breeder":
            setCount(data.breederCount);
            break;
          case "events":
            setCount(data.upcomingEvents);
            break;
          default:
            setCount(0);
        }
      } catch (error) {
        console.error("Error fetching count:", error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, [type]);

  return (
    <div className="rounded-2xl odd:bg-indigo-100 even:bg-amber-100 p-4 flex-1 min-w-[130px] dark:odd:bg-indigo-900/70 dark:even:bg-amber-900/70 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-center">
        <span className="text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-indigo-600 dark:text-indigo-300 font-medium">
          {new Date().getFullYear()}
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>
      <h1 className="text-2xl font-semibold my-4 text-gray-800 dark:text-gray-100 text-center sm:text-left">
        {loading ? "..." : count.toLocaleString()}
      </h1>
      <h2 className="capitalize text-small font-medium text-gray-600 dark:text-gray-300 text-center sm:text-left">
        {type === "events" ? `${currentMonth}'s Events` : type}
      </h2>
    </div>
  );
};

export default UserCard;
