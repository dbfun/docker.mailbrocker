FROM alpine:edge

ENV TZ=Europe/Moscow \
    PORT_CLAMAV=3310 \
    CLAMAV_STREAM_MAX_LENGTH=5M \
    ### Disable Features From Base Image
    ENABLE_SMTP=FALSE

RUN apk add --no-cache clamav clamav-libunrar gettext && \
    # Timezone
    apk add tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo "$TZ" >  /etc/timezone

WORKDIR srv
ADD ./ /srv

CMD ["./run.sh"]
