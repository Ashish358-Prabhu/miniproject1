import time
from collections import defaultdict
from typing import Dict, Tuple

class FlowTracker:
    """Keeps per‑source‑dest statistics in a sliding 60‑second window."""
    WINDOW = 60  # seconds

    def __init__(self):
        self.flows: Dict[Tuple[str, str], Dict] = defaultdict(
            lambda: {
                "packets": 0,
                "bytes": 0,
                "ports": set(),
                "first_ts": time.time(),
                "last_ts": time.time(),
            }
        )

    def _expire(self):
        now = time.time()
        for key in list(self.flows):
            if now - self.flows[key]["last_ts"] > self.WINDOW:
                del self.flows[key]

    def update(
        self,
        src: str,
        dst: str,
        sport: int | None,
        dport: int | None,
        proto: str,
        size: int,
    ):
        self._expire()
        flow = self.flows[(src, dst)]
        flow["packets"] += 1
        flow["bytes"] += size
        if dport:
            flow["ports"].add(dport)
        flow["last_ts"] = time.time()
        flow["proto"] = proto

    def snapshot(self):
        """Return a shallow copy for detection logic."""
        return {k: dict(v) for k, v in self.flows.items()}
