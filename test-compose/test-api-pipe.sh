#!/bin/bash

# HTTP mail transport test

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

TESTS_PASSED=1

start_case "API: Healthcheck"
RESP=`curl -s \
    -H "Connection: close" \
    --max-time 10 \
    --verbose \
    --include \
    http://api:$PORT_API/healthcheck 2>&1`
assert "$RESP" '> GET /healthcheck HTTP/1.1'
assert "$RESP" '< HTTP/1.1 200 OK'
assert "$RESP" '{"result":"ok"' # and ObjecId ...
end_case


start_case "API: Deny wrong mail \"To:\" header"
RESP=`cat test-letters/spam-wrong-mail-to.eml | curl -s \
    -H "Connection: close" \
    --max-time 10 \
    --verbose \
    --request POST \
    --include \
    --header 'Content-Type: text/plain' \
    --data-binary @- \
    --no-buffer \
    http://api:$PORT_API/checkmail?mode=MTA 2>&1`

assert "$RESP" '> POST /checkmail?mode=MTA HTTP/1.1'
assert "$RESP" '< HTTP/1.1 403 Forbidden'
assert "$RESP" '< Content-Type: application/json;'
assert "$RESP" '{"result":"fail","reason":"Mail rejected in MTA mode: wrong fied TO: \"info@spam24.ru\". Use MongoDB ObjectId as user name"}'
end_case


start_case "API: Add spam mail into check queue"
RESP=`cat test-letters/spam-GTUBE.eml | curl -s \
    -H "Connection: close" \
    --max-time 10 \
    --verbose \
    --request POST \
    --include \
    --header 'Content-Type: text/plain' \
    --data-binary @- \
    --no-buffer \
    http://api:$PORT_API/checkmail?mode=new 2>&1`
assert "$RESP" '> POST /checkmail?mode=new HTTP/1.1'
assert "$RESP" '< HTTP/1.1 200 OK'
assert "$RESP" '< Content-Type: application/json;'
assert "$RESP" '{"result":"ok"' # and ObjecId ...
end_case


if [ $TESTS_PASSED != 1 ]; then
  echo -e $Red"Tests error"$Color_Off
  exit 1
fi
