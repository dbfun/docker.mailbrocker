#!/bin/bash

# Test outgoing mail

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

TESTS_PASSED=1

start_case "Mail send: DNS TXT record for DKIM ($EXIM_DKIM_SELECTOR._domainkey.$EXIM_DOMAIN)"
PUBLIC_KEY_FILE="/etc/ssl/certs/dkim/public.key"
assert_file_exists "$PUBLIC_KEY_FILE"
PUBLIC_KEY=`tail -n +2 "$PUBLIC_KEY_FILE" 2>/dev/null | head -n -1 | tr -d '\n'`
assert_not_empty "$PUBLIC_KEY"
TXT_DNS=`dig TXT +short $EXIM_DKIM_SELECTOR._domainkey.$EXIM_DOMAIN @dns | sed 's/" "//'`
assert_not_empty "$TXT_DNS"
assert "$TXT_DNS" "$PUBLIC_KEY"
end_case


if [ $TESTS_PASSED != 1 ]; then
  echo -e $Red"Tests error"$Color_Off
  exit 1
fi
