import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const SEVERITY_COLORS = {
  high: "#d97736",   // Muted, soft warm apricot amber
  medium: "#c99347", // Soft pastel golden amber
  low: "#60a5fa",    // Soft pastel arctic periwinkle
};

export default function SeverityPieChart({ alerts = [] }) {
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  const counts = safeAlerts.reduce(
    (acc, alert) => {
      const sev = (alert.severity || "low").toLowerCase();
      if (acc[sev] !== undefined) {
        acc[sev] += 1;
      } else {
        acc.low += 1;
      }
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );

  const data = [
    { name: "High Severity", value: counts.high, color: SEVERITY_COLORS.high },
    { name: "Medium Severity", value: counts.medium, color: SEVERITY_COLORS.medium },
    { name: "Low Severity", value: counts.low, color: SEVERITY_COLORS.low },
  ].filter((item) => item.value > 0);

  if (safeAlerts.length === 0 || data.length === 0) {
    return (
      <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#868e96", fontSize: "0.9rem" }}>
        No alert data for distribution yet
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
            label={({ name, percent, value }) => `${value} (${(percent * 100).toFixed(0)}%)`}
            labelLine={{ stroke: "#4a5568", strokeWidth: 1 }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} alerts (${((value / safeAlerts.length) * 100).toFixed(1)}%)`, name]}
            contentStyle={{ backgroundColor: "#0b0f19", borderColor: "rgba(56, 189, 248, 0.2)", color: "#e2e8f0", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.6)" }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value, entry) => {
              const count = entry && entry.payload ? entry.payload.value : 0;
              return `${value}: ${count}`;
            }}
            wrapperStyle={{ color: "#a0aec0", fontSize: "0.85rem" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
