#/bin/sh

RESP=`curl -sS http://localhost:80/healthcheck`
if [ "$RESP" != '{"result":"ok"}' ]; then
  exit 1
fi