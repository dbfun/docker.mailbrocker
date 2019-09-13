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
* [ ] WIP: Launch Demo Website

# Check your mail for spam

Email to special address then check your spam score.

Modules:

* Exim MTA
* Website
* API with mail tester engine (Spamassassin + ...)

# Features:

[x] Mail data sourses:
  [x] MTA
  [x] HTTP API
[ ] special address for auto reply with spam test score


# FAQ

## How to increase incoming email size

Change these settings in `.env` file:

* `EXIM_INCOMING_MAIL_MAX_SIZE=5M`
* `API_INCOMING_MAIL_MAX_SIZE=5mb`
* `SPAMASSASSIN_MAX_MSG_SIZE=5000000`
