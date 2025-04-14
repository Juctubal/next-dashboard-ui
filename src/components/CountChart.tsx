"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";

const CountChart = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const [data, setData] = useState([
    {
      name: "Total",
      count: 0,
      fill: isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(255, 255, 255, 0.1)",
    },
    {
      name: "Female",
      count: 0,
      fill: isDarkMode ? "#FCD34D" : "#FAE27C", // Darker yellow for dark mode
    },
    {
      name: "Male",
      count: 0,
      fill: isDarkMode ? "#93C5FD" : "#C3EBFA", // Darker blue for dark mode
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [maleCount, setMaleCount] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/counts");

        if (!response.ok) {
          throw new Error("Failed to fetch counts");
        }

        const result = await response.json();

        setMaleCount(result.maleGamefowlCount || 0);
        setFemaleCount(result.femaleGamefowlCount || 0);
        setTotalCount(result.gamefowlCount || 0);

        setData([
          {
            name: "Total",
            count: result.gamefowlCount || 0,
            fill: isDarkMode
              ? "rgba(75, 85, 99, 0.3)"
              : "rgba(255, 255, 255, 0.1)",
          },
          {
            name: "Female",
            count: result.femaleGamefowlCount || 0,
            fill: isDarkMode ? "#FCD34D" : "#FAE27C", // Darker yellow for dark mode
          },
          {
            name: "Male",
            count: result.maleGamefowlCount || 0,
            fill: isDarkMode ? "#93C5FD" : "#C3EBFA", // Darker blue for dark mode
          },
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isDarkMode]);

  // Calculate percentages
  const malePercentage =
    totalCount > 0 ? Math.round((maleCount / totalCount) * 100) : 0;
  const femalePercentage =
    totalCount > 0 ? Math.round((femaleCount / totalCount) * 100) : 0;

  // Custom legend component
  const CustomLegend = () => {
    return (
      <div className="flex justify-center gap-8 mt-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-4 h-4 rounded-full ${
              isDarkMode ? "bg-blue-300" : "bg-ggSky"
            }`}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium dark:text-gray-200">Male</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {maleCount} ({malePercentage}%)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-4 h-4 rounded-full ${
              isDarkMode ? "bg-yellow-300" : "bg-ggYellow"
            }`}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium dark:text-gray-200">
              Female
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {femaleCount} ({femalePercentage}%)
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full h-full p-4">
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold dark:text-gray-200">Gamefowls</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      {/* CHART */}
      <div className="relative w-full h-[75%]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading data...</p>
          </div>
        ) : (
          <ResponsiveContainer>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="100%"
              barSize={32}
              data={data}
            >
              <RadialBar background dataKey="count" />
            </RadialBarChart>
          </ResponsiveContainer>
        )}
        <Image
          src="/maleFemale.png"
          alt=""
          width={50}
          height={50}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      {/* LEGEND */}
      <CustomLegend />
    </div>
  );
};

export default CountChart;
