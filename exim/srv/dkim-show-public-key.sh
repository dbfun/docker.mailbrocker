#!/bin/sh

# This script shows DKIM public key

PUBLIC_KEY_FILE="/etc/exim/dkim/public.key"

if [[ -f "$PUBLIC_KEY_FILE" ]]; then
  PUBLIC_KEY=`tail -n +2 "$PUBLIC_KEY_FILE" | head -n -1 | tr -d '\n'`
  echo "Add this record to your DNS server:"
  echo -e "\tHost: $EXIM_DKIM_SELECTOR._domainkey.$EXIM_DOMAIN"
  echo -e "\tType: TXT"
  echo -e "\tValue: v=DKIM1; k=rsa; t=s; p=$PUBLIC_KEY"
  echo
  echo "Content of public key $PUBLIC_KEY_FILE:"
  cat "$PUBLIC_KEY_FILE"
else
  echo "Public DKIM file $PUBLIC_KEY_FILE not exists"
fi
