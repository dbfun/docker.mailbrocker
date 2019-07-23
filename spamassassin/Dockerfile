FROM alpine
RUN apk add --no-cache spamassassin && sa-update

ADD . /srv

WORKDIR srv

ENV PORT_SPAMASSASSIN=783

CMD "./run.sh"
