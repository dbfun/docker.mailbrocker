#!/bin/sh

while true; do
  sleep 1d
  sa-update -D
  kill -HUP `cat /var/run/spamd.pid`
done