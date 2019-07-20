FROM alpine

RUN apk add curl swaks perl-net-dns perl-net-ssleay bash --update-cache --repository http://nl.alpinelinux.org/alpine/edge/testing

ADD . /srv
WORKDIR /srv

ENV EXIM_DOMAIN=your-domain.com

CMD "./test.sh"
