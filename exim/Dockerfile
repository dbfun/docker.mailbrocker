FROM alpine:latest

RUN apk add --no-cache exim curl

### dev section
ENV ENV="/etc/profile"
ADD ./dev.profile.sh /etc/profile.d/dev.profile.sh
RUN apk add --no-cache busybox-extras exim-scripts tree man
### end dev section

RUN mkdir -p        /var/spool/mail /var/mail /var/spool/exim /var/spool/exim/db /var/spool/exim/input /var/spool/exim/msglog && \
    chmod 775       /var/spool/mail /var/mail /var/spool/exim /var/spool/exim/db /var/spool/exim/input /var/spool/exim/msglog && \
    chown exim.mail /var/spool/mail /var/mail /var/spool/exim /var/spool/exim/db /var/spool/exim/input /var/spool/exim/msglog && \
    adduser -D -G mail mailtester

ADD ./run.sh /run.sh
ADD ./api-pipe.sh /srv/api-pipe.sh
ADD ./exim.conf /etc/exim/exim.conf

ENV EXIM_DOMAIN=your-domain.com \
    EXIM_DEBUG=on \
    EXIM_INCOMING_MAIL_MAX_SIZE=5M \
    PORT_EXIM=25 \
    PORT_API=8080

HEALTHCHECK --interval=60s --timeout=5s --start-period=5s CMD exiwhat | grep -qF "listening for SMTP on port" || exit 1

CMD ["/run.sh"]
