# About

This is a MTA container.

The file `exim.reference.conf` contains original Exim config from repo.
The `exim.conf` file contains too many changes to compare with the original file.

# Useful commands

## Config

Reload config:

```sh
kill -HUP `cat /var/run/exim.pid`
```

Config list:

```sh
exim -bP
```

Check config:

```
exim -bV
```

## Run

Run Exim as daemon in debug mode:

```sh
exim -bd -d
```

Run Exim as daemon in debug mode (less verbosity):

```sh
exim -bd -v
```

## Frozen emails

List of frozen emails:

```sh
exim -bp
```

Show headers:

```sh
exim -Mvh {uid}
```

Show body:

```sh
exim -Mvb {uid}
```

## Send mail

Run:

```sh
exim -v user@site.com
```

then type:

```
From: root@hostname.domain.com
To: user@site.com
Subject: test letter
test
````

Use `^D` when end typing.

## Check for Open Relay `check-relay.com`

```sh
echo "This is the message body" | swaks -g --to somebody@gmail.com --from "somebody@gmail.com" --auth LOGIN --auth-user "you@example.com" --auth-password "abc123" --server check-relay.com -tls
```

## Other

Check route and transport (e.g. router = localuser, transport = local_delivery):

```sh
exim -bt email@site.com
```

What Exim is doing:

```sh
exiwhat
```

Stats:

```sh
eximstats /var/log/exim/mainlog
```

# Snippets

```
# Set ACL policy after command "DATA"
acl_smtp_data = check_message

# check_messages ACL rules
check_message:

    deny message = "Sorry, Charlie: $regex_match_string"
    regex = ^Subject:: .*Lower your self-esteem by becoming a sysadmin

    accept
```

# Links

* en: see man `/usr/share/doc/exim4-base/` in Debian
* en: [avenus/exim-relay](https://hub.docker.com/r/avenus/exim-relay/dockerfile)
* en: [Exim command line](https://www.exim.org/exim-html-current/doc/html/spec_html/ch-the_exim_command_line.html)
* en: [Проверить на openrelay](https://beta.mxtoolbox.com/SuperTool.aspx?action=smtp)
* ru: [EXIM 4.62](https://www.lissyara.su/doc/exim/4.62/the_default_configuration_file/)
* ru: [Полезные команды Exim](http://adminunix.ru/polezny-e-komandy-exim/)
