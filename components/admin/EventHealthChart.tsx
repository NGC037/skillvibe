"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = ["#6366f1", "#a3a3a3"];

export default function EventHealthChart({
  confirmed,
  pending,
}: {
  confirmed: number;
  pending: number;
}) {

  const data = [
    { name: "Confirmed", value: confirmed },
    { name: "Pending", value: pending },
  ];

  return (

    <div className="w-full h-[250px]">

      <ResponsiveContainer width="100%" height="100%">

        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            outerRadius={90}
            label={({ name, percent }) =>
              `${name} ${Math.round((percent ?? 0) * 100)}%`
            }
          >

            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index]}
              />
            ))}

          </Pie>

          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 12px 28px -18px rgba(15, 23, 42, 0.28)",
            }}
          />

        </PieChart>

      </ResponsiveContainer>

    </div>

  );
}
