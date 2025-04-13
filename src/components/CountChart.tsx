"use client";

import Image from "next/image";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  {
    name: "Total",
    count: 106,
    fill: "rgba(255, 255, 255, 0.1)",
  },
  {
    name: "Girls",
    count: 53,
    fill: "rgba(250, 226, 124, 0.3)",
  },
  {
    name: "Boys",
    count: 53,
    fill: "rgba(195, 235, 250, 0.3)",
  },
];

const CountChart = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full h-full p-4">
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold dark:text-gray-200">Gamefowls</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      {/* CHART */}
      <div className="relative w-full h-[75%]">
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
        <Image
          src="/maleFemale.png"
          alt=""
          width={50}
          height={50}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      {/* BOTTOM */}
      <div className="flex justify-center gap-16">
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-ggSky rounded-full" />
          <h1 className="font-bold dark:text-gray-200">1,234</h1>
          <h2 className="text-xs text-gray-300 dark:text-gray-400">
            Boys (55%)
          </h2>
        </div>
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-ggYellow rounded-full" />
          <h1 className="font-bold dark:text-gray-200">1,234</h1>
          <h2 className="text-xs text-gray-300 dark:text-gray-400">
            Girls (45%)
          </h2>
        </div>
      </div>
    </div>
  );
};

export default CountChart;
