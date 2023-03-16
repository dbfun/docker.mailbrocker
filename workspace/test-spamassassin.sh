#!/bin/bash

# Spamassassin test

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

TESTS_PASSED=1

start_case "Spamassassin: GTUBE test"
EMAIL=test-letters/spam-GTUBE.eml
RESP=`cat "$EMAIL" | spamc -d spamassassin -p 783 -R`
assert "$RESP" '1000 GTUBE'
assert "$RESP" 'This is 100% spam mail'
end_case

if [ $TESTS_PASSED != 1 ]; then
  echo -e $Red"Tests error"$Color_Off
  exit 1
fi
