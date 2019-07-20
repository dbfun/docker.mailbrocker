FROM alpine
RUN apk add --no-cache spamassassin && sa-update

ADD . /srv

WORKDIR srv

CMD "./run.sh"