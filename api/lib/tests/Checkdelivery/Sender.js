"use strict";

/**
 * Not working! WIP.
 */

const
  { spawn } = require('child_process')
  ;
/*

cat email.eml | swaks -g --to test@gmail.com --header "X-Mailbroker: 5df3e1bce7a84d14f2adf359" --from noreply@site.com --attach

options order is important!

-g  If specified, Swaks will read the DATA value for the mail from
    STDIN. This is equivalent to "--data -". If there is a From_ line in
    the email, it will be removed (but see -nsf option). Useful for
    delivering real message (stored in files) instead of using example
    messages.


*/

class CheckdeliverySender {

  constructor(config) {
    this.config = config;
  }

  sendAll(ObjectId, rawBody) {
    for(let mailbox of this.config.mailboxes) {
      try {
        console.log(`checkdelivery send: ${mailbox.email} ${ObjectId}`);
        this.send(mailbox.email, ObjectId, rawBody);
      } catch (e) {
        console.log(e);
      }
    }
  }

  send(emailTo, ObjectId, rawBody) {
    return new Promise(async(resolve, reject) => {
      let options = [
        "-g",
        "--to", emailTo,
        "--from", this.config.mailFrom,
        "--header", `X-Mailbroker: ${ObjectId}`,
        "--header", `Message-Id: <${this.generateMessageId()}>`,
        "--header", `DKIM-Signature: `, // Exim will change it
        "--header", `From: ${this.config.mailFrom}`,
        "--header", `To: ${emailTo}`,
        "--header", `Return-Path: ${emailTo}`,
        "--attach",
        "--auth", "LOGIN",
        "--auth-user", process.env.EXIM_MAIL_USER,
        "--auth-password", process.env.EXIM_MAIL_PASS,
        "--server", "exim",
        "-p", process.env.EXIM_PORT
      ];

      // console.log(options); process.exit();

      const swaks = spawn('/usr/bin/swaks', options);
      swaks.stdin.write(rawBody);

      let stdout = '';
      let stderr = '';

      swaks.stdout.on('data', (data) => {
        stdout += data;
      });

      swaks.stderr.on('data', (data) => {
        stderr += data;
      });

      swaks.on('close', (code) => {
        if(code !== 0) {
          // console.log(stdout);
          // console.log(stderr);
          reject(new Error(stderr));
          return;
        }
        resolve(stdout);
      });

      swaks.stdin.end();
    });
  }

  generateMessageId() {
    return `${(new Date).getTime()}-${this.config.mailFrom}`;
  }

}

module.exports.CheckdeliverySender = CheckdeliverySender;
