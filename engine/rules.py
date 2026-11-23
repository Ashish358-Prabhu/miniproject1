from typing import Tuple, Dict

PORT_SCAN_THRESHOLD = 20          # configurable
TRAFFIC_SPIKE_PKTS = 500          # packets per window


def port_scan_rule(flow: Dict) -> Tuple[bool, str]:
    if len(flow["ports"]) >= PORT_SCAN_THRESHOLD:
        return True, f"Port scan: {len(flow['ports'])} unique ports"
    return False, ""


def traffic_spike_rule(flow: Dict) -> Tuple[bool, str]:
    if flow["packets"] >= TRAFFIC_SPIKE_PKTS:
        duration = flow["last_ts"] - flow["first_ts"]
        return True, f"Traffic spike: {flow['packets']} pkts in {duration:.1f}s"
    return False, ""
