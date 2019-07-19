#!/bin/bash

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

TESTS_PASSED=1

start_case "Right mail message"
RESP=`echo "This is the message body" | swaks --to test@${EXIM_DOMAIN} --from "junk@wrong-domain-name.com" -tls`
assert "$RESP" '=== Connected to'
assert "$RESP" '~> MAIL FROM:'
assert "$RESP" '~> RCPT TO:'
assert "$RESP" '~> DATA'
assert "$RESP" '<~  354 Enter message, ending with "." on a line by itself'
assert "$RESP" '<~  250 OK id='
end_case


start_case "Not open relay"
RESP=`echo "This is the message body" | swaks --to test@gmail.com --from "junk@wrong-domain-name.com" --server ${EXIM_DOMAIN} -tls`
assert "$RESP" '=== Connected to'
assert "$RESP" '~> MAIL FROM:'
assert "$RESP" '~> RCPT TO:'
assert "$RESP" '<~* 550 relay not permitted'
end_case

if [ $TESTS_PASSED != 1 ]; then
  echo -e $Red"Tests error"$Color_Off
fi
