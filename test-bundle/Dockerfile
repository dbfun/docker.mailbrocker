FROM alpine

RUN apk add curl swaks perl-net-dns perl-net-ssleay bash --update-cache --repository http://nl.alpinelinux.org/alpine/edge/testing

ADD . /srv
WORKDIR /srv

ENV EXIM_DOMAIN=your-domain.com \
    RUN_TESTS=on \
    PORT_API=8080 \
    PORT_EXIM=25

CMD "./test.sh"
