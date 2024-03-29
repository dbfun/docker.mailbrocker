#!/bin/sh

# This script runs Exim in Docker container
# @see Dockerfile

mkdir -p        /var/spool/mail /var/mail /var/spool/exim /var/spool/exim/db /var/spool/exim/input /var/spool/exim/msglog && \
chmod 775       /var/spool/mail /var/mail /var/spool/exim /var/spool/exim/db /var/spool/exim/input /var/spool/exim/msglog && \
chown exim.mail /var/spool/mail /var/mail /var/spool/exim /var/spool/exim/db /var/spool/exim/input /var/spool/exim/msglog

echo "$EXIM_DOMAIN" > /etc/exim/primary_host

# Against error "Exim configuration file /etc/exim/exim.conf has the wrong owner, group, or mode"
chmod 640 /etc/exim/exim.conf
chown root.mail /etc/exim/exim.conf

# Make new DKIM keys

if [ ! -f "/etc/ssl/certs/dkim/private.key" ]; then
  echo "Creating DKIM keys"
  /srv/dkim-make-keys.sh
else
  echo "DKIM keys exists, skip"
fi

chown -R mail.mail /etc/ssl/certs/dkim

# Run

# From man:
# -q<qflags><time>
#           When a time value is present, the -q option causes Exim to
#           run as a daemon, starting a queue runner process at intervals
#           specified by the given time value. This form of the -q option
#           is commonly combined with the -bd option, in which case a
#           single daemon process handles both functions. A common way of
#           starting up a combined daemon at system boot time is to use a
#           command such as
#
#             /usr/exim/bin/exim -bd -q30m
#
#           Such a daemon listens for incoming SMTP calls, and also
#           starts a queue runner process every 30 minutes.
#
#           When a daemon is started by -q with a time value, but without
#           -bd, no pid file is written unless one is explicitly
#           requested by the -oP option.

# `-q 5s` - check queue every 5sec
# `-d` - debug, `-v` - verbose
# `-oX` - port, but no pid file created => added `-oP`

INCOMING_MAIL_MAX_SIZE_BYTES=$((INCOMING_MAIL_MAX_SIZE_KILOBYTES * 1000))
export INCOMING_MAIL_MAX_SIZE_BYTES

if [ "$EXIM_DEBUG" = "on" ]; then
  exim -bd -q5s -d -oX $EXIM_PORT -oP /run/exim.pid
else
  # `-v` - verbose mode
  exim -bd -q5s -v -oX $EXIM_PORT -oP /run/exim.pid
fi
