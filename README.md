# Project status

Work in progress

## Stages

* [x] Exim MTA configuring
* [x] API
  * [x] Launch API
  * [x] Spamassassin check
  * [x] Validate SPF
  * [x] Validate DKIM
  * [x] Check DMARC
  * [x] Blacklist Check
  * [x] Pyzor Check
  * [x] Razor2 Check
* [x] Self DNS resolving
* [ ] Mail test queue
* [ ] IPv6 support
  * [x] Spf
  * [ ] DKIM ?
  * [ ] DMARC ?
  * [x] Blacklist
* [ ] WIP: Launch Demo Website

# Check your mail for spam

Email to special address then check your spam score.

Modules:

* Exim MTA
* Website
* API with mail tester engine (Spamassassin, SPF checker, DMARC, Blacklist, Pyzor, Razor)

![Scheme](https://github.com/dbfun/docker.mailtester/raw/master/assets/mailtester.png)

# Features:

* [x] Mail data sourses:
  *   [x] MTA
  *   [x] HTTP API
* [ ] special address for auto reply with spam test score


# FAQ

## What is the reason for using your own DNS resolver?

Some DNSBLs block public DNS due to high volume queries:

> Query Refused. See http://uribl.com/refused.shtml for more information [Your DNS IP: 77.88.56.72]

Own DNS resolver (unbound) used in Spamassassin and Blacklist modules.

## How to increase incoming email size?

Change this settings in `.env` file:

* `EXIM_INCOMING_MAIL_MAX_SIZE=5M`
* `API_INCOMING_MAIL_MAX_SIZE=5mb`
* `SPAMASSASSIN_MAX_MSG_SIZE=5000000`
