FROM alpine

ADD ./package.json /tmp/package.json

RUN apk add --no-cache nodejs npm && \
    npm install pm2 -g && \
    cd /tmp && \
    npm install

ADD . /srv
WORKDIR srv

RUN mv /tmp/node_modules /srv

ENV INCOMING_MAIL_PORT=8080 \
    MONGO_URI=mongodb://mongo:27017/mailtester \
    MONGO_DB=mailtester \
    # Size of all stored mails; Old mails will be deleted; (100 kB per letter + 50 kB check results) * 2000 letters ~ 300 MB ~ 300000000 bytes
    MONGO_MAIL_SIZE=300000000

CMD [ "pm2-runtime", "--watch", "index.js" ]