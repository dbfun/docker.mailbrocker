FROM alpine:latest

# TODO: minify

RUN apk add --no-cache exim curl

# dev section
ENV ENV="/etc/profile"
ADD ./dev.profile.sh /etc/profile.d/dev.profile.sh
RUN apk add --no-cache busybox-extras exim-scripts tree man
# end dev section

RUN mkdir -p        /var/spool/mail /var/mail /var/spool/exim /var/spool/exim/db /var/spool/exim/input /var/spool/exim/msglog && \
    chmod 775       /var/spool/mail /var/mail /var/spool/exim /var/spool/exim/db /var/spool/exim/input /var/spool/exim/msglog && \
    chown exim.mail /var/spool/mail /var/mail /var/spool/exim /var/spool/exim/db /var/spool/exim/input /var/spool/exim/msglog && \
    adduser -D -G mail mailtester

ADD ./run.sh /run.sh
ADD ./exim.conf /etc/exim/exim.conf

ENV EXIM_DOMAIN=your-domain.com \
    DEBUG_EXIM=on \
    EXIM_INCOMING_MAIL_MAX_SIZE=5M \
    PORT_EXIM=25 \
    PORT_API=8080

CMD ["/run.sh"]
