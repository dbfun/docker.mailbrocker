# Проверка писем на спам

Составные части:

* `exim` - прием сообщений
* TODO инструменты проверки (`spamassassin`, etc)
* TODO `api` - получение информации о проверке

## Настройки

@see docker-compose.yml

# Exim

## Конфигурация

За основу взята стандартная конфигурация (см первый коммит), внесенные изменения помечены в тексте `CUSTOM`

## Полезные команды

```
# Перезагрузить конфиг exim
kill -HUP `cat /var/run/exim.pid`

# Что делает Exim
exiwhat

# проверка доставки - какой будет роутинг и транспорт (fe: router = localuser, transport = local_delivery)
exim -bt email@spam24.ru

# статистика
eximstats /var/log/exim/mainlog

# вывод конфигурации
exim -bP

# запускает exim как демон, выводя на консоль всю отладочную информацию
exim -bd -d

# запускает exim как демон, выводя на консоль действия Exim (без подробностей)
exim -bd -v

# проверка конфига
exim -bV
```

Frozen emails:

```
# список
exim -bp

# просмотр заголовка
exim -Mvh uid

# просмотр тела
exim -Mvb uid
```

## Тестирование доставки

Отправка сообщения используя локальный MTA:

```
# exim -v user@mail.ru
Далее вводим руками заголовок письма:

From: root@hostname.domain.com
To: user@mail.ru
Subject: test letter
test
^D
^C
````

Проверка Open Relay `check-relay.com`:

```
echo "This is the message body" | swaks --to somebody@gmail.com --from "somebody@gmail.com" --auth LOGIN --auth-user "you@example.com" --auth-password "abc123" --server check-relay.com -tls
```

## Сниппеты

```
# Назначить ACL для использования после команды DATA
acl_smtp_data = check_message

# Условия проверки для check_messages ACL
check_message:

    deny message = "Sorry, Charlie: $regex_match_string"
    regex = ^Subject:: .*Lower your self-esteem by becoming a sysadmin

    accept
```

# Spamassassin

* https://www.opennet.ru/base/net/tranz_spamassassin.txt.html
* https://github.com/dinkel/docker-spamassassin
* https://cwiki.apache.org/confluence/display/SPAMASSASSIN/X+Spam+Status
* https://github.com/bombbomb/spamassassin-node-api
* https://hub.docker.com/r/analogic/poste.io/
* https://github.com/instantlinux/docker-tools/tree/master/images/spamassassin


# Ссылки

* en: `/usr/share/doc/exim4-base/` в Debian
* en: [avenus/exim-relay](https://hub.docker.com/r/avenus/exim-relay/dockerfile)
* en: [Exim command line](https://www.exim.org/exim-html-current/doc/html/spec_html/ch-the_exim_command_line.html)
* en: [Проверить на openrelay](https://beta.mxtoolbox.com/SuperTool.aspx?action=smtp)
* ru: [EXIM 4.62](https://www.lissyara.su/doc/exim/4.62/the_default_configuration_file/)
* ru: [VPS - почтовый сервер](https://dka-develop.ru/blog/article/7-vps-pochtovyy-server-ubuntu-debian-0607171734)
* ru: [Полезные команды Exim](http://adminunix.ru/polezny-e-komandy-exim/)
* ru: [Полный синтаксис DKIM, DMARC и SPF](https://habr.com/ru/post/343128/)
* en: [List of all RBLs](http://multirbl.valli.org/list/)
* en: [Blacklists check](http://www.ip-score.com/)
* en: [blacklistalert](http://www.blacklistalert.org/)
* en: [Blacklist Check](https://whatismyipaddress.com/blacklist-check)
* en: [System: Expanding IPv6 Addresses for DNSBL Checks](https://www.the-art-of-web.com/system/ipv6-expand-for-rbl/)
