#!/bin/bash

# High load test

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

start_case "Test highload AP"

assert_not_empty "$EXIM_DOMAIN"
ab -k -c 100 -n 1000 -p /srv/test-letters/spam-APXvYqyVUhTnI3.eml -T text/plain "http://api/checkmail?mode=new"

end_case

