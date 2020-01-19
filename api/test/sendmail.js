/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

const
  assert = require('assert')
  ;

describe('sendmail', function() {
  this.timeout(15000);

  const
    { Sendmail } = require('../lib/Sendmail');

  const sendmail = new Sendmail;
  const mailTo = process.env.ADMIN_EMAIL;

  it(`mail FROM ${process.env.EXIM_MAIL_FROM} TO ${mailTo}`, async () => {

    let info = await sendmail.mail({
      from: process.env.EXIM_MAIL_FROM,
      to: mailTo,
      subject: 'Hello from Node.JS',
      text: 'Node speaks SMTP!'
    });
    assert.ok(/^250 OK id=/.test(info.response));

  });

});
