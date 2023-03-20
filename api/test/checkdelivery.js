"use strict";

if(!process.env.EXIM_MAIL_FROM) return;

/*
TODO Этот модуль используется для проверки доставки почты в ящики разных систем и в данных момент работает не стабильно.

mocha test/checkdelivery.js -g "checkdelivery watcher"

To break imap run:
  sudo tcpkill -i ens3 -9 port 993
*/

const
  assert = require("assert"),
  { CheckdeliveryWatcher } = require("../lib/Checkdelivery/Watcher.js"),
  config = require('../lib/Checkdelivery/checkdelivery-mails'),
  mailboxes = config.mailboxes.filter((o) => {
    return o.active === true;
  }),
  firstMailbox = mailboxes[0]
  ;

assert.ok(typeof firstMailbox !== "undefined");

describe("checkdelivery", function() {
  this.timeout(15000);

  let checkdelivery;

  afterEach(async () => {
    checkdelivery.stopWatch();
    await checkdelivery.disconnect();
  });

  it("check imap", async () => {
    checkdelivery = new CheckdeliveryWatcher(firstMailbox);
    let connection, results;

    let delay = 24 * 3600 * 1000 * 30;
    let since = new Date();
    since.setTime(Date.now() - delay);
    since = since.toISOString();

    await assert.doesNotReject(async() => {
      connection = await checkdelivery.connect();
      await connection.openBox('INBOX');
      results = await connection.search([ ['SINCE', since] ], { bodies: ['HEADER'], markSeen: false });
    });

    assert.ok(results.length > 0, `You have no mails since ${since}`);
  });

  it("check spam one", async () => {
    let ObjectId = "5d443c9882cd8e56734b18e9";
    checkdelivery = new CheckdeliveryWatcher(firstMailbox);
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
      assert.ok(false, `Results not obtained. Note: do you have mails with "X-mailbroker" header? No? Then run this:
      swaks --to ${firstMailbox.email} --from junk@gmail.com --add-header "Subject: Test _id: ${ObjectId}" --add-header "X-Mailbroker: ${ObjectId}"
      OR
      make swaks-checkdelivery
      `);
    });
  });

});

describe("checkdelivery watcher", function() {
  this.timeout(15000);

  let emitter;

  after(async () => {
    emitter.emit("stopWatch");
  });

  it("check spam all", async () => {
    emitter = await CheckdeliveryWatcher.watchAll(mailboxes);
    await new Promise((resolve, reject) => {

      let cnt = 0;
      let timer = setTimeout(reject, 5000);
      emitter.on("result", (data) => {
        console.log(data);
        cnt++;
        if(cnt >= 1) {
          clearTimeout(timer);
          resolve(data);
        }
      });

    }).then(() => {
      assert.ok(true);
    }).catch(e => {
      assert.ok(false, `Results not obtained`);
    });
  });

});
