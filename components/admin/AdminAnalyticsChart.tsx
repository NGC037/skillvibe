"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminAnalyticsChart({
  confirmed,
  pending,
}: {
  confirmed: number;
  pending: number;
}) {
  const data = [
    {
      name: "Confirmed",
      value: confirmed,
    },
    {
      name: "Pending",
      value: pending,
    },
  ];

  return (
    <div className="w-full h-[250px]">

      <ResponsiveContainer width="100%" height="100%">

        <BarChart data={data}>

          <XAxis dataKey="name" />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="value"
            fill="#6366f1"
            radius={[6, 6, 0, 0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>
  );
}