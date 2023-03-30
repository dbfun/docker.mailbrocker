FROM alpine:3.17.3 AS production

ENV TZ=Europe/Moscow

ADD http://deb.debian.org/debian/pool/main/libm/libmail-dkim-perl/libmail-dkim-perl_0.40.orig.tar.gz /tmp

RUN \
    # Swaks
    apk add --no-cache swaks --repository http://nl.alpinelinux.org/alpine/edge/testing && \
    # Healthcheck
    apk add --no-cache curl && \
    # DKIM
    apk add --no-cache perl make perl-crypt-openssl-rsa perl-mailtools perl-net-dns && \
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
    apk add --no-cache opendmarc --update-cache --repository http://nl.alpinelinux.org/alpine/edge/testing && \
    # Pyzor
    apk add --no-cache python3 py3-pip && \
    pip3 install pyzor && \
    # SPF
    apk add --no-cache libspf2-tools && \
    # Spamassassin client
    apk add --no-cache spamassassin-client && \
    # Razor
    apk add --no-cache razor && \
    # NodeJS bundle
    apk add --no-cache nodejs npm && \
    npm install --global pm2 mocha && \
    # dig
    apk add --no-cache bind-tools && \
    # Timezone
    apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo "$TZ" >  /etc/timezone

# Quick rebuild optimization
ADD ./api/package.json ./api/package-lock.json /tmp/

RUN cd /tmp && \
    npm install

WORKDIR /srv
ADD ./api /srv

RUN mv /tmp/node_modules /srv

HEALTHCHECK --interval=15s --timeout=3s --start-period=15s CMD ./docker-healthcheck.sh || exit 1

RUN mkdir /etc/api

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]

##################################
#                                #
#           Workspace            #
#                                #
##################################

FROM production AS workspace

RUN apk add --no-cache zsh git shadow perl-net-ssleay bash jq apache2-utils busybox-extras --update-cache --repository http://nl.alpinelinux.org/alpine/edge/testing

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