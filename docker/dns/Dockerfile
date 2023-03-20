FROM alpine:edge

ENV \
    DNS_CACHE_MIN_TTL=60 \
    DNS_CACHE_MAX_TTL=900 \
    DNS_CACHE_MAX_NEGATIVE_TTL=900 \
    DNS_DEBUG=off \
    DNS_STATISTICS_INTERVAL=0 \
    DNS_LOG_QUERIES=no \
    DNS_LOG_REPLIES=no \
    DNS_LOG_SERVFAIL=no \
    TZ=Europe/Moscow

RUN apk add unbound gettext drill --no-cache && \
    # Timezone
    apk add tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo "$TZ" >  /etc/timezone

RUN \
    chown -R root.unbound /usr/share/dnssec-root && \
    chmod -R g+w /usr/share/dnssec-root

WORKDIR srv
ADD ./docker/dns /srv

HEALTHCHECK --interval=60s --timeout=3s --start-period=5s CMD drill @127.0.0.1 cloudflare.com || exit 1

CMD ["./run.sh"]
