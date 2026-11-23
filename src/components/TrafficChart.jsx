import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function TrafficChart({ alerts = [] }) {
  // Build simple time‑bucketed data (last 5 minutes)
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const now = Date.now();
  const data = Array.from({ length: 5 }, (_, i) => {
    const minute = new Date(now - i * 60000);
    const count = safeAlerts.filter(
      a => a && a.detected_at && new Date(a.detected_at) > minute
    ).length;
    return {
      time: minute.toLocaleTimeString([], { minute: "2-digit" }),
      count,
    };
  }).reverse();

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
          <XAxis dataKey="time" stroke="#475569" fontSize="0.8rem" />
          <YAxis allowDecimals={false} stroke="#475569" fontSize="0.8rem" />
          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(96, 165, 250, 0.2)", color: "#cbd5e1", borderRadius: "8px", boxShadow: "0 4px 14px rgba(0,0,0,0.5)" }} />
          <Line type="monotone" dataKey="count" stroke="#60a5fa" strokeWidth={2.2} dot={{ r: 3, fill: "#60a5fa", stroke: "#0b0f19", strokeWidth: 1.5 }} activeDot={{ r: 5, fill: "#d97736" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

