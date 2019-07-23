#!/bin/bash

# Mail delivery test

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

TESTS_PASSED=1

start_case "Right mail message"
RESP=`swaks --body mail-spam.txt --to test@${EXIM_DOMAIN} --from "junk@wrong-domain-name.com" -p${PORT_EXIM} -tls`
assert "$RESP" '=== Connected to'
assert "$RESP" '~> MAIL FROM:'
assert "$RESP" '~> RCPT TO:'
assert "$RESP" '~> DATA'
assert "$RESP" '<~  354 Enter message, ending with "." on a line by itself'
assert "$RESP" '<~  250 OK id='
end_case


start_case "Not open relay"
RESP=`swaks --body mail-spam.txt --to test@gmail.com --from "junk@wrong-domain-name.com" --server ${EXIM_DOMAIN} -p${PORT_EXIM} -tls`
assert "$RESP" '=== Connected to'
assert "$RESP" '~> MAIL FROM:'
assert "$RESP" '~> RCPT TO:'
assert "$RESP" '<~* 550 relay not permitted'
end_case

if [ $TESTS_PASSED != 1 ]; then
  echo -e $Red"Tests error"$Color_Off
fi
