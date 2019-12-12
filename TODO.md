[ ] `lastMtaIP` bad works with `ham-green-concert.eml` (127.0.0.1)
[ ] Check Spamassassin and others waiting for the whole letter (with headers) or only "body"
[ ] mail.ru reject spam letters, see below. How about use it?


```
swaks --to email@mail.ru --from junk@gmail.com --add-header "Subject: Test _id: 5d443c9882cd8e56734b18e9" --add-header "X-Mailtester: 5d443c9882cd8e56734b18e9"

<** 550 spam message rejected. Please visit http://help.mail.ru/notspam-support/id?c=37o1uvXUfWYxWJiJJ-wYxPhLrs9SgNsqDKLqJ1_v5c0HAAAAG8gAAGfRbRs~ or  report details to
abuse@corp.mail.ru. Error code: BA35BADF667DD4F589985831C418EC27CFAE4BF82ADB805227EAA20CCDE5EF5F. ID: 000000070000C81B1B6DD167.
 -> QUIT
```
