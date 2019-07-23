FROM alpine

ADD ./package.json /tmp/package.json

RUN apk add --no-cache nodejs npm spamassassin-client && \
    npm install pm2 -g && \
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
    MONGO_MAIL_SIZE=300000000

CMD [ "pm2-runtime", "--watch", "index.js" ]
