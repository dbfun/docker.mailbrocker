# What is mailbroker?

Mailbroker is an open source mail spam testing service. Send email to a special address then check your letter spam score on a website (or check your inbox for reply). Or upload email message (`.eml`) on a website. Or send POST HTTP request on API server then check results with another GET request.

## Service main modules

* Exim MTA
* Website
* API with mail tester engine (Spamassassin, SPF checker, DMARC, Blacklist, Pyzor, Razor, Checkdelivery)
* DNS resolver Unbound

![mailbroker.png](assets%2Fmailbroker.png)

## Features:

* [x] Mail data sourses:
  *   [x] MTA
  *   [x] HTTP API (website use it)
* [x] Special address for auto reply with spam test report

# How to run mailbroker on your server

You need to install [docker-compose](https://docs.docker.com/compose/) then configure and run the mailbroker service.

## Configuration

Copy file `.env.dist` to `.env` then edit `.env`:

```sh
cp .env.dist .env
vim .env
```

Config variables:

| Variable name                     | Default value                                                | Description                                                                                                                                      |
|-----------------------------------|--------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| DATA_PATH                         | /var/v-mailbroker                                            | Docker persistent volume mount point                                                                                                             |
| TZ                                | Europe/Moscow                                                | Timezone                                                                                                                                         |
| INCOMING_MAIL_MAX_SIZE_KILOBYTES  | 5000                                                         | The maximum size of emails to receive in kilobytes. Larger emails will be rejected. Affects: Exim, API, Spamassassin                             |
| API_DOMAIN                        | your-domain.com                                              | API domain                                                                                                                                       |
| ADMIN_EMAIL                       | your-mail@gmail.com                                          | Admin email for reporting and testing                                                                                                            |
| API_PUBLIC_DNS                    | 8.8.8.8                                                      | Public DNS cache servers comma separated (e.g. 8.8.8.8,1.1.1.1). Used to compare DNS responses from authoritative and cache servers.             |
| API_AVAILABLE_TESTS               | spamassassin,spf,spfcompare,dkim,dmarc,blacklist,pyzor,razor | API available tests comma separated (e.g. spamassassin,spf,dkim,dmarc,blacklist,pyzor,razor,checkdelivery)                                       |
| API_CATCH_MTA_TO                  | all,any,reply,autoreply                                      | Specify dedicated names for catching, comma separated (left side of email address, e.g. "all@site.com" => "all")                                 |
| API_REPLY_MTA_REPORT_TO           | reply,autoreply                                              | Specify dedicated names for reply with spam report, comma separated (left side of email address, e.g. "reply@site.com" => "reply")               |
| API_WORKER_CHECK_ALL_CNT          | 2                                                            | API Worker: prefetch count for RabbitMQ                                                                                                          |
| API_MAX_MAIL_COUNT                | 2000                                                         | This is max mail count, and older letters will be deleted                                                                                        |
| API_PORT                          | 8080                                                         | API HTTP port (not TLS; use a reverse proxy for TLS)                                                                                             |
| EXIM_DOMAIN                       | your-domain.com                                              | Exim domain - send your mails here. Email for a different domain will be rejected.                                                               |
| EXIM_PORT                         | 25                                                           | Exim listening port for incoming emails                                                                                                          |
| EXIM_MAIL_FROM                    | noreply@your-domain.com                                      | Exim technical email                                                                                                                             |
| EXIM_MAIL_USER                    | noreply                                                      | Exim auth credentials for mailing (don't worry it's not an open relay)                                                                           |
| EXIM_MAIL_PASS                    | exim_mail_password                                           | Exim auth credentials for mailing (don't worry it's not an open relay)                                                                           |
| EXIM_DKIM_SELECTOR                | mailbroker                                                   | Exim domain selector for DKIM (mailbroker._domainkey.your-domain.com => mailbroker)                                                              |
| EXIM_MAX_PARALLEL                 | 2                                                            | The maximum number of simultaneous http requests to send emails from Exim to the API. Don't worry about the small value, Exim has its own queue. |
| EXIM_DEBUG                        | off                                                          | Enable it to Exim debug (value: on/off)                                                                                                          |
| DNS_CACHE_MIN_TTL                 | 60                                                           | DNS cache: min TTL value, in seconds                                                                                                             |
| DNS_CACHE_MAX_TTL                 | 900                                                          | DNS cache: min TTL value, in seconds. "0" disables cache.                                                                                        |
| DNS_CACHE_MAX_NEGATIVE_TTL        | 900                                                          | DNS cache: negative responses TTL value, in seconds                                                                                              |
| DNS_DEBUG                         | off                                                          | Enable it to DNS debug (value: on/off)                                                                                                           |
| DNS_STATISTICS_INTERVAL           | 0                                                            | Print DNS statistics to the log (for every thread) every N seconds. Set to 0 to disable                                                          |
| DNS_LOG_QUERIES                   | no                                                           | Log DNS queries (value: yes/no)                                                                                                                  |
| DNS_LOG_REPLIES                   | no                                                           | Log DNS replies (value: yes/no)                                                                                                                  |
| DNS_LOG_SERVFAIL                  | no                                                           | Log DNS servfail (value: yes/no)                                                                                                                 |
| RABBITMQ_DEFAULT_USER             | default_user                                                 | RabbitMQ credentials. Change this values or remove public port from docker-compose.yml!                                                          |
| RABBITMQ_DEFAULT_PASS             | default_pass                                                 | RabbitMQ credentials. Change this values or remove public port from docker-compose.yml!                                                          |
| RABBITMQ_DEFAULT_VHOST            | default_vhost                                                | RabbitMQ credentials. Change this values or remove public port from docker-compose.yml!                                                          |

## Run

Change directory to project directory then run:

```sh
docker-compose up
```

For autotest run:

```sh
make test
```

## For developers

Developers can use `make` utility for:

* run (`make up`)
* test (`make test-integration-bash`, `make test-unit-mocha`)
* debug (`make workspace`, `make dns-cache`)
* stats (`make dns-stats`).
 
See [Makefile](Makefile) for more information.

## Project status

Work in progress

**Stages:**

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
  * [x] Checkdelivery
  * [x] Compare SPF records: authoritative and public DNS
* [x] Self DNS resolving
* [x] Mail test queue
* [ ] IPv6 support
  * [x] Spf
  * [ ] DKIM ?
  * [ ] DMARC ?
  * [x] Blacklist
* [ ] WIP: Launch Demo Website

# FAQ

## How to enable IMAP on Gmail

* enable IMAP access in [Settings > Forwarding and POP/IMAP](https://mail.google.com/mail/u/0/#settings/fwdandpop)
* set "show" for "Spam" on [Settings > Labels](https://mail.google.com/mail/u/0/#settings/labels)
* enable "Allow less secure apps" in [Security > Less secure app access](https://myaccount.google.com/lesssecureapps)

## How to enable DKIM for outgoing messages from API

Public and private keys are created when the service starts. They are stored in `ssl/dkim` and are saved when the service is restarted.

Run:

```sh
make exim-dkim
```

you will see something like this:

```
Add this record to your DNS server:
        Host: mailbroker._domainkey.site.com
        Type: TXT
        Value: v=DKIM1; k=rsa; t=s; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5rN8Sk4i7yRDntB4j+AG3EeBXQppIrGi5Nd20n16/j6u3N7UGlsYKZQqILL8P3KVMVBR8YSdCGHICmkeInKBoZR1VdC5HrWDf4YoykLwScGIx5c7Q1AhCyWpMxPLqOlcztXF0fw8Ue9VXRt01PZstS9PYwiwUjAiDa5O5ZjX7xJ1cKQuiDhE1rhFZ7kurMFbWc//4UFJiEy2TmzpKVSEoBNKa6SuC59T/2ecSGAos1X9j4xZ9P4UxDOP92b7swVRevT7BpwN/Qp8WnQmy5UvP67W7/M4lBRTdQntSif/f/IdwTiA9KIko3++7nBDr0OUsws8p+9wOi8HnuCowOkDAQIDAQAB

Content of public key /etc/exim/dkim/public.key:
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5rN8Sk4i7yRDntB4j+AG
3EeBXQppIrGi5Nd20n16/j6u3N7UGlsYKZQqILL8P3KVMVBR8YSdCGHICmkeInKB
oZR1VdC5HrWDf4YoykLwScGIx5c7Q1AhCyWpMxPLqOlcztXF0fw8Ue9VXRt01PZs
tS9PYwiwUjAiDa5O5ZjX7xJ1cKQuiDhE1rhFZ7kurMFbWc//4UFJiEy2TmzpKVSE
oBNKa6SuC59T/2ecSGAos1X9j4xZ9P4UxDOP92b7swVRevT7BpwN/Qp8WnQmy5Uv
P67W7/M4lBRTdQntSif/f/IdwTiA9KIko3++7nBDr0OUsws8p+9wOi8HnuCowOkD
AQIDAQAB
-----END PUBLIC KEY-----
```

You will need to create a new TXT record in your DNS server (`mailbroker._domainkey.site.com`).

After that send a test letter to the dedicated address (see `API_REPLY_MTA_REPORT_TO` in config file) and wait for a response. The reply letter must be signed and verified.

`make test-unit-mocha` also sends test email on `ADMIN_EMAIL`.

## What is the reason for using your own DNS resolver?

Some DNSBLs block public DNS due to high volume queries:

> Query Refused. See http://uribl.com/refused.shtml for more information [Your DNS IP: 77.88.56.72]

Own DNS resolver (unbound) used in Spamassassin and Blacklist modules.
