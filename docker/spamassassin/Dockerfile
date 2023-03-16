FROM alpine:latest

ENV PORT_SPAMASSASSIN=783 \
    TZ=Europe/Moscow

RUN apk add --no-cache spamassassin && sa-update && \
    # Timezone
    apk add tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo "$TZ" >  /etc/timezone

ADD ./docker/spamassassin /srv

WORKDIR srv

CMD "./run.sh"
