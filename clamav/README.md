# About

This is a Clamav container.

Usage: in project root dir run: `make up` for starting all containers bundle and `make down` for stopping.

[Clamav usage](https://www.clamav.net/documents/usage)


# Limits

How many times per hour shall I run freshclam?

You can check for database update as often as 4 times per hour provided that you have the following options in freshclam.conf:

DNSDatabaseInfo current.cvd.clamav.net

DatabaseMirror db.XY.clamav.net

DatabaseMirror database.clamav.net

Replace XY with your country code. If you don’t have that option, then you must stick with 1 check per hour.

[Source](https://www.clamav.net/documents/clamav-virus-database-faq)
