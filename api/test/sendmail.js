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

  it(`mail FROM ${process.env.EXIM_MAIL_FROM} TO ${process.env.ADMIN_EMAIL}`, async () => {

    let info = await sendmail.mail({
      from: process.env.EXIM_MAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: 'Hello from Node.JS',
      text: 'Node speaks SMTP!'
    });
    assert.ok(/^250 OK id=/.test(info.response));

  });

});
