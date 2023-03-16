FROM alpine:edge

ADD http://deb.debian.org/debian/pool/main/libm/libmail-dkim-perl/libmail-dkim-perl_0.40.orig.tar.gz /tmp

ENV PORT_SPAMASSASSIN=783 \
    PORT_API=8080 \
    IP_DNS_RESOLVER="10.1.0.105" \
    API_INCOMING_MAIL_MAX_SIZE=5mb \
    SPAMASSASSIN_MAX_MSG_SIZE=5000000 \
    MONGO_URI=mongodb://mongo:27017/mailtester \
    MONGO_DB=mailtester \
    API_MAX_MAIL_COUNT=2000 \
    API_CATCH_MTA_ALL=off \
    API_CATCH_MTA_TO=all,any,reply,autoreply \
    API_REPLY_MTA_REPORT_ALL=off \
    API_REPLY_MTA_REPORT_TO=reply,autoreply \
    EXIM_DOMAIN=your-domain.com \
    EXIM_MAIL_USER=noreply \
    EXIM_MAIL_PASS=exim_mail_password \
    EXIM_MAIL_FROM=noreply@your-domain.com \
    ADMIN_EMAIL=your-mail@gmail.com \
    API_DOMAIN=your-domain.com \
    API_DOMAIN_PROTOCOL=http \
    API_AVAILABLE_TESTS=spamassassin,spf,spfcompare,dkim,dmarc,blacklist,pyzor,razor \
    TZ=Europe/Moscow

RUN \
    apk add swaks --repository http://nl.alpinelinux.org/alpine/edge/testing && \
    # Healthcheck
    apk add curl && \
    # DKIM
    apk add perl make perl-crypt-openssl-rsa perl-mailtools perl-net-dns && \
    cd /tmp/ && \
    tar -xzf libmail-dkim-perl_0.40.orig.tar.gz && \
    cd /tmp/Mail-DKIM-0.40 && \
    perl Makefile.PL && \
    make && \
    make install && \
    mv /tmp/Mail-DKIM-0.40/scripts/dkimverify.pl /usr/bin/dkimproxy-verify && \
    cd / && \
    rm -rf /tmp/libmail-dkim-perl_0.40.orig.tar.gz /tmp/Mail-DKIM-0.40 && \
    # DMARC
    apk add opendmarc --update-cache --repository http://nl.alpinelinux.org/alpine/edge/testing && \
    # Pyzor
    apk add python3 && \
    pip3 install pyzor && \
    # SPF
    apk add libspf2-tools && \
    # Spamassassin client
    apk add spamassassin-client && \
    # Razor
    apk add razor && \
    # NodeJS bundle
    apk add --no-cache nodejs npm && \
    npm install --global pm2 mocha && \
    # dig
    apk add bind-tools && \
    # Timezone
    apk add tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo "$TZ" >  /etc/timezone

# App
ADD ./package.json ./package-lock.json /tmp/

RUN cd /tmp && \
    npm install

WORKDIR srv
ADD . /srv

RUN mv /tmp/node_modules /srv



HEALTHCHECK --interval=5s --timeout=1s --start-period=5s CMD ./docker-healthcheck.sh || exit 1

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
