FROM alpine:3.17.3

ENV TZ=Europe/Moscow

RUN apk add --no-cache unbound gettext drill && \
    # Timezone
    apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo "$TZ" > /etc/timezone && \
    # Save original config
    cp /etc/unbound/unbound.conf /etc/unbound/unbound.reference.conf

RUN \
    chown -R root.unbound /usr/share/dnssec-root && \
    chmod -R g+w /usr/share/dnssec-root

WORKDIR srv
ADD ./docker/dns /srv

HEALTHCHECK --interval=60s --timeout=3s --start-period=5s CMD drill @127.0.0.1 cloudflare.com || exit 1

CMD ["./run.sh"]
