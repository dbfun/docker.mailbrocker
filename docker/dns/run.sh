#!/bin/sh

# Replacing environment variables
envsubst < ./unbound.conf > /etc/unbound/unbound.conf

# Required for DNSSEC validation
# @see unbound.conf "auto-trust-anchor-file" section
unbound-anchor -a /usr/share/dnssec-root/auto-trust.key
chown unbound:unbound /usr/share/dnssec-root/auto-trust.key

# Required for root hints
# @see unbound.conf
mkdir -p /usr/share/dns-root-hints/
wget -q https://www.internic.net/domain/named.cache -O /usr/share/dns-root-hints/named.root
chown -R unbound:unbound /usr/share/dns-root-hints/

if [ "$DNS_DEBUG" == "on" ]; then
  # `-v` - verbose mode
  unbound -d -v
else
  unbound -d
fi
