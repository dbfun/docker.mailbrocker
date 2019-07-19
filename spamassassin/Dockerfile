FROM alpine
RUN apk add spamassassin && sa-update

ADD . /srv

WORKDIR srv

CMD "./run.sh"