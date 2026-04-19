"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { MonthlyEventPoint } from "@/lib/admin-analytics";

export default function AdminAnalyticsChart({
  monthlyEvents,
}: {
  monthlyEvents: MonthlyEventPoint[];
}) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={monthlyEvents}
          margin={{ top: 12, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#4b5563", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#4b5563", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 12px 28px -18px rgba(15, 23, 42, 0.28)",
            }}
          />
          <Bar dataKey="count" fill="#6366f1" radius={[10, 10, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
