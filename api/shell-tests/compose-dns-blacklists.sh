#!/bin/bash

# Compose a DNS blacklist file from various sources

echo Deprecated
exit 1

cd "$(dirname "$0")"
DOMAIN_LIST=

# harvest all domains

> src/dnsbl-domains.txt
cat                   dns-blacklist-src/list-from-mailtester.com.txt          >> dns-blacklist-src/dnsbl-domains.txt
cut -f1 -d:           dns-blacklist-src/list-from-ip-score.com.txt            >> dns-blacklist-src/dnsbl-domains.txt
cut -f3 -d$'\t'       dns-blacklist-src/list-from-valli.org.tsv               >> dns-blacklist-src/dnsbl-domains.txt
cut -f1 -d' '         dns-blacklist-src/list-from-blacklistalert.org.txt      >> dns-blacklist-src/dnsbl-domains.txt
cut -f1 -d' '         dns-blacklist-src/list-from-whatismyipaddress.com.txt   >> dns-blacklist-src/dnsbl-domains.txt


# check for DNSBL

while read DOMAIN; do
  # 127.0.0.2 is spam
  dig 2.0.0.127."$DOMAIN" +short | grep -qF '127.0.0.2'
  if [ $? == 0 ]; then
    >&2 echo ok: "$DOMAIN"
    DOMAIN_LIST="$DOMAIN_LIST;$DOMAIN"
  else
    >&2 echo fail: "$DOMAIN"
  fi
done <<< `sort dns-blacklist-src/dnsbl-domains.txt | uniq`

# save into config file

echo "$DOMAIN_LIST" | tr -d '\n' | jq --slurp --raw-input --raw-output \
     'split(";") | .[1:] | map(split("\t")) |
         map({
              "domain": .[0]
            })' > dns-blacklist-src/raw.json
