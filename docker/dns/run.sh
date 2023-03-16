#!/bin/sh

# Replacing environment variables
envsubst < ./unbound.conf > /etc/unbound/unbound.conf

# Required for DNSSEC validation
# @see unbound.conf "auto-trust-anchor-file" section
unbound-anchor -a /usr/share/dnssec-root/auto-trust.key
chown unbound:unbound /usr/share/dnssec-root/auto-trust.key

echo Run DNS on port: 53

if [ "$DNS_DEBUG" == "on" ]; then
  # `-v` - verbose mode
  unbound -d -v
else
  unbound -d
fi
