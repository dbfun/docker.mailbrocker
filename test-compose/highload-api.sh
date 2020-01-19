#!/bin/bash

# High load test

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

start_case "Test highload AP"

assert_not_empty "$EXIM_DOMAIN"
assert_not_empty "$PORT_API"
ab -k -c 100 -n 1000 -p test-letters/spam-APXvYqyVUhTnI3.eml -T text/plain "http://$EXIM_DOMAIN:$PORT_API/checkmail?mode=new"

end_case

