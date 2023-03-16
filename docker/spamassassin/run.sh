#!/bin/sh

./rule-update.sh &

spamd -x --pidfile /var/run/spamd.pid --syslog-socket none --listen 0.0.0.0:783 -A "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.1/32"
