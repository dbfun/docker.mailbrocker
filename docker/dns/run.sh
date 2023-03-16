#!/bin/sh

envsubst < ./unbound.conf > /etc/unbound/unbound.conf

# Print Warning from head
head -n3 /etc/unbound/unbound.conf

echo Run DNS on port: 53

if [ "$DNS_DEBUG" == "on" ]; then
  # `-v` - verbose mode
  unbound -d -v
else
  unbound -d
fi
