#/bin/sh

RESP=`curl -sS http://localhost:${PORT_API}/healthcheck`
if [ "$RESP" != '{"result":"ok"}' ]; then
  exit 1
fi