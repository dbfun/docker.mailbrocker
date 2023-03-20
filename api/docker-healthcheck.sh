#/bin/sh

RESP=`curl -sS http://localhost/healthcheck`
if [ "$RESP" != '{"result":"ok"}' ]; then
  exit 1
fi