#!/bin/bash

# HTTP mail transport test

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

TESTS_PASSED=1

start_case "Add spam mail into check queue"
RESP=`cat mail-spam.txt | curl -s \
    --verbose \
    --request POST \
    --include \
    --header 'Content-Type: text/plain' \
    --data-binary @- \
    --no-buffer \
    http://api:$PORT_API/checkmail 2>&1`

assert "$RESP" '> POST /checkmail HTTP/1.1'
assert "$RESP" '< HTTP/1.1 200 OK'
assert "$RESP" '< Content-Type: application/json;'
assert "$RESP" '{"result":"ok"}'

end_case

if [ $TESTS_PASSED != 1 ]; then
  echo -e $Red"Tests error"$Color_Off
fi
