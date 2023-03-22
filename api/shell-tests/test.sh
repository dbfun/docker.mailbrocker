#!/bin/bash

# This is the entry point for all tests

TESTS_PASSED=1

cd "$(dirname "$0")"
source lib/ui.sh

echo -e ${Green}Run tests at: `date`${Color_Off}

./test-dns.sh
if [ "$?" -ne "0" ]; then TESTS_PASSED=0; fi

./test-mta-not-open-relay.sh
if [ "$?" -ne "0" ]; then TESTS_PASSED=0; fi

./test-dkim.sh
if [ "$?" -ne "0" ]; then TESTS_PASSED=0; fi

./test-http-pipe.sh
if [ "$?" -ne "0" ]; then TESTS_PASSED=0; fi

./test-spamassassin.sh
if [ "$?" -ne "0" ]; then TESTS_PASSED=0; fi

if [ $TESTS_PASSED != 1 ]; then
  echo
  echo -e $Red"Test bundle error"$Color_Off
  exit 1
else
  echo
  echo -e $Green"Test bundle passed"$Color_Off
  exit 0
fi
