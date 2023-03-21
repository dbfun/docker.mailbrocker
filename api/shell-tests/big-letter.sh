#!/bin/bash


set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

start_case "Test big letter"
assert_not_empty "$INCOMING_MAIL_MAX_SIZE_KILOBYTES"
USERNAME=`echo "$API_CATCH_MTA_TO" | cut -d "," -f1`
assert_not_empty "$USERNAME"
EMAIL_TO=$USERNAME@$EXIM_DOMAIN
end_case

block=`printf 'block %93s\n' {1..9}`
echo -e ${Cyan}Current max mail size: ${INCOMING_MAIL_MAX_SIZE_KILOBYTES}${Color_Off}
echo -e ${Cyan}Test mail: ${EMAIL_TO}${Color_Off}

start_case "Mail size is over limit"

  # Creating 5000 kb file
  body=`printf "$block\nsection %91s\n" {1..5000}`

  echo -e ${Cyan}Created email size: ${#body} bytes${Color_Off}
  RESP=`echo "\n$body" | swaks -S --add-header "MIME-Version: 1.0" --add-header "Content-Type: text/plain" --to "$EMAIL_TO" --from junk@gmail.com --data -`
  assert_exit_fail "$?"
  assert "$RESP" '<** 552 Message size exceeds maximum permitted'

end_case

start_case "Mail size is below limit"

  # Creating 4500 kb file
  body=`printf "$block\nsection %91s\n" {1..4500}`

  echo -e ${Cyan}Created email size: ${#body} bytes${Color_Off}
  RESP=`echo "\n$body" | swaks -S --add-header "MIME-Version: 1.0" --add-header "Content-Type: text/plain" --to "$EMAIL_TO" --from junk@gmail.com --data -`
  assert_exit_ok "$?"

end_case

