"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Define colors for each age classification
const COLORS = [
  "#FAE27C",
  "#C3EBFA",
  "#FF9F7F",
  "#A5D8DD",
  "#FFB6C1",
  "#DDA0DD",
];

const GamefowlAgeChart = () => {
  const [data, setData] = useState([
    { name: "Chick", count: 0 },
    { name: "Pullet", count: 0 },
    { name: "Hen", count: 0 },
    { name: "Stag", count: 0 },
    { name: "Bullstag", count: 0 },
    { name: "Cock", count: 0 },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGamefowlData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/gamefowl/list");
        if (!response.ok) {
          throw new Error("Failed to fetch gamefowl data");
        }
        const gamefowls = await response.json();

        // Count gamefowls by age
        const ageCounts = {
          CHICK: 0,
          PULLET: 0,
          HEN: 0,
          STAG: 0,
          BULLSTAG: 0,
          COCK: 0,
        };

        gamefowls.forEach((gamefowl: any) => {
          if (gamefowl.age) {
            ageCounts[gamefowl.age as keyof typeof ageCounts]++;
          }
        });

        // Update state with real data
        setData([
          { name: "Chick", count: ageCounts.CHICK },
          { name: "Pullet", count: ageCounts.PULLET },
          { name: "Hen", count: ageCounts.HEN },
          { name: "Stag", count: ageCounts.STAG },
          { name: "Bullstag", count: ageCounts.BULLSTAG },
          { name: "Cock", count: ageCounts.COCK },
        ]);
      } catch (error) {
        console.error("Error fetching gamefowl data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGamefowlData();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 h-full">
      <div className="flex justify-between items-center pb-4">
        <h1 className="text-lg font-semibold dark:text-gray-200">
          Gamefowl Age Distribution
        </h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-[80%]">
          <p className="text-gray-500">Loading gamefowl data...</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <BarChart width={500} height={300} data={data} barSize={40}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#ddd"
              className="dark:stroke-gray-700"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tick={{ fill: "#d1d5db" }}
              tickLine={false}
              className="dark:text-gray-400"
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "#d1d5db" }}
              tickLine={false}
              className="dark:text-gray-400"
            />
            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                borderColor: "lightgray",
                backgroundColor: "white",
                color: "black",
              }}
            />
            <Bar dataKey="count" fill="#8884d8" radius={[10, 10, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default GamefowlAgeChart;
