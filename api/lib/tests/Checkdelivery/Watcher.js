/**
 * Not working! WIP.
 */

const assert = require('assert');
const _ = require('lodash');
const imaps = require('imap-simple');
const EventEmitter = require('events');

const maxDelayMs = 1 * 3600 * 1000;

// TODO Этот модуль используется для проверки доставки почты в ящики разных систем и в данных момент работает не стабильно.
// assert.ok(process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0" || process.env.NODE_EXTRA_CA_CERTS !== "", "Specify NodeJS env variables: `NODE_TLS_REJECT_UNAUTHORIZED` or `NODE_EXTRA_CA_CERTS`");

class CheckdeliveryWatcher {
  static watchAll(mailboxes) {
    return new Promise(async (resolve, reject) => {
      if (!mailboxes.length) {
        reject('No active mails');
        return;
      }
      const generalEmitter = new EventEmitter();
      const checkdeliveryListByEmail = {};

      for (const mailbox of mailboxes) {
        const checkdelivery = new CheckdeliveryWatcher(mailbox);
        const { emitter } = checkdelivery;

        await checkdelivery.connect();
        checkdelivery.startWatch();
        checkdeliveryListByEmail[mailbox.email] = checkdelivery;
        emitter.on('result', (checkedLetters) => {
          const data = {
            mailbox: mailbox.info,
            checkedLetters,
          };
          generalEmitter.emit('result', data);
        });
      }

      generalEmitter.on('stopWatch', () => {
        for (const email in checkdeliveryListByEmail) {
          const checkdelivery = checkdeliveryListByEmail[email];
          checkdelivery.stopWatch();
          checkdelivery.disconnect();
        }
      });

      generalEmitter.on('markSeen', (data) => {
        const checkdelivery = checkdeliveryListByEmail[data.email];
        checkdelivery.emitter.emit('markSeen', data.uidByBox);
      });

      resolve(generalEmitter);
    });
  }

  constructor(mailbox) {
    this.mailbox = mailbox;
    this.connection = null;
    this.emitter = new EventEmitter();
    this.loopCnt = 0;
    this.isWatching = false;
    this.test = {
      result: null,
      report: {
        spam: null,
        ham: null,
      },
    };
    this.markSeenByBox = {};
    this.emitter.on('markSeen', (uidByBox) => {
      for (const box in uidByBox) {
        this.markSeenByBox[box] = _.union(uidByBox[box], this.markSeenByBox[box]);
      }
    });
  }

  async connect() {
    const connection = await imaps.connect({ imap: this.mailbox.imap });
    if (connection.imap.state !== 'authenticated') {
      await connection.end();
      throw Error('Connection not authenticated');
    }
    this.connection = connection;
    return connection;
  }

  async disconnect() {
    if (this.connection) {
      console.log(`disconnect: ${this.mailbox.info.name}`);
      await this.connection.end();
    }
  }

  startWatch() {
    this.isWatching = true;
    this.watch();
  }

  stopWatch() {
    this.isWatching = false;
  }

  async watch() {
    if (!this.isWatching) return;
    this.loopCnt++;
    // console.log(`watch... ${this.loopCnt}`);
    await this.processLast();
    await this.markSeen();
    await this.sleep(1000);
    this.watch();
  }

  async processLast() {
    this.checkedLetters = {
      checked: {
        email: this.mailbox.email,
        uidByBox: {},
      },
      byObjectId: {},
    };
    let sinceDate = new Date();
    sinceDate.setTime(Date.now() - maxDelayMs);
    sinceDate = sinceDate.toISOString();
    await this.getMails(sinceDate);
    this.processResults();
  }

  async getMails(sinceDate) {
    for (const boxName in this.mailbox.box) {
      const boxType = this.mailbox.box[boxName];

      try {
        await this.ckeckBox(boxName, boxType, sinceDate);
      } catch (e) {
        if (/(SELECT No such folder|Unknown Mailbox)/.test(e.message)) {
          try {
            const boxes = await this.connection.getBoxes();
            console.log(`${e.message}\nError box: "${boxName}"\nNotice: available boxes: ${Object.keys(boxes)}`);
          } catch (e) { }
        } else {
          console.log(`${e.message}\nError box: "${boxName}"`);
        }
      }
    }
  }

  async ckeckBox(boxName, boxType, sinceDate) {
    await this.connection.openBox(boxName);

    const results = await this.connection.search(
      [
        'UNSEEN', ['SINCE', sinceDate],
      ],
      { bodies: ['HEADER'], markSeen: false },
    );

    this.checkedLetters.checked.uidByBox[boxName] = [];

    results.forEach((o) => {
      try {
        // console.log(this.mailbox.email, o);
        const headers = o.parts.filter((o) => o.which === 'HEADER');
        const _id = headers[0].body['x-mailbroker'];
        if (!_id) return;
        if (!this.checkedLetters.byObjectId.hasOwnProperty(_id)) {
          this.checkedLetters.byObjectId[_id] = {
            ham: 0,
            spam: 0,
          };
        }
        this.checkedLetters.byObjectId[_id][boxType]++;
        this.checkedLetters.checked.uidByBox[boxName].push(o.attributes.uid);
      } catch (e) { }
    });
  }

  processResults() {
    if (_.isEmpty(this.checkedLetters.byObjectId)) return;
    for (const _id in this.checkedLetters.byObjectId) {
      const report = this.checkedLetters.byObjectId[_id];

      switch (true) {
        case report.spam >= 1 && report.ham === 0:
          report.result = 'spam';
          break;
        case report.ham >= 1 && report.spam === 0:
          report.result = 'ham';
          break;
        case report.spam >= 1 && report.ham >= 1:
          report.result = 'few mails';
          break;
        default:
          report.result = 'unknown';
      }
    }
    this.emitter.emit('result', this.checkedLetters);
  }

  async markSeen() {
    for (const boxName in this.markSeenByBox) {
      // this.markSeenByBox may change due to API request /checkdelivery
      const uidList = _.clone(this.markSeenByBox[boxName]);
      if (!uidList.length) continue;
      console.log('markSeen', this.mailbox.email, boxName, uidList);
      await this.connection.openBox(boxName);
      await this.connection.addFlags(uidList, 'SEEN');
      this.markSeenByBox[boxName] = _.difference(this.markSeenByBox[boxName], uidList);
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports.CheckdeliveryWatcher = CheckdeliveryWatcher;
