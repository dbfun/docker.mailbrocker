#!/bin/bash

if [ "$RUN_TESTS" == "on" ]; then

  sleep 2
  ./test-mail.sh
  sleep 5
  ./test-api-pipe.sh

fi

