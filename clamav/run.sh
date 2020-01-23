#!/bin/sh

envsubst < ./clamd.conf > /etc/clamav/clamd.conf
envsubst < ./freshclam.conf > /etc/clamav/freshclam.conf

chown clamav:clamav /var/lib/clamav /var/log/clamav

# first update
if [[ ! -f "/var/lib/clamav/daily.cvd" ]]; then
  freshclam --verbose --debug --show-progress -F
  if [ "$?" -ne "0" ]; then
    echo "freshclam fails" > /dev/fd/2
    sleep 60
    exit 1
  fi
fi

if [ "$CLAMAV_DEBUG" == "on" ]; then
  freshclam --verbose --debug -d &
  clamd --debug
else
  freshclam --show-progress -d &
  clamd
fi
