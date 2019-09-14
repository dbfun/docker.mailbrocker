FROM alpine:latest

RUN apk add unbound gettext drill --no-cache

ENV PORT_DNS=53 \
    DNS_CACHE_MIN_TTL=60 \
    DNS_CACHE_MAX_NEGATIVE_TTL=900

WORKDIR srv
ADD ./ /srv

HEALTHCHECK --interval=5s --timeout=3s --start-period=5s CMD drill @127.0.0.1 cloudflare.com || exit 1

CMD ["./run.sh"]