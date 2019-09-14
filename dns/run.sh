#!/bin/sh

envsubst < ./unbound.conf > /etc/unbound/unbound.conf

head -n3 /etc/unbound/unbound.conf
echo Run DNS on port: $PORT_DNS

unbound -d -v