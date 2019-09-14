#!/bin/bash

# DNS resolving test

set -u

cd "$(dirname "$0")"
source lib/ui.sh
source lib/case.sh

TESTS_PASSED=1

start_case "DNS: Check DNSSEC"
RESP=`dig com. SOA +dnssec @dns`
FLAGS=`echo "$RESP" | grep ";; flags"`
# check for "ad" flag
assert_regexp "$FLAGS" "^;; flags:.* ad[ ;].*$"
end_case

start_case "DNS: Check IPv6"
RESP=`dig AAAA +short google.com @dns`
assert_not_empty "$RESP"
end_case