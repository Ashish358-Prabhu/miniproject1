import asyncio
import random
import datetime
from backend.main import push_alert

async def generate_alerts():
    sources = ['10.0.0.1', '192.168.1.5', '172.16.0.3']
    destinations = ['8.8.8.8', '1.1.1.1', '203.0.113.7']
    types = ['port_scan', 'malware', 'ddos']
    severities = ['low', 'medium', 'high']
    details = ['Suspicious activity detected', 'Potential threat', 'Anomaly observed']
    while True:
        alert = {
            "source_ip": random.choice(sources),
            "dest_ip": random.choice(destinations),
            "type": random.choice(types),
            "severity": random.choice(severities),
            "detail": random.choice(details),
            "detected_at": datetime.datetime.utcnow().isoformat() + 'Z'
        }
        await push_alert(alert)
        await asyncio.sleep(5)  # generate every 5 seconds

if __name__ == '__main__':
    asyncio.run(generate_alerts())
