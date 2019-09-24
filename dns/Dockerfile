FROM alpine:latest

RUN apk add unbound gettext drill --no-cache

ENV PORT_DNS=53 \
    DNS_CACHE_MIN_TTL=60 \
    DNS_CACHE_MAX_NEGATIVE_TTL=900 \
    DNS_DEBUG=off \
    DNS_STATISTICS_INTERVAL=60 \
    DNS_LOG_QUERIES=yes \
    DNS_LOG_REPLIES=yes \
    DNS_LOG_SERVFAIL=yes

WORKDIR srv
ADD ./ /srv

RUN \
  unbound-anchor -a /usr/share/dnssec-root/trusted-key.key && \
  chown -R root.unbound /usr/share/dnssec-root && \
  chmod -R g+w /usr/share/dnssec-root

HEALTHCHECK --interval=60s --timeout=3s --start-period=5s CMD drill @127.0.0.1 cloudflare.com || exit 1

CMD ["./run.sh"]
