#!/bin/bash

# High load test

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

start_case "Test highload SMTP"
assert_not_empty "$API_CATCH_MTA_TO"
assert_not_empty "$EXIM_DOMAIN"

USERNAME=`echo "$API_CATCH_MTA_TO" | cut -d "," -f1`
assert_not_empty "$USERNAME"

EMAIL_TO=$USERNAME@$EXIM_DOMAIN
# echo Email TO: "$EMAIL_TO"
end_case

function mail_once {
  swaks -S --body @test-letters/spam-APXvYqyVUhTnI3.eml --header "MIME-Version: 1.0" --header "Content-Type: text/html" --to "$EMAIL_TO" --from junk@gmail.com
}

function mail1 {
  echo "Start 1"
  mail_once
  echo "Done 1"
  mail1
}

function mail2 {
  echo "Start 2"
  mail_once
  echo "Done 2"
  mail2
}

function mail3 {
  echo "Start 3"
  mail_once
  echo "Done 3"
  mail3
}

function mail4 {
  echo "Start 4"
  mail_once
  echo "Done 4"
  mail4
}

# for run in {1..25}
# do
#   mail_once
# done


mail1 &
mail2 &
mail3 &
mail4
