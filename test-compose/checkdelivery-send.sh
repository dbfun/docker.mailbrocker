#!/bin/bash

# send letter for checkdelivery

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh
source lib/functions.sh

RandomObjectId

TESTS_PASSED=1

RESP="<~  250 2.0.0 Ok: queued on mxfront1q.mail.yandex.net as 1576091234-Teu3FZYboG-7Ek4cBum"

while read EMAIL; do
  start_case "Send letter for \"checkdelivery\" TO: $EMAIL"
    RESP=`swaks --to ${EMAIL} --from junk@gmail.com --header "Subject: Test _id: ${ObjectId}" --header "X-Mailtester: ${ObjectId}" -tls`
    assert_exit_ok "$?"
    assert "$RESP" '=== Connected to'
    assert "$RESP" '~> MAIL FROM:'
    assert "$RESP" '~> RCPT TO:'
    assert "$RESP" '~> DATA'
    assert_regexp "$RESP" '<~  250.*(Ok|OK)'
    if [ $CASE_PASSED != 1 ]; then
      echo "$RESP" | tail -n5
    fi
  end_case
done < <(jq -r ".mailboxes[] | select(.active == true) | .email" /etc/checkdelivery-mails.json)
