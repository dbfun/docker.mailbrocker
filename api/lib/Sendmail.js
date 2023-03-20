"use strict";

const nodemailer = require('nodemailer');

const mailTransport = nodemailer.createTransport({
  host: 'exim',
  secure: false,
  port: process.env.EXIM_PORT,
  auth: { user: process.env.EXIM_MAIL_USER, pass: process.env.EXIM_MAIL_PASS },
  tls: { rejectUnauthorized: false }
});

class Sendmail {

  async mail(options) {
    return new Promise((resolve, reject) => {
      mailTransport.sendMail(options, (err, info) => {
        if(err) {
          reject(err);
          return;
        }
        resolve(info);
      });
    });
  }

}

module.exports.Sendmail = Sendmail;
