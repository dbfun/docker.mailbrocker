FROM alpine

# DKIM, DMARC
ADD http://deb.debian.org/debian/pool/main/libm/libmail-dkim-perl/libmail-dkim-perl_0.40.orig.tar.gz /tmp
RUN apk add perl make perl-crypt-openssl-rsa perl-mailtools perl-net-dns && \
    apk add opendmarc --update-cache --repository http://nl.alpinelinux.org/alpine/edge/testing && \
    cd /tmp/ && \
    tar -xzf libmail-dkim-perl_0.40.orig.tar.gz && \
    cd /tmp/Mail-DKIM-0.40 && \
    perl Makefile.PL && \
    make && \
    make install && \
    mv /tmp/Mail-DKIM-0.40/scripts/dkimverify.pl /usr/bin/dkimproxy-verify && \
    rm -rf /tmp/libmail-dkim-perl_0.40.orig.tar.gz /tmp/Mail-DKIM-0.40

# App
ADD ./package.json /tmp/package.json

RUN apk add --no-cache nodejs npm spamassassin-client libspf2-tools && \
    npm install --global pm2 mocha && \
    cd /tmp && \
    npm install

ADD . /srv
WORKDIR srv

RUN mv /tmp/node_modules /srv

ENV PORT_SPAMASSASSIN=783 \
    PORT_API=8080 \
    API_INCOMING_MAIL_MAX_SIZE=5mb \
    SPAMASSASSIN_MAX_MSG_SIZE=5000000 \
    MONGO_URI=mongodb://mongo:27017/mailtester \
    MONGO_DB=mailtester \
    API_MAX_MAIL_COUNT=2000

CMD [ "pm2-runtime", "--watch", "index.js" ]
