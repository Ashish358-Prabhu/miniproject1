import unittest
import time
from engine.rules import port_scan_rule, traffic_spike_rule, PORT_SCAN_THRESHOLD, TRAFFIC_SPIKE_PKTS
from engine.flow_tracker import FlowTracker

class TestNetShieldEngine(unittest.TestCase):
    def test_port_scan_detection(self):
        # Normal flow below threshold
        normal_flow = {"ports": set(range(5))}
        triggered, _ = port_scan_rule(normal_flow)
        self.assertFalse(triggered)

        # Port scan flow above threshold
        scan_flow = {"ports": set(range(PORT_SCAN_THRESHOLD + 5))}
        triggered, detail = port_scan_rule(scan_flow)
        self.assertTrue(triggered)
        self.assertIn("Port scan", detail)

    def test_traffic_spike_detection(self):
        # Normal flow
        normal_flow = {
            "packets": 50,
            "first_ts": time.time() - 10,
            "last_ts": time.time(),
        }
        triggered, _ = traffic_spike_rule(normal_flow)
        self.assertFalse(triggered)

        # High packet spike
        spike_flow = {
            "packets": TRAFFIC_SPIKE_PKTS + 100,
            "first_ts": time.time() - 2,
            "last_ts": time.time(),
        }
        triggered, detail = traffic_spike_rule(spike_flow)
        self.assertTrue(triggered)
        self.assertIn("Traffic spike", detail)

    def test_flow_tracker_window(self):
        tracker = FlowTracker()
        tracker.update(
            src="192.168.1.10",
            dst="10.0.0.1",
            sport=1234,
            dport=80,
            proto="TCP",
            size=64,
        )
        snapshot = tracker.snapshot()
        key = ("192.168.1.10", "10.0.0.1")
        self.assertIn(key, snapshot)
        self.assertEqual(snapshot[key]["packets"], 1)
        self.assertEqual(snapshot[key]["bytes"], 64)
        self.assertIn(80, snapshot[key]["ports"])

if __name__ == "__main__":
    unittest.main()
