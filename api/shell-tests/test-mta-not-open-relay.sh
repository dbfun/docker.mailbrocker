#!/bin/bash

# Testing that the MTA is not an open relay

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

TESTS_PASSED=1

start_case "MTA: The message is for this server"
RESP=`swaks --body @/srv/test-letters/spam-GTUBE.eml --to test@${EXIM_DOMAIN} --from "junk@wrong-domain-name.com" --port ${EXIM_PORT} -tls`
assert "$RESP" '=== Connected to'
assert "$RESP" '~> MAIL FROM:'
assert "$RESP" '~> RCPT TO:'
assert "$RESP" '~> DATA'
assert "$RESP" '<~  354 Enter message, ending with "." on a line by itself'
assert "$RESP" '<~  250 OK id='
end_case

start_case "MTA: Trying to use this server as an open relay"
RESP=`swaks --body @/srv/test-letters/spam-GTUBE.eml --to test@gmail.com --from "junk@wrong-domain-name.com" --server ${EXIM_DOMAIN} --port ${EXIM_PORT} -tls`
assert "$RESP" '=== Connected to'
assert "$RESP" '~> MAIL FROM:'
assert "$RESP" '~> RCPT TO:'
assert "$RESP" '<~* 550 relay not permitted'
end_case

if [ $TESTS_PASSED != 1 ]; then
  echo -e $Red"Tests error"$Color_Off
  exit 1
fi
