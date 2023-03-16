#!/bin/bash

# Add one email via API for test purposes
# Usage:
# * add dummy message:      ./add-letter.sh dummy
# * add message from file:  ./add-letter.sh /srv/test-letters/ham-spf-rebus3d.ru.eml

set -u
CASE_PASSED=1

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh
source lib/functions.sh

if [ "$1" == "dummy" ]; then
  EML_FILE="/srv/test-letters/spam-GTUBE.eml"
  RandomObjectId
  start_case "Add dummy mail $ObjectId into check queue"
else
  EML_FILE="$1"
  ObjectId=5cc8161582cd8ed026085eb2
  start_case "Add mail from $EML_FILE into check queue"
fi

if [ ! -f "$EML_FILE" ]; then
  >&2 echo "File $EML_FILE not exists"
  exit 1
fi

RESP=`cat "$EML_FILE" | sed "s/5cc8161582cd8ed026085eb2/$ObjectId/g" | curl -s \
      -H "Connection: close" \
      --max-time 10 \
      --verbose \
      --request POST \
      --include \
      --header 'Content-Type: text/plain' \
      --data-binary @- \
      --no-buffer \
      http://api/checkmail?mode=new 2>&1`

assert "$RESP" '> POST /checkmail?mode=new HTTP/1.1'
assert "$RESP" '< HTTP/1.1 200 OK'
assert "$RESP" '< Content-Type: application/json;'
assert "$RESP" '{"result":"ok"' # and ObjecId ...

end_case

if [ $CASE_PASSED != 1 ]; then
  echo "$RESP"
else
  echo -ne "ObjecId: "
  echo "$RESP" | grep -o '{.*}' | jq -r '.ObjecId'
fi
