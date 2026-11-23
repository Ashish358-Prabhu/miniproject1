import React from "react";

const severityColors = {
  High: "#d97736",   // Soft, warm muted amber
  Medium: "#c99347", // Soft warm gold
  Low: "#60a5fa",    // Soft pastel arctic blue
};

export default function AlertsTable({ alerts = [], blockedIPs = [], onBlockIP = () => {}, onUnblockIP = () => {} }) {
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "0.9rem",
      }}
    >
      <thead>
        <tr style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94a3b8" }}>
          <th style={{ padding: "0.75rem 0.6rem", textAlign: "left", fontWeight: "600" }}>Time</th>
          <th style={{ padding: "0.75rem 0.6rem", textAlign: "left", fontWeight: "600" }}>Threat Origin</th>
          <th style={{ padding: "0.75rem 0.6rem", textAlign: "left", fontWeight: "600" }}>Dest IP</th>
          <th style={{ padding: "0.75rem 0.6rem", textAlign: "left", fontWeight: "600" }}>Classification</th>
          <th style={{ padding: "0.75rem 0.6rem", textAlign: "left", fontWeight: "600" }}>AI Confidence</th>
          <th style={{ padding: "0.75rem 0.6rem", textAlign: "left", fontWeight: "600" }}>Severity</th>
          <th style={{ padding: "0.75rem 0.6rem", textAlign: "left", fontWeight: "600" }}>Heuristic Evidence</th>
          <th style={{ padding: "0.75rem 0.6rem", textAlign: "center", fontWeight: "600" }}>
            <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
              <span style={{
                background: "rgba(217, 119, 54, 0.15)",
                color: "#d97736",
                border: "1px solid rgba(217, 119, 54, 0.3)",
                padding: "0.15rem 0.45rem",
                borderRadius: "4px",
                fontSize: "0.68rem",
                fontWeight: "700",
                letterSpacing: "0.5px"
              }}>
                STEP 3 ACTION
              </span>
              <span>Mitigation</span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {safeAlerts.length === 0 ? (
          <tr>
            <td colSpan="8" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
              Waiting for live alerts...
            </td>
          </tr>
        ) : (
          safeAlerts.map((a) => {
            const isBlocked = blockedIPs.includes(a.source_ip);
            const aiScore = a.ai_score || 85.0;
            return (
              <tr key={a.id || Math.random()} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)", transition: "background 0.2s" }}>
                <td style={{ padding: "0.7rem 0.6rem", color: "#64748b" }}>{a.detected_at ? new Date(a.detected_at).toLocaleTimeString() : "-"}</td>
                <td style={{ padding: "0.7rem 0.6rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>{a.origin_flag || "🌐"}</span>
                    <span style={{ fontFamily: "Consolas, monospace", color: "#e2e8f0" }}>{a.source_ip || "-"}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>
                    {a.origin || "External"} • {a.threat_actor || "Host"}
                    {isBlocked && (
                      <span style={{ marginLeft: "0.4rem", padding: "0.1rem 0.35rem", background: "rgba(217, 119, 54, 0.15)", color: "#d97736", border: "1px solid rgba(217, 119, 54, 0.3)", borderRadius: "3px", fontSize: "0.65rem", fontWeight: "600" }}>
                        BLOCKED
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "0.7rem 0.6rem", fontFamily: "Consolas, monospace", color: "#64748b" }}>{a.dest_ip || "-"}</td>
                <td style={{ padding: "0.7rem 0.6rem", color: "#cbd5e0", fontWeight: "500" }}>{(a.type || "-").replace("_", " ").toUpperCase()}</td>
                <td style={{ padding: "0.7rem 0.6rem" }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    background: aiScore >= 90 ? "rgba(217, 119, 54, 0.12)" : aiScore >= 70 ? "rgba(201, 147, 71, 0.12)" : "rgba(96, 165, 250, 0.12)",
                    color: aiScore >= 90 ? "#d97736" : aiScore >= 70 ? "#c99347" : "#60a5fa",
                    border: `1px solid ${aiScore >= 90 ? "rgba(217, 119, 54, 0.25)" : aiScore >= 70 ? "rgba(201, 147, 71, 0.25)" : "rgba(96, 165, 250, 0.25)"}`
                  }}>
                    🤖 {aiScore}%
                  </span>
                </td>
                <td style={{ padding: "0.7rem 0.6rem", color: severityColors[a.severity] || severityColors[(a.severity || "").charAt(0).toUpperCase() + (a.severity || "").slice(1).toLowerCase()] || "#94a3b8", fontWeight: "600" }}>
                  {a.severity || "Unknown"}
                </td>
                <td style={{ padding: "0.7rem 0.6rem", color: "#94a3b8", fontSize: "0.85rem" }}>{a.detail || "-"}</td>
                <td style={{ padding: "0.7rem 0.6rem", textAlign: "center" }}>
                  {isBlocked ? (
                    <button
                      onClick={() => onUnblockIP(a.source_ip)}
                      style={{
                        padding: "0.28rem 0.7rem",
                        background: "transparent",
                        color: "#60a5fa",
                        border: "1px solid rgba(96, 165, 250, 0.35)",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s",
                      }}
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => onBlockIP(a.source_ip)}
                      style={{
                        padding: "0.28rem 0.7rem",
                        background: (a.severity || "").toLowerCase() === "high" ? "#d97736" : "rgba(255, 255, 255, 0.05)",
                        color: (a.severity || "").toLowerCase() === "high" ? "#ffffff" : "#94a3b8",
                        border: (a.severity || "").toLowerCase() === "high" ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s",
                      }}
                    >
                      Block IP
                    </button>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
