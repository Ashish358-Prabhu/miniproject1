from scapy.all import sniff, rdpcap, IP, TCP, UDP
from .flow_tracker import FlowTracker
import asyncio

LIVE_INTERFACE = None          # set e.g. "Ethernet" for live capture on Windows
PCAP_FILE = "datasets/sample_traffic.pcap"

tracker = FlowTracker()

def _process(packet, custom_tracker=None):
    active_tracker = custom_tracker or tracker
    if IP not in packet:
        return
    src = packet[IP].src
    dst = packet[IP].dst
    size = len(packet)
    proto = "OTHER"
    sport = dport = None
    if TCP in packet:
        proto = "TCP"
        sport = packet[TCP].sport
        dport = packet[TCP].dport
    elif UDP in packet:
        proto = "UDP"
        sport = packet[UDP].sport
        dport = packet[UDP].dport
    active_tracker.update(src, dst, sport, dport, proto, size)

def run_capture(target_tracker=None, pcap_path=None):
    active_pcap = pcap_path or PCAP_FILE
    if LIVE_INTERFACE:
        print(f"[+] Capturing live on {LIVE_INTERFACE}")
        sniff(iface=LIVE_INTERFACE, filter="ip", prn=lambda pkt: _process(pkt, target_tracker), store=False)
    else:
        print(f"[+] Reading PCAP {active_pcap}")
        packets = rdpcap(active_pcap)
        for pkt in packets:
            _process(pkt, target_tracker)

if __name__ == "__main__":
    run_capture()
