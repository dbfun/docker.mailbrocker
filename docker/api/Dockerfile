FROM alpine:edge AS production

ADD http://deb.debian.org/debian/pool/main/libm/libmail-dkim-perl/libmail-dkim-perl_0.40.orig.tar.gz /tmp

ENV API_INCOMING_MAIL_MAX_SIZE=5mb \
    SPAMASSASSIN_MAX_MSG_SIZE=5000000 \
    MONGO_URI=mongodb://mongo:27017/mailbroker \
    MONGO_DB=mailbroker \
    API_MAX_MAIL_COUNT=2000 \
    API_CATCH_MTA_ALL=off \
    API_CATCH_MTA_TO=all,any,reply,autoreply \
    API_REPLY_MTA_REPORT_ALL=off \
    API_REPLY_MTA_REPORT_TO=reply,autoreply \
    PORT_EXIM=25 \
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
    apk add python3 py3-pip && \
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
ADD ./api/package.json ./api/package-lock.json /tmp/

RUN cd /tmp && \
    npm install

WORKDIR /srv
ADD ./api /srv

RUN mv /tmp/node_modules /srv

HEALTHCHECK --interval=5s --timeout=1s --start-period=5s CMD ./docker-healthcheck.sh || exit 1

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]

##################################
#                                #
#           Workspace            #
#                                #
##################################

FROM production AS workspace

RUN apk add zsh git shadow perl-net-ssleay bash jq apache2-utils busybox-extras --update-cache --repository http://nl.alpinelinux.org/alpine/edge/testing

ARG PUID=1000
ENV PUID ${PUID}
ARG PGID=1000
ENV PGID ${PGID}

RUN groupadd -g ${PGID} develop && \
    useradd -u ${PUID} -g develop -m develop

USER develop

# Install "Oh my zsh"
# @see https://ohmyz.sh/
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh) --keep-zshrc" && \
    git clone https://github.com/zsh-users/zsh-autosuggestions /home/develop/.oh-my-zsh/custom/plugins/zsh-autosuggestions && \
    echo -e '\nsource ~/Xzibit/.zshrc' >> ~/.zshrc

ADD ./docker/workspace/home/Xzibit /home/develop/Xzibit

# Настройка плагинов
RUN sed -i -r 's/^plugins=\(.*?\)$/plugins=(zsh-autosuggestions zsh-navigation-tools alias-finder)/' /home/develop/.zshrc

CMD ["sleep", "1000000000"]