#!/bin/bash

# WIP: not working
# DNS resolving test

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

start_case "DNS: TODO доменов sigok.verteiltesysteme.net больше не существует, нужно переписать тест"
assert_not_empty ""
end_case
exit

TESTS_PASSED=1

# @see http://dnssec.vs.uni-due.de/

start_case "DNS: Check DNSSEC positive"
RESP=`dig sigok.verteiltesysteme.net @dns`
# check for status
assert "$RESP" "status: NOERROR"
FLAGS=`echo "$RESP" | grep ";; flags"`
# check for "ad" flag
assert_regexp "$FLAGS" "^;; flags:.* ad[ ;].*$"
# check for ANSWER
assert_regexp "$FLAGS" "^.*ANSWER: 1.*$"
# check for A record
_str=`echo "$RESP" | grep -q "^sigok.verteiltesysteme.net" && echo "A record"`
assert_eq "$_str" "A record"
end_case

start_case "DNS: Check DNSSEC negative"
RESP=`dig sigfail.verteiltesysteme.net @dns`
assert "$RESP" "status: SERVFAIL"
FLAGS=`echo "$RESP" | grep ";; flags"`
assert_regexp "$FLAGS" "^.*ANSWER: 0.*$"
end_case

start_case "DNS: Check IPv6"
RESP=`dig AAAA +short google.com @dns`
assert_not_empty "$RESP"
end_case
