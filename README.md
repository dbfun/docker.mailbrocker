# What is mailtester?

Mailtester is an open source mail spam testing service. Send email to a special address then check your letter spam score on a website (or check your inbox for reply). Or upload email message (`.eml`) on a website. Or send POST HTTP request on API server then check results with another GET request.

## Service main modules

* Exim MTA
* Website
* API with mail tester engine (Spamassassin, SPF checker, DMARC, Blacklist, Pyzor, Razor)
* DNS resolver Unbound

![Scheme](https://github.com/dbfun/docker.mailtester/raw/master/assets/mailtester.png)

## Features:

* [x] Mail data sourses:
  *   [x] MTA
  *   [x] HTTP API (website use it)
* [x] Special address for auto reply with spam test report

# How to run mailtester on your server

You need to install [docker-compose](https://docs.docker.com/compose/) then configure and run the mailtester service.

## Configuration

1. Copy file `.env.dist` to `.env` then edit `.env`:

    ```sh
    -cp .env.dist .env
    -vim .env
    ```

2. Copy directory `config.dist` to `config` then edit files in it:

    ```sh
    cp -R config.dist config
    vim config/api.checkdelivery.json
    vim config/dnsbl-domains.json
    ```


## Run

Change directory to project directory then run:

```sh
docker-compose up
```

For autotest run:

```sh
make test-compose
```

## For developers

Developers can use `make` utility for run (`make up`), test (`make test-compose`, `make test-unit-mocha`), debug (`make debug-compose`, `make dns-cache`) and stats (`make dns-stats`) purposes. See [Makefile](https://github.com/dbfun/docker.mailtester/blob/master/Makefile) for more information.

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
* [x] Self DNS resolving
* [ ] Mail test queue
* [ ] IPv6 support
  * [x] Spf
  * [ ] DKIM ?
  * [ ] DMARC ?
  * [x] Blacklist
* [ ] WIP: Launch Demo Website

# FAQ

## How to enable DKIM for outgoing messages from API

Public and private keys are created when the service starts. They are stored in `ssl/dkim` and are saved when the service is restarted.

Run:

```sh
make exim-dkim
```

you will see something like this:

```
Add this record to your DNS server:
        Host: mailtester._domainkey.site.ru
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

You will need to create a new TXT record in your DNS server (`mailtester._domainkey.site.ru`).

After that send a test letter to the dedicated address (see `API_REPLY_MTA_REPORT_TO` in config file) and wait for a response. The reply letter must be signed and verified.

`make test-unit-mocha` also sends test email on `ADMIN_EMAIL`.

### Troubleshooting

```sh
docker-compose exec exim sh -c "exim -bP transports | grep dkim"
docker-compose exec exim hostname
docker-compose exec exim env
```

## What is the reason for using your own DNS resolver?

Some DNSBLs block public DNS due to high volume queries:

> Query Refused. See http://uribl.com/refused.shtml for more information [Your DNS IP: 77.88.56.72]

Own DNS resolver (unbound) used in Spamassassin and Blacklist modules.

## How to increase incoming email size?

Default email size is 5 Mb. Change this settings in `config/.env` file:

* `EXIM_INCOMING_MAIL_MAX_SIZE=5M`
* `API_INCOMING_MAIL_MAX_SIZE=5mb`
* `SPAMASSASSIN_MAX_MSG_SIZE=5000000`
