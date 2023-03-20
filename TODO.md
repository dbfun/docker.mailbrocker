# GitLab integration

[x] Поправить docker-compose.yml
[ ] Уменьшить количество настроек, сделать генерацию:
    [x] Убрать API_CATCH_MTA_ALL
    [x] Убрать API_REPLY_MTA_REPORT_ALL
    [ ] Привести к одной настройке API_INCOMING_MAIL_MAX_SIZE и аналоги (SPAMASSASSIN_MAX_MSG_SIZE, EXIM_INCOMING_MAIL_MAX_SIZE)
    [x] Генерировать EXIM_MAIL_USER, EXIM_MAIL_PASS, EXIM_MAIL_FROM - не просто, плюс надо прокидывать между окружениями.
        EXIM_MAIL_FROM - это поле FROM, может отличаться от EXIM_MAIL_USER.
    [ ] Генерировать SECURITY_SALT
[ ] Продублировать настройки из .env в GitLab variables
[ ] Развернуть CI/CD (.gitlab-ci.yml)
[ ] Каталог /ssl содержит сертификаты для DKIM - это нужно включить в CI/CD или придумать другое решение
[ ] Каталог /config - собирать в CI/CD
[ ] Обновить npm-пакеты
[ ] Обновить документацию
[ ] Переименовать названия в mailbroker

# Old TODO

[ ] `lastMtaIP` bad works with `ham-green-concert.eml` (127.0.0.1)
[ ] Check Spamassassin and others waiting for the whole letter (with headers) or only "body"
[ ] mail.ru reject spam letters, see below. How about use it?
[ ] Exim warning: `Suggested action: either install a certificate or change tls_advertise_hosts option`
[ ] replace some `test-letters`, some tests fails
[ ] check `TO`: reject wrong domains. E.g. allow `a.site.com` and reject `b.site.com`
[ ] Add SA rules via "SpamAssassin rules file"
[ ] ADD SA Test letters from "spamassassin/t/data/dkim"
[ ] Make translations:
    - SA:
      - https://spamassassin.apache.org/full/3.0.x/dist/rules/30_text_fr.cf
      - http://spamassassin.apache.org/old/tests_3_3_x.html
      - http://www.sisyphus.ru/ru/srpm/BP3/spamassassin/sources/3
      - http://eastoverhill.co.uk/techref/spam_assasin_test_settings.htm
[ ] Check free mails: https://identibyte.com/
[ ] Pwned https://haveibeenpwned.com/API/v3
```
swaks --to email@mail.ru --from junk@gmail.com --add-header "Subject: Test _id: 5d443c9882cd8e56734b18e9" --add-header "X-Mailbroker: 5d443c9882cd8e56734b18e9"

<** 550 spam message rejected. Please visit http://help.mail.ru/notspam-support/id?c=37o1uvXUfWYxWJiJJ-wYxPhLrs9SgNsqDKLqJ1_v5c0HAAAAG8gAAGfRbRs~ or  report details to
abuse@corp.mail.ru. Error code: BA35BADF667DD4F589985831C418EC27CFAE4BF82ADB805227EAA20CCDE5EF5F. ID: 000000070000C81B1B6DD167.
 -> QUIT
```
