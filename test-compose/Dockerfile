FROM alpine:edge

ENV EXIM_DOMAIN=your-domain.com \
    RUN_TESTS=on \
    PORT_API=8080 \
    PORT_EXIM=25 \
    TZ=Europe/Moscow

RUN apk add curl swaks perl-net-dns perl-net-ssleay bash jq bind-tools spamassassin-client apache2-utils --update-cache --repository http://nl.alpinelinux.org/alpine/edge/testing && \
    # Timezone
    apk add tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo "$TZ" >  /etc/timezone

ADD . /srv
WORKDIR /srv

CMD "./test.sh"
