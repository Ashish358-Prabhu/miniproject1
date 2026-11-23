import os
from scapy.all import Ether, IP, TCP, UDP, wrpcap

def create_sample_pcap(filename="datasets/sample_traffic.pcap"):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    packets = []

    # 1. Normal web browsing traffic
    for i in range(10):
        pkt = Ether() / IP(src="192.168.1.100", dst="8.8.8.8") / TCP(sport=50000+i, dport=443, flags="A")
        packets.append(pkt)

    # 2. Simulated Port Scan (High number of destination ports)
    for port in [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1433, 1521, 3306, 3389, 5432, 8080, 8443, 9000]:
        pkt = Ether() / IP(src="10.0.0.50", dst="192.168.1.1") / TCP(sport=43210, dport=port, flags="S")
        packets.append(pkt)

    # 3. Simulated Volumetric Traffic Spike (DDoS burst)
    for _ in range(600):
        pkt = Ether() / IP(src="172.16.0.99", dst="192.168.1.1") / UDP(sport=53, dport=80)
        packets.append(pkt)

    wrpcap(filename, packets)
    print(f"[+] Successfully generated sample PCAP at: {filename} with {len(packets)} packets.")

if __name__ == "__main__":
    create_sample_pcap()
