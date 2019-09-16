#!/bin/sh

# This script changes Docker nameserver to our own
# Reason: some DNSBLs block public DNS due to high volume queries

DNS_IP=`nslookup type=ns dns 2>/dev/null | grep "Server:" | head -n 1 | sed 's/Server:\s*//'`
echo -e "nameserver $DNS_IP\noptions timeout:2 rotate ndots:0" > /etc/resolv.conf
