FROM alpine:3.17.3

ENV TZ=Europe/Moscow

RUN apk add --no-cache exim curl openssl && \
    # Timezone
    apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo "$TZ" > /etc/timezone && \
    # Save original config
    cp /etc/exim/exim.conf /etc/exim/exim.reference.conf

### dev section
# TODO multistage for develop and production
# @see https://stackoverflow.com/a/67937236/9435985
ENV ENV="/etc/profile"
ADD ./docker/exim/dev.profile.sh /etc/profile.d/dev.profile.sh
RUN apk add --no-cache busybox-extras exim-scripts tree
### end dev section

WORKDIR srv
ADD ./docker/exim/srv /srv

ADD ./docker/exim/exim.conf /etc/exim/exim.conf

HEALTHCHECK --interval=60s --timeout=5s --start-period=5s CMD exiwhat | grep -qF "listening for SMTP on port" || exit 1

CMD ["/srv/run.sh"]
