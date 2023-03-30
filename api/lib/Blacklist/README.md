# Blacklists Registry

## Links

* en: [List of all RBLs](https://multirbl.valli.org/list/)
* en: [Blacklists check](https://www.ip-score.com/)
* en: [blacklistalert](https://www.blacklistalert.org/)
* en: [Blacklist Check](https://whatismyipaddress.com/blacklist-check)
* en: [System: Expanding IPv6 Addresses for DNSBL Checks](https://www.the-art-of-web.com/system/ipv6-expand-for-rbl/)

## Mailspike

https://www.mailspike.net/
Usage: https://www.mailspike.net/usage.html
DNSBL: bl.mailspike.net
Limits: [100,000 queries per day](https://www.mailspike.net/usage.html)

## SORBS

http://www.sorbs.net/
Usage: http://www.sorbs.net/general/using.shtml
DNSBL: dnsbl.sorbs.net
Limits: ???

# SpamCop

https://www.spamcop.net/
Usage: https://www.spamcop.net/fom-serve/cache/291.html
DNSBL: bl.spamcop.net
Limits: ???

## Spamhaus ZEN

https://www.spamhaus.org/zen/
Usage: https://www.spamhaus.org/faq/section/DNSBL%20Usage
DNSBL: sbl.spamhaus.org
Limits: yes: [300,000 queries per day](https://www.spamhaus.org/organization/dnsblusage/)

## SURBL

https://surbl.org/
Usage: https://www.surbl.org/guidelines
DNSBL: multi.surbl.org
Limits: [250,000 messages per day](https://www.surbl.org/faqs#high-volume). Note: if you get a result of `127.0.0.1` when doing a SURBL DNS query into the public nameservers, then it means your access is blocked.



## URIBL

https://uribl.com/about.shtml
Usage: https://uribl.com/usage.shtml
DNSBL: black.uribl.com
Limits: yes, if high volume; Large subnets owned by Amazon and other cloud providers have been blocked due to [high volume](https://uribl.com/datafeed_faq.shtml); Use alternate DNS servers;

## Dead DNSBLs

- [spamcannibal.org](https://www.dnsbl.com/2016/09/status-of-blspamcannibalorg-fix-in_22.html)
