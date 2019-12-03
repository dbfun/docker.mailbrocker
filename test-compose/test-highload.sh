#!/bin/bash

# High load test

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

start_case "Test highload"
assert_not_empty "$API_CATCH_MTA_TO"
assert_not_empty "$EXIM_DOMAIN"

USERNAME=`echo "$API_CATCH_MTA_TO" | cut -d "," -f1`
assert_not_empty "$USERNAME"

EMAIL_TO=$USERNAME@$EXIM_DOMAIN
# echo Email TO: "$EMAIL_TO"
end_case

function mail_once {
  swaks -S --body test-letters/text/so.html --add-header "MIME-Version: 1.0" --add-header "Content-Type: text/html" --to "$EMAIL_TO" --from junk@gmail.com
}

function mail1 {
  echo "Start 1"
  swaks -S --body test-letters/text/so.html --add-header "MIME-Version: 1.0" --add-header "Content-Type: text/html" --to "$EMAIL_TO" --from junk@gmail.com
  echo "Done 1"
  mail1
}

function mail2 {
  echo "Start 2"
  swaks -S --body test-letters/text/lorem-ipsum.txt --to "$EMAIL_TO" --from junk@gmail.com
  echo "Done 2"
  mail2
}

date
for run in {1..50}
do
  mail_once
done
date

# mail1 &
# mail2
