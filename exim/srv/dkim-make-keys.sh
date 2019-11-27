#!/bin/sh

# This script creates new DKIM keys for Exim

openssl genrsa -out /etc/exim/dkim/private.key 2048
openssl rsa -pubout -in /etc/exim/dkim/private.key -out /etc/exim/dkim/public.key

chown -R mail.mail /etc/exim/dkim
# Prevent error: OSError: Can not read file in context: /home/hub/mailtester/exim/dkim-keys/private.key
chmod 644 /etc/exim/dkim/*.key
