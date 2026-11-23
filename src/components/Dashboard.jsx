import React, { useEffect, useState } from "react";
import { fetchAlerts, fetchBlockedIPs, blockIP, unblockIP, triggerSimulatedAttack, connectWs } from "../services/api";
import AlertsTable from "./AlertsTable";
import TrafficChart from "./TrafficChart";
import SeverityPieChart from "./SeverityPieChart";

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ipSearch, setIpSearch] = useState("");
  const [simulating, setSimulating] = useState(false);

  const handleSimulate = async (type) => {
    setSimulating(true);
    try {
      await triggerSimulatedAttack(type);
    } catch (e) {
      console.error("Simulation failed:", e);
    } finally {
      setTimeout(() => setSimulating(false), 600);
    }
  };

  // initial load
  useEffect(() => {
    fetchAlerts()
      .then((data) => {
        if (Array.isArray(data)) setAlerts(data);
      })
      .catch((err) => console.error("Error fetching alerts:", err));

    fetchBlockedIPs()
      .then((data) => {
        if (Array.isArray(data)) setBlockedIPs(data);
      })
      .catch((err) => console.error("Error fetching blocked IPs:", err));
  }, []);

  // live updates
  useEffect(() => {
    const ws = connectWs((alert) => setAlerts((prev) => [alert, ...prev]));
    return () => ws.close();
  }, []);

  const handleBlockIP = async (ip) => {
    if (!ip) return;
    try {
      const res = await blockIP(ip);
      if (res && res.blocked_ips) setBlockedIPs(res.blocked_ips);
      else setBlockedIPs((prev) => [...prev, ip]);
    } catch (e) {
      console.error("Failed to block IP:", e);
    }
  };

  const handleUnblockIP = async (ip) => {
    if (!ip) return;
    try {
      const res = await unblockIP(ip);
      if (res && res.blocked_ips) setBlockedIPs(res.blocked_ips);
      else setBlockedIPs((prev) => prev.filter((item) => item !== ip));
    } catch (e) {
      console.error("Failed to unblock IP:", e);
    }
  };

  const exportCSV = () => {
    if (filteredAlerts.length === 0) return;
    const headers = ["ID", "Detected At", "Source IP", "Destination IP", "Attack Type", "Severity", "Detail"];
    const rows = filteredAlerts.map((a) => [
      a.id || "",
      `"${a.detected_at || ""}"`,
      `"${a.source_ip || ""}"`,
      `"${a.dest_ip || ""}"`,
      `"${a.type || ""}"`,
      `"${a.severity || ""}"`,
      `"${(a.detail || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NetShield_Alerts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (filteredAlerts.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredAlerts, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `NetShield_Alerts_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Extract unique alert types dynamically
  const alertTypes = Array.from(new Set(alerts.map((a) => a.type).filter(Boolean)));

  const filteredAlerts = alerts.filter((a) => {
    // Severity filter
    if (severityFilter !== "all" && (a.severity || "").toLowerCase() !== severityFilter.toLowerCase()) {
      return false;
    }
    // Type filter
    if (typeFilter !== "all" && (a.type || "").toLowerCase() !== typeFilter.toLowerCase()) {
      return false;
    }
    // IP filter (source or destination match)
    if (ipSearch.trim()) {
      const query = ipSearch.trim().toLowerCase();
      const matchSrc = (a.source_ip || "").toLowerCase().includes(query);
      const matchDst = (a.dest_ip || "").toLowerCase().includes(query);
      if (!matchSrc && !matchDst) return false;
    }
    return true;
  });

  const highCount = alerts.filter(a => (a.severity || "").toLowerCase() === "high").length;
  const medCount = alerts.filter(a => (a.severity || "").toLowerCase() === "medium").length;
  const lowCount = alerts.filter(a => (a.severity || "").toLowerCase() === "low").length;

  return (
    <div style={{
      padding: "2rem",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backgroundColor: "#030712", // Deep charcoal/pitch black
      backgroundImage: "radial-gradient(circle at 15% 15%, rgba(56, 189, 248, 0.04) 0%, transparent 45%), radial-gradient(circle at 85% 85%, rgba(224, 108, 40, 0.03) 0%, transparent 50%)",
      color: "#e2e8f0",
      minHeight: "100vh"
    }}>
      {/* Header Bar */}
      <header style={{
        marginBottom: "1.5rem",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        paddingBottom: "1.2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.2rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.8rem" }}>🛡️</span>
            <h1 style={{
              margin: 0,
              fontSize: "1.75rem",
              fontWeight: "700",
              letterSpacing: "-0.5px",
              background: "linear-gradient(135deg, #f8fafc 40%, #60a5fa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              NetShield SOC
            </h1>
            <span style={{
              background: "rgba(217, 119, 54, 0.12)",
              color: "#d97736",
              border: "1px solid rgba(217, 119, 54, 0.25)",
              borderRadius: "20px",
              padding: "0.2rem 0.6rem",
              fontSize: "0.75rem",
              fontWeight: "600",
              letterSpacing: "0.5px",
              textTransform: "uppercase"
            }}>
              SYSTEM ACTIVE
            </span>
          </div>
          <p style={{ margin: "0.4rem 0 0 0", color: "#64748b", fontSize: "0.9rem" }}>
            Real-time Intrusion Detection, Automated Threat Diagnosis & Firewall Mitigation
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.3rem 0.6rem",
            background: "rgba(217, 119, 54, 0.12)",
            border: "1px solid rgba(217, 119, 54, 0.3)",
            borderRadius: "6px",
            fontSize: "0.75rem",
            color: "#d97736",
            fontWeight: "700",
            letterSpacing: "0.5px"
          }}>
            <span>STEP 3</span>
            <span style={{ color: "#94a3b8", fontWeight: "400" }}>| Forensic Export</span>
          </div>
          <button
            onClick={exportCSV}
            title="Step 3: Download current filtered diagnosis records as a CSV spreadsheet"
            style={{
              padding: "0.5rem 1rem",
              background: "rgba(96, 165, 250, 0.1)",
              color: "#60a5fa",
              border: "1px solid rgba(96, 165, 250, 0.3)",
              borderRadius: "6px",
              fontSize: "0.85rem",
              cursor: "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "all 0.2s"
            }}
          >
            📥 Export CSV
          </button>
          <button
            onClick={exportJSON}
            title="Step 3: Download current filtered diagnosis records as raw JSON"
            style={{
              padding: "0.5rem 1rem",
              background: "rgba(255, 255, 255, 0.04)",
              color: "#cbd5e1",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "6px",
              fontSize: "0.85rem",
              cursor: "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "all 0.2s"
            }}
          >
            📋 Export JSON
          </button>
        </div>
      </header>

      {/* Interactive Attack Simulator Banner (Evaluator & Judge Demonstration) */}
      <div style={{
        background: "#080d1a",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        borderRadius: "10px",
        padding: "0.9rem 1.4rem",
        marginBottom: "1.8rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <span style={{ fontSize: "1.3rem" }}>⚡</span>
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#f8fafc" }}>
              Live Threat Simulator <span style={{ fontSize: "0.75rem", color: "#c99347", fontWeight: "normal", marginLeft: "0.4rem" }}>[Interactive Demo for Judges]</span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Inject a live intrusion pattern directly into the packet processing pipeline to test detection & defense:
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            onClick={() => handleSimulate("port_scan")}
            disabled={simulating}
            style={{
              padding: "0.45rem 0.9rem",
              background: "rgba(96, 165, 250, 0.1)",
              color: "#60a5fa",
              border: "1px solid rgba(96, 165, 250, 0.3)",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: simulating ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            🔍 Simulate Stealth Port Scan
          </button>
          <button
            onClick={() => handleSimulate("ddos")}
            disabled={simulating}
            style={{
              padding: "0.45rem 0.9rem",
              background: "rgba(217, 119, 54, 0.12)",
              color: "#d97736",
              border: "1px solid rgba(217, 119, 54, 0.3)",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: simulating ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            💥 Simulate SYN Flood (DDoS)
          </button>
          <button
            onClick={() => handleSimulate("malware")}
            disabled={simulating}
            style={{
              padding: "0.45rem 0.9rem",
              background: "rgba(201, 147, 71, 0.12)",
              color: "#c99347",
              border: "1px solid rgba(201, 147, 71, 0.3)",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: simulating ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            🦠 Simulate C2 Beaconing
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "flex", gap: "1.2rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {/* Total */}
        <div style={{
          flex: "1 1 200px",
          background: "#080d1a",
          padding: "1.2rem",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.07)",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)"
        }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Total Threat Events</div>
          <div style={{ fontSize: "1.85rem", fontWeight: "700", color: "#f8fafc", marginTop: "0.2rem" }}>{alerts.length}</div>
        </div>

        {/* High Severity - Soft Muted Amber */}
        <div style={{
          flex: "1 1 200px",
          background: "#080d1a",
          padding: "1.2rem",
          borderRadius: "10px",
          border: "1px solid rgba(217, 119, 54, 0.25)",
          borderLeft: "4px solid #d97736",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)"
        }}>
          <div style={{ fontSize: "0.8rem", color: "#d97736", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>Critical Threats</div>
          <div style={{ fontSize: "1.85rem", fontWeight: "700", color: "#d97736", marginTop: "0.2rem" }}>{highCount}</div>
        </div>

        {/* Medium Severity - Soft Warm Gold */}
        <div style={{
          flex: "1 1 200px",
          background: "#080d1a",
          padding: "1.2rem",
          borderRadius: "10px",
          border: "1px solid rgba(201, 147, 71, 0.25)",
          borderLeft: "4px solid #c99347",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)"
        }}>
          <div style={{ fontSize: "0.8rem", color: "#c99347", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>Suspicious Activity</div>
          <div style={{ fontSize: "1.85rem", fontWeight: "700", color: "#c99347", marginTop: "0.2rem" }}>{medCount}</div>
        </div>

        {/* Low Severity - Soft Pastel Arctic Blue */}
        <div style={{
          flex: "1 1 200px",
          background: "#080d1a",
          padding: "1.2rem",
          borderRadius: "10px",
          border: "1px solid rgba(96, 165, 250, 0.25)",
          borderLeft: "4px solid #60a5fa",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)"
        }}>
          <div style={{ fontSize: "0.8rem", color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>Routine Anomaly</div>
          <div style={{ fontSize: "1.85rem", fontWeight: "700", color: "#60a5fa", marginTop: "0.2rem" }}>{lowCount}</div>
        </div>
      </div>

      {/* Visualizations Grid: Step 1 Diagnosis */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "0.8rem",
        padding: "0.4rem 0.6rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{
            background: "rgba(96, 165, 250, 0.12)",
            color: "#60a5fa",
            border: "1px solid rgba(96, 165, 250, 0.3)",
            padding: "0.25rem 0.55rem",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: "700",
            letterSpacing: "0.5px"
          }}>
            STEP 1 • DIAGNOSE
          </span>
          <span style={{ fontSize: "0.9rem", color: "#e2e8f0", fontWeight: "600" }}>
            Visual Threat Telemetry
          </span>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
            — Pinpoint traffic volume spikes and real-time ML anomaly composition
          </span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div style={{
          background: "#080d1a",
          padding: "1.4rem",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.07)",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.05rem", margin: 0, color: "#f8fafc", fontWeight: "600" }}>Traffic Ingestion Flow (Events / Min)</h2>
            <span style={{ fontSize: "0.75rem", color: "#60a5fa", background: "rgba(96, 165, 250, 0.08)", border: "1px solid rgba(96, 165, 250, 0.2)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>ARCTIC FLOW</span>
          </div>
          <TrafficChart alerts={alerts} />
        </div>

        <div style={{
          background: "#080d1a",
          padding: "1.4rem",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.07)",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.05rem", margin: 0, color: "#f8fafc", fontWeight: "600" }}>Threat Severity Composition</h2>
            <span style={{ fontSize: "0.75rem", color: "#d97736", background: "rgba(217, 119, 54, 0.08)", border: "1px solid rgba(217, 119, 54, 0.25)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>AMBER ACCENT</span>
          </div>
          <SeverityPieChart alerts={alerts} />
        </div>
      </div>

      {/* Alerts Table with Multi-Facet Filters */}
      <div style={{
        background: "#080d1a",
        padding: "1.4rem",
        borderRadius: "10px",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)"
      }}>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1.2rem",
          marginBottom: "1.2rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          paddingBottom: "1.2rem"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{
                background: "rgba(201, 147, 71, 0.12)",
                color: "#c99347",
                border: "1px solid rgba(201, 147, 71, 0.3)",
                padding: "0.2rem 0.55rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: "700",
                letterSpacing: "0.5px"
              }}>
                STEP 2 • FILTER & PINPOINT
              </span>
              <h2 style={{ fontSize: "1.05rem", margin: 0, color: "#f8fafc", fontWeight: "600" }}>Intrusion Stream & Mitigations</h2>
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.3rem" }}>
              Search suspicious IPs or isolate attack vectors | Displaying <strong style={{ color: "#60a5fa" }}>{filteredAlerts.length}</strong> of {alerts.length} incident logs
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem" }}>
            {/* IP Address Search */}
            <div>
              <label style={{ marginRight: "0.5rem", fontSize: "0.8rem", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>IP Filter:</label>
              <input
                type="text"
                placeholder="Search IP..."
                value={ipSearch}
                onChange={(e) => setIpSearch(e.target.value)}
                style={{
                  padding: "0.4rem 0.7rem",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "#030712",
                  color: "#f8fafc",
                  fontSize: "0.85rem",
                  width: "160px",
                  outline: "none"
                }}
              />
            </div>

            {/* Type Filter */}
            <div>
              <label style={{ marginRight: "0.5rem", fontSize: "0.8rem", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>Attack:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  padding: "0.4rem 0.7rem",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "#030712",
                  color: "#f8fafc",
                  fontSize: "0.85rem",
                  outline: "none"
                }}
              >
                <option value="all">All Types</option>
                {alertTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ").toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label style={{ marginRight: "0.5rem", fontSize: "0.8rem", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>Severity:</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{
                  padding: "0.4rem 0.7rem",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "#030712",
                  color: "#f8fafc",
                  fontSize: "0.85rem",
                  outline: "none"
                }}
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Reset Button */}
            {(severityFilter !== "all" || typeFilter !== "all" || ipSearch) && (
              <button
                onClick={() => {
                  setSeverityFilter("all");
                  setTypeFilter("all");
                  setIpSearch("");
                }}
                style={{
                  padding: "0.4rem 0.8rem",
                  background: "rgba(217, 119, 54, 0.12)",
                  border: "1px solid rgba(217, 119, 54, 0.3)",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  color: "#d97736",
                  fontWeight: "600",
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
        <AlertsTable
          alerts={filteredAlerts}
          blockedIPs={blockedIPs}
          onBlockIP={handleBlockIP}
          onUnblockIP={handleUnblockIP}
        />
      </div>
    </div>
  );
}
