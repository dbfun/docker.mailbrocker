FROM alpine

ADD http://deb.debian.org/debian/pool/main/libm/libmail-dkim-perl/libmail-dkim-perl_0.40.orig.tar.gz /tmp

RUN \
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
    npm install --global pm2 mocha

# App
ADD ./package.json ./package-lock.json /tmp/

RUN cd /tmp && \
    npm install

WORKDIR srv
ADD . /srv

RUN mv /tmp/node_modules /srv

ENV PORT_SPAMASSASSIN=783 \
    PORT_API=8080 \
    API_INCOMING_MAIL_MAX_SIZE=5mb \
    SPAMASSASSIN_MAX_MSG_SIZE=5000000 \
    MONGO_URI=mongodb://mongo:27017/mailtester \
    MONGO_DB=mailtester \
    API_MAX_MAIL_COUNT=2000 \
    API_CATCH_ALL_MTA=off \
    API_CATCH_ALL_MTA_TO=all,any

CMD [ "pm2-runtime", "--watch", "index.js" ]
