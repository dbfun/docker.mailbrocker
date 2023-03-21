FROM alpine:latest

RUN apk add --no-cache exim curl openssl

### dev section
# TODO multistage for develop and production
# @see https://stackoverflow.com/a/67937236/9435985
ENV ENV="/etc/profile"
ADD ./docker/exim/dev.profile.sh /etc/profile.d/dev.profile.sh
RUN apk add --no-cache busybox-extras exim-scripts tree
### end dev section

ENV \
    EXIM_DOMAIN=your-domain.com \
    EXIM_PORT=25 \
    INCOMING_MAIL_MAX_SIZE_KILOBYTES=5000 \
    EXIM_MAIL_USER=noreply \
    EXIM_MAIL_PASS=exim_mail_password \
    EXIM_DKIM_SELECTOR=mailbroker \
    EXIM_MAX_PARALLEL=2 \
    EXIM_DEBUG=on \
    TZ=Europe/Moscow

# Timezone
RUN apk add tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo "$TZ" >  /etc/timezone

WORKDIR srv
ADD ./docker/exim/srv /srv

ADD ./docker/exim/exim.conf /etc/exim/exim.conf

HEALTHCHECK --interval=60s --timeout=5s --start-period=5s CMD exiwhat | grep -qF "listening for SMTP on port" || exit 1

CMD ["/srv/run.sh"]
