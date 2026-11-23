import axios from "axios";

const HTTP = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

export const fetchAlerts = async (limit = 20) => {
  const res = await HTTP.get("/alerts", { params: { limit } });
  return res.data;
};

export const fetchBlockedIPs = async () => {
  const res = await HTTP.get("/blocked-ips");
  return res.data.blocked_ips || [];
};

export const blockIP = async (ip) => {
  const res = await HTTP.post("/block-ip", { ip });
  return res.data;
};

export const unblockIP = async (ip) => {
  const res = await HTTP.post("/unblock-ip", { ip });
  return res.data;
};

export const triggerSimulatedAttack = async (type) => {
  const res = await HTTP.post("/simulate-attack", { type });
  return res.data;
};

export const connectWs = (onMessage) => {
  const ws = new WebSocket("ws://localhost:8000/ws/alerts");
  ws.onmessage = (e) => onMessage(JSON.parse(e.data));
  ws.onclose = () => console.warn("Alert WS closed");
  return ws;
};

export default { fetchAlerts, connectWs };
