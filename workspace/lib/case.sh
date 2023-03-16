#!/bin/bash

# @see analogue https://github.com/torokmark/assert.sh/blob/master/assert.sh

function assert {
  if [[ "$1" != *"$2"* ]]; then
    echo -e ${Red}"Expected: $2"${Color_Off}
    TESTS_PASSED=0
    CASE_PASSED=0
  fi
}

function assert_eq {
  if [[ "$1" != "$2" ]]; then
    echo -e ${Red}"Expected: $2"${Color_Off}
    TESTS_PASSED=0
    CASE_PASSED=0
  fi
}

function assert_regexp {
  if ! [[ "$1" =~ $2 ]]; then
    echo -e ${Red}"Expected: $2"${Color_Off}
    TESTS_PASSED=0
    CASE_PASSED=0
  fi
}

function assert_empty {
  if [[ ! -z "$1" ]]; then
    echo -e ${Red}"Expected: empty string"${Color_Off}
    TESTS_PASSED=0
    CASE_PASSED=0
  fi
}

function assert_not_empty {
  if [[ -z "$1" ]]; then
    echo -e ${Red}"Expected: not empty string"${Color_Off}
    TESTS_PASSED=0
    CASE_PASSED=0
  fi
}

function assert_file_exists {
  if [[ ! -f "$1" ]]; then
    echo -e ${Red}"File not exists: $1"${Color_Off}
    TESTS_PASSED=0
    CASE_PASSED=0
  fi
}

function assert_file_not_exists {
  if [[ -f "$1" ]]; then
    echo -e ${Red}"File must not exists: $1"${Color_Off}
    TESTS_PASSED=0
    CASE_PASSED=0
  fi
}

function assert_exit_ok {
  if [[ "$1" -ne "0" ]]; then
    echo -e ${Red}"Exit code must be 0: $1"${Color_Off}
    TESTS_PASSED=0
    CASE_PASSED=0
  fi
}

function start_case {
  CASE_NAME="$1"
  CASE_PASSED=1
}

function end_case {
  echo -ne ${Cyan}${CASE_NAME}${Color_Off}
  if [ $CASE_PASSED == 1 ]; then echo -e "$Green $OK_CODE$Color_Off"; else echo -e "$Red $FAIL_CODE$Color_Off"; fi
}
