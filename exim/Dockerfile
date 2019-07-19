FROM alpine:latest

# TODO: minify

RUN apk add --no-cache exim

# dev section
ENV ENV="/etc/profile"
ADD ./dev.profile.sh /etc/profile.d/dev.profile.sh
RUN apk add --no-cache busybox-extras exim-scripts tree man
# end dev section

RUN mkdir -p /var/spool/mail/ /var/mail/ && \
    chmod 775 /var/spool/mail/ /var/mail/ && \
    chown root.mail /var/spool/mail/ /var/mail/ && \
    adduser -D -G mail mailtester

ADD ./exim.sh /exim.sh
ADD ./exim.conf /etc/exim/exim.conf

ENV EXIM_DOMAIN=your-domain.com \
    # on/off
    DEBUG_EXIM=on

CMD ["/exim.sh"]
