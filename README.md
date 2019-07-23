# Check your mail for spam

Email to special address then check your spam score.

Modules:

* Exim MTA
* Tester
* API
* Web site

# FAQ

## How to increase incoming email size

Change these settings in `.env` file:

* `EXIM_INCOMING_MAIL_MAX_SIZE=5M`
* `API_INCOMING_MAIL_MAX_SIZE=5mb`
* `SPAMASSASSIN_MAX_MSG_SIZE=5000000`
