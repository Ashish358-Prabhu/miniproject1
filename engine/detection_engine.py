import asyncio
from .flow_tracker import FlowTracker
from .rules import port_scan_rule, traffic_spike_rule
from backend.database import insert_alert
from backend.main import push_alert

class DetectionEngine:
    def __init__(self, tracker: FlowTracker):
        self.tracker = tracker

    async def run(self):
        while True:
            snapshot = self.tracker.snapshot()
            for (src, dst), flow in snapshot.items():
                alerts = []
                triggered, detail = port_scan_rule(flow)
                if triggered:
                    alerts.append({
                        "source_ip": src,
                        "dest_ip": dst,
                        "type": "Port Scan",
                        "severity": "High",
                        "detail": detail,
                    })
                triggered, detail = traffic_spike_rule(flow)
                if triggered:
                    alerts.append({
                        "source_ip": src,
                        "dest_ip": dst,
                        "type": "Traffic Spike",
                        "severity": "Medium",
                        "detail": detail,
                    })
                for alert in alerts:
                    await insert_alert(alert)
                    await push_alert(alert)
            await asyncio.sleep(2)

# Entry point for running detection together with packet capture
if __name__ == "__main__":
    from .packet_capture import run_capture
    tracker = FlowTracker()
    engine = DetectionEngine(tracker)
    # start packet capture in separate thread passing shared tracker
    import threading
    t = threading.Thread(target=lambda: run_capture(target_tracker=tracker), daemon=True)
    t.start()
    print("[+] Detection engine started, monitoring flow tracker...")
    asyncio.run(engine.run())
