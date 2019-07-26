#!/bin/bash

# Add another one email via API

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

chars=1234567890abcdef
_id=
for i in {1..24} ; do
  _id=$_id${chars:RANDOM%${#chars}:1}
done

start_case "Add spam mail $_id into check queue"

RESP=`cat test-letters/spam-GTUBE.eml | sed "s/5cc8161582cd8ed026085eb2/$_id/g" | curl -s \
    --max-time 10 \
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
