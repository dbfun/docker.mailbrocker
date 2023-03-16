FROM alpine:latest

ENV TZ=Europe/Moscow

RUN apk add --no-cache spamassassin && sa-update && \
    # Timezone
    apk add tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo "$TZ" >  /etc/timezone

ADD ./docker/spamassassin /srv

WORKDIR srv

CMD "./run.sh"
