# !/bin/bash

function assert {
  SUBSTR=`echo "$1" | grep -F "$2"`
  if [ $? != 0 ]; then
    echo -e ${Red}"Expected: $2"${Color_Off}
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
