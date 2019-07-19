#!/bin/sh

echo $PRIMARY_HOST > /etc/exim/primary_host

# Against error "Exim configuration file /etc/exim/exim.conf has the wrong owner, group, or mode"
chmod 640 /etc/exim/exim.conf
chown root.mail /etc/exim/exim.conf

if [ "$DEBUG_EXIM" == "on" ]; then
  exim -bd -d
else
  # `-v` - verbose mode
  exim -bdf -v
fi
