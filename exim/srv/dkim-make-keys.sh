#!/bin/sh

# This script creates new DKIM keys for Exim

openssl genrsa -out /etc/ssl/certs/dkim/private.key 2048
openssl rsa -pubout -in /etc/ssl/certs/dkim/private.key -out /etc/ssl/certs/dkim/public.key

chown -R mail.mail /etc/exim/dkim
# Prevent error: OSError: Can not read file in context: /home/hub/mailtester/exim/dkim-keys/private.key
chmod 644 /etc/ssl/certs/dkim/*.key
