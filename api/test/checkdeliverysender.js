/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

if(!process.env.EXIM_MAIL_FROM) return;

const
  assert = require('assert'),
  fs = require('fs'),
  { CheckdeliverySender } = require('../lib/Checkdelivery/Sender'),
  config = require('../lib/Checkdelivery/checkdelivery-mails'),
  mailboxes = config.mailboxes.filter((o) => {
    return o.active === true;
  }),
  firstMailbox = mailboxes[0]
  ;

describe('checkdeliverysender', () => {

  let ObjectId = "5d443c9882cd8e56734b18e9";

  let checkdeliverySender = new CheckdeliverySender({
    mailboxes: mailboxes,
    mailFrom: process.env.EXIM_MAIL_FROM
  });

  const rawBody = fs.readFileSync("/test-letters/ham-stepic.org.eml").toString().trim();

  it("send", async () => {
    console.log("check for email:", firstMailbox.email);
    let resp = await checkdeliverySender.send(firstMailbox.email, ObjectId, rawBody);
  });
});
