import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import random
import datetime

app = FastAPI()
# Allow any origin for demo purposes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connected: set[WebSocket] = set()
# In‑memory storage for alerts (demo placeholder)
_alerts: list[dict] = []
_blocked_ips: set[str] = set()

@app.get("/")
async def root():
    return {"message": "NetShield API – use /api/alerts or /ws/alerts"}

# ---------- Blocklist endpoints ----------
@app.get("/api/blocked-ips")
async def get_blocked_ips():
    return {"blocked_ips": sorted(list(_blocked_ips))}

@app.post("/api/block-ip")
async def block_ip(data: dict):
    ip = data.get("ip")
    if ip:
        _blocked_ips.add(ip)
        return {"status": "success", "message": f"IP {ip} has been blocked", "blocked_ips": sorted(list(_blocked_ips))}
    return {"status": "error", "message": "IP address is required"}, 400

@app.post("/api/unblock-ip")
async def unblock_ip(data: dict):
    ip = data.get("ip")
    if ip and ip in _blocked_ips:
        _blocked_ips.remove(ip)
        return {"status": "success", "message": f"IP {ip} unblocked", "blocked_ips": sorted(list(_blocked_ips))}
    return {"status": "error", "message": "IP address not found in blocklist"}, 404

# Threat intelligence lookup (Simulated IP geo-resolution & reputation)
THREAT_INTEL = {
    "10.0.0.1": {"country": "Internal Lab", "flag": "🏢", "threat_actor": "Local Host"},
    "192.168.1.5": {"country": "LAN Device", "flag": "💻", "threat_actor": "Internal Workstation"},
    "172.16.0.3": {"country": "DMZ Server", "flag": "🛡️", "threat_actor": "Gateway Node"},
    "185.220.101.5": {"country": "Germany", "flag": "🇩🇪", "threat_actor": "Tor Exit Node"},
    "45.33.32.156": {"country": "United States", "flag": "🇺🇸", "threat_actor": "Cloud VPS Scanner"},
    "194.26.29.112": {"country": "Netherlands", "flag": "🇳🇱", "threat_actor": "Known Botnet C2"},
}

def enrich_alert(alert: dict) -> dict:
    src = alert.get("source_ip", "")
    intel = THREAT_INTEL.get(src, {"country": "Unknown", "flag": "🌐", "threat_actor": "External IP"})
    alert["origin"] = intel["country"]
    alert["origin_flag"] = intel["flag"]
    alert["threat_actor"] = intel["threat_actor"]
    # Simulated AI / Machine Learning Anomaly Score (Random Forest / Isolation Forest probability)
    sev = (alert.get("severity") or "").lower()
    if sev == "high":
        alert["ai_score"] = round(random.uniform(91.0, 99.4), 1)
    elif sev == "medium":
        alert["ai_score"] = round(random.uniform(72.0, 89.5), 1)
    else:
        alert["ai_score"] = round(random.uniform(45.0, 68.0), 1)
    return alert

# ---------- Attack Simulator Endpoint ----------
@app.post("/api/simulate-attack")
async def simulate_attack(data: dict):
    attack_type = data.get("type", "port_scan")
    if attack_type == "ddos":
        alert = {
            "source_ip": "194.26.29.112",
            "dest_ip": "192.168.1.1",
            "type": "ddos",
            "severity": "high",
            "detail": "SYN Flood volumetric spike: >1,200 pkts/sec targeting HTTP:80",
            "detected_at": datetime.datetime.utcnow().isoformat() + "Z"
        }
    elif attack_type == "malware":
        alert = {
            "source_ip": "185.220.101.5",
            "dest_ip": "10.0.0.1",
            "type": "malware",
            "severity": "high",
            "detail": "Trojan CobaltStrike beaconing: recurring HTTPS C2 ping on :443",
            "detected_at": datetime.datetime.utcnow().isoformat() + "Z"
        }
    else: # port_scan
        alert = {
            "source_ip": "45.33.32.156",
            "dest_ip": "192.168.1.1",
            "type": "port_scan",
            "severity": "high",
            "detail": "Nmap stealth SYN scan: probed 24 ports across 192.168.1.0/24",
            "detected_at": datetime.datetime.utcnow().isoformat() + "Z"
        }
    alert = enrich_alert(alert)
    await push_alert(alert)
    return {"status": "success", "simulated_alert": alert}
async def startup():
    # Load persisted alerts (if any) and start simulated engine
    await load_persisted_alerts()
    # Populate initial alerts immediately if empty so dashboard shows data right away
    if len(_alerts) == 0:
        for _ in range(5):
            alert = {
                "source_ip": random.choice(['10.0.0.1', '192.168.1.5', '172.16.0.3']),
                "dest_ip": random.choice(['8.8.8.8', '1.1.1.1', '203.0.113.7']),
                "type": random.choice(['port_scan', 'malware', 'ddos']),
                "severity": random.choice(['low', 'medium', 'high']),
                "detail": random.choice(['Suspicious port scan on 8080', 'Trojan beaconing detected', 'DDoS volumetric spike']),
                "detected_at": datetime.datetime.utcnow().isoformat() + 'Z'
            }
            alert["id"] = len(_alerts) + 1
            alert = enrich_alert(alert)
            _alerts.append(alert)
    asyncio.create_task(generate_alerts())

# ---------- REST endpoints ----------
@app.get("/api/alerts")
async def list_alerts(limit: int = 20):
    # Return the most recent alerts (newest first)
    return _alerts[-limit:][::-1]

# ---------- WebSocket for live alerts ----------
@app.websocket("/ws/alerts")
async def ws_alerts(ws: WebSocket):
    await ws.accept()
    connected.add(ws)
    try:
        while True:
            await ws.receive_text()   # keep‑alive ping
    except WebSocketDisconnect:
        connected.remove(ws)

# ---------- Helper: push alert to all sockets ----------
async def push_alert(alert: dict):
    # Assign a simple incremental ID for UI consumption
    alert["id"] = len(_alerts) + 1
    _alerts.append(alert)
    # Persist alerts to a JSON file
    try:
        with open('alerts.json', 'w', encoding='utf-8') as f:
            json.dump(_alerts, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f'Failed to persist alerts: {e}')
    if not connected:
        return
    payload = json.dumps(alert)
    await asyncio.gather(*[ws.send_text(payload) for ws in connected])

# Export for detection engine (if any)
async def load_persisted_alerts():
    try:
        with open('alerts.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                _alerts.extend(data)
    except FileNotFoundError:
        pass
    except Exception as e:
        print(f'Failed to load persisted alerts: {e}')

async def generate_alerts():
    sources = ['10.0.0.1', '192.168.1.5', '172.16.0.3', '185.220.101.5', '45.33.32.156', '194.26.29.112']
    destinations = ['8.8.8.8', '1.1.1.1', '203.0.113.7', '192.168.1.1']
    types = ['port_scan', 'malware', 'ddos']
    severities = ['low', 'medium', 'high']
    details = ['Suspicious port scan on 8080', 'Potential botnet anomaly', 'Suspicious payload observed']
    while True:
        alert = {
            "source_ip": random.choice(sources),
            "dest_ip": random.choice(destinations),
            "type": random.choice(types),
            "severity": random.choice(severities),
            "detail": random.choice(details),
            "detected_at": datetime.datetime.utcnow().isoformat() + 'Z'
        }
        alert = enrich_alert(alert)
        await push_alert(alert)
        await asyncio.sleep(5)

__all__ = ["push_alert"]