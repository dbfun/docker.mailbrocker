# About

This is a DNS resolver container.

The file `unbound.reference.conf` contains original Unbound config. Use `diff unbound.reference.conf unbound.conf` to
see the changes.

The file `unbound.conf` uses env variables such as `DNS_STATISTICS_INTERVAL`. `envsubst` transforms this config file:
`envsubst < ./unbound.conf > /etc/unbound/unbound.conf` in `run.sh` script. 

# Links

* [Configure: ru](https://www.lissyara.su/articles/freebsd/programms/unbound/)
