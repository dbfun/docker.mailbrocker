#!/bin/sh

# API must return
# * 201 Created - all is fine
# * 404 Not found - wrong field "To:"
# * 500 Internal Server Error - for server errors
#
# MTA will be retry delivery via API for 5xx HTTP codes and "Connection refused" (exit code 7)

# Exim does not pass environment
PORT_API="$1"

HTTP_CODE=`cat - | curl -s -o /dev/null -w "%{http_code}" --request POST --include --header 'Content-Type: text/plain' --data-binary @- --no-buffer \
http://api:$PORT_API/checkmail`;

# Curl error codes: @see https://cdcvs.fnal.gov/redmine/projects/simons-dm/wiki/Curl_Error_Codes
if [ "$?" -eq "7" -o "$HTTP_CODE" -ge "500" ]; then
  exit 1;
else
  exit 0;
fi
