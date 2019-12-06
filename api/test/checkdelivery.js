"use strict";

const
  assert = require("assert")
  ;

describe('checkdelivery', function() {

  this.timeout(15000);

  const
    { Checkdelivery } = require('../lib/Checkdelivery'),
    config = require('../lib/Checkdelivery/checkdelivery-mails')
    ;

  let mailboxes = config.mailboxes.filter((o) => {
    return o.active === true;
  });

  let mailbox = mailboxes[0];

  it("check imap", async () => {
    let checkdelivery = new Checkdelivery(mailbox);
    let connection, results;

    await assert.doesNotReject(async() => {
      connection = await checkdelivery.connect();

      await connection.openBox('INBOX');

      let delay = 24 * 3600 * 1000;
      let yesterday = new Date();
      yesterday.setTime(Date.now() - delay);
      yesterday = yesterday.toISOString();

      results = await connection.search([ ['SINCE', yesterday] ], { bodies: ['HEADER'], markSeen: false });
    });

    assert.ok(results.length > 0, "You have no mails since yesterday");

    await checkdelivery.disconnect();
  });

  it("check spam", async () => {
    let ObjectId = "5d443c9882cd8e56734b18e9";
    let checkdelivery = new Checkdelivery(mailbox);
    let emitter = checkdelivery.emitter;

    await checkdelivery.connect();
    checkdelivery.startWatch();

    await new Promise((resolve, reject) => {
      let timer = setTimeout(reject, 5000);
      emitter.on("result", (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    }).then((data) => {
      console.log(data);
      assert.ok(true);
    }).catch(e => {
      assert.ok(false, `Results not obtained. Note: do you have mails with "X-mailtester" header? No? Then run this:
      swaks --to ${mailbox.imap.user} --from junk@gmail.com --add-header "Subject: Test _id: ${ObjectId}" --add-header "X-Mailtester: ${ObjectId}"`);
    });

    checkdelivery.stopWatch();
    await checkdelivery.disconnect();
  });

  it("check spam all", async () => {
    let emitter = await Checkdelivery.watchAll(config.mailboxes);
    await new Promise((resolve, reject) => {

      let cnt = 0;
      let timer = setTimeout(reject, 5000);
      emitter.on("result", (data) => {
        console.log(data);
        cnt++;
        if(cnt >= 5) {
          clearTimeout(timer);
          resolve(data);
        }
      });

    }).then(() => {
      assert.ok(true);
    }).catch(e => {
      assert.ok(false, `Results not obtained`);
    });

    emitter.emit("stopWatch");
  });

});


/*

swaks --to mailtester.spam24.ru@mail.ru --from junk@gmail.com --add-header "Subject: Test _id: 5d443c9882cd8e56734b18e9" --add-header "X-Mailtester: 5d443c9882cd8e56734b18e9"

<** 550 spam message rejected. Please visit http://help.mail.ru/notspam-support/id?c=37o1uvXUfWYxWJiJJ-wYxPhLrs9SgNsqDKLqJ1_v5c0HAAAAG8gAAGfRbRs~ or  report details to
abuse@corp.mail.ru. Error code: BA35BADF667DD4F589985831C418EC27CFAE4BF82ADB805227EAA20CCDE5EF5F. ID: 000000070000C81B1B6DD167.
 -> QUIT

*/
