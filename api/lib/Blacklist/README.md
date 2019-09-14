# Black Lists

## Mailspike

http://www.mailspike.net/
Usage: http://www.mailspike.net/usage.html
DNSBL: bl.mailspike.net
Limits: [100,000 queries per day](http://mailspike.org/usage.html)

## SORBS

http://www.sorbs.net/
Usage: http://www.sorbs.net/general/using.shtml
DNSBL: dnsbl.sorbs.net
Limits: ???

# SpamCop

http://www.spamcop.net/
Usage: https://www.spamcop.net/fom-serve/cache/291.html
DNSBL: bl.spamcop.net
Limits: ???

## Spamhaus ZEN

http://www.spamhaus.org/zen/
Usage: https://www.spamhaus.org/faq/section/DNSBL%20Usage
DNSBL: sbl.spamhaus.org
Limits: yes: [300,000 queries per day](https://www.spamhaus.org/organization/dnsblusage/)

## SURBL

http://www.surbl.org/
Usage: http://www.surbl.org/guidelines
DNSBL: multi.surbl.org
Limits: [250,000 messages per day](http://www.surbl.org/faqs#high-volume). Note: if you get a result of `127.0.0.1` when doing a SURBL DNS query into the public nameservers, then it means your access is blocked.



## URIBL

http://uribl.com/about.shtml
Usage: http://uribl.com/usage.shtml
DNSBL: black.uribl.com
Limits: yes, if high volume; Large subnets owned by Amazon and other cloud providers have been blocked due to [high volume](http://uribl.com/datafeed_faq.shtml); Use alternate DNS servers;

## Dead DNSBLs

- [spamcannibal.org](https://www.dnsbl.com/2016/09/status-of-blspamcannibalorg-fix-in_22.html)
