'use strinct';

const logger = require('log4js').getLogger();

logger.level = 'debug';
logger.category = 'Mailbroker';

const { simpleParser } = require('mailparser');
const { ObjectId } = require('mongodb');
const _ = require('lodash');
const assert = require('assert');
const Registry = require('./Registry');
const { Spfquery } = require('./tests/Spfquery');
const Spfcompare = require('./tests/Spfcompare');
const Dkimverify = require('./tests/Dkimverify');
const Dmarccheck = require('./tests/Dmarccheck');
const Blacklist = require('./tests/Blacklist');
const Pyzor = require('./tests/Pyzor');
const Razor = require('./tests/Razor');
// const { CheckdeliverySender } = require('./Checkdelivery/Sender');

/*
check for DNS servers if you got this error:

  err: Error: queryAny ENOTIMP 181.190.140.37.black.junkemailfilter.com
      at QueryReqWrap.onresolve [as oncomplete] (dns.js:203:19) {
    errno: 'ENOTIMP',
    code: 'ENOTIMP',
    syscall: 'queryAny',
    hostname: '181.190.140.37.black.junkemailfilter.com'
  }
*/

class Mailbroker {
  constructor(config) {
    this.config = config;
    this.ObjectId = null;
    this.doc = {
      createdAt: new Date(),
      done: false,
      doneTest: [],
      doneAt: null,
      to: '',
      toUsername: '',
      toDomain: '',
      from: '',
      lastMtaIP: null, // ipv4 / ipv6
      raw: null,
    };
  }

  async makeFromRaw(raw) {
    this.doc.raw = raw;
    await this.parseMail();
  }

  async load(_ObjecId) {
    this.ObjectId = _ObjecId;
    if (!this.ObjectId) throw new Error('No ObjectId specified');

    const collectionMails = Registry.get('mongo').collection('mails');
    this.doc = await collectionMails.findOne({ _id: new ObjectId(this.ObjectId) });
    assert.notEqual(this.doc, null, 'Mail not found');
  }

  async parseMail() {
    // @see https://nodemailer.com/extras/mailparser/
    this.parsed = await simpleParser(this.doc.raw);
    try {
      this.doc.to = this.parsed.to.value[0].address;
    } catch (e) { /* Do nothing */ }
    try {
      this.doc.from = this.parsed.from.value[0].address;
    } catch (e) { /* Do nothing */ }
    try {
      const parts = this.doc.to.match(/^(.*?)@(.*?)$/);
      this.doc.toUsername = parts[1];
      this.doc.toDomain = parts[2];
    } catch (e) { /* Do nothing */ }

    try {
      const Received = _.find(this.parsed.headerLines, (o) => o.key === 'received' && o.line.match(/^Received: from/));
      const m = Received.line.match(/(\[([0-9a-f:]{8,}|[0-9.]{7,})\])/);
      this.doc.lastMtaIP = m[2];
    } catch (e) { /* Do nothing */ }
    try {
      this.doc.subject = this.parsed.subject;
    } catch (e) { /* Do nothing */ }
  }

  getObjectId() {
    return this.ObjectId;
  }

  getFieldTo() {
    return this.doc.to;
  }

  getFieldFrom() {
    return this.doc.from;
  }

  getFieldLastMtaIP() {
    return this.doc.lastMtaIP;
  }

  getResults(name) {
    if (this.config.availableTests.indexOf(name) === -1) return null;
    return this.doc[name];
  }

  getFieldToUsername() {
    return this.doc.toUsername;
  }

  getFieldToDomain() {
    return this.doc.toDomain;
  }

  setObjectId(_ObjectId) {
    this.ObjectId = _ObjectId;
  }

  static generateObjectId() {
    return new ObjectId();
  }

  static validateObjectId(_ObjectId) {
    return _ObjectId instanceof ObjectId;
  }

  static getMailObjectId(to) {
    try {
      const m = to.match(/^([0-9a-f]{24})@/);
      return m[1];
    } catch (e) {
      return null;
    }
  }

  static findHeader(headerLines, header) {
    let ret;
    try {
      ret = _.find(headerLines, (o) => o.key === header);
    } catch (e) { /* Do nothing */ }
    return ret;
  }

  async saveRaw() {
    try {
      Mailbroker.validateObjectId(this.ObjectId);
    } catch (e) {
      throw new Error('No ObjectId specified');
    }
    const collectionMails = Registry.get('mongo').collection('mails');
    this.doc._ObjectId = this.ObjectId;
    return collectionMails.replaceOne(
      {
        _id: this.ObjectId,
      },
      this.doc,
      {
        upsert: true,
      },
    );
  }

  async checkAll(isSaveResults) {
    const tests = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const testName of this.config.availableTests) {
      switch (testName) {
        case 'spamassassin':
          tests.push(this.checkSpamassassin(isSaveResults));
          break;
        case 'spf':
          tests.push(this.checkSpf(isSaveResults));
          break;
        case 'spfcompare':
          tests.push(this.checkSpfcompare(isSaveResults));
          break;
        case 'dkim':
          tests.push(this.checkDkim(isSaveResults));
          break;
        case 'dmarc':
          tests.push(this.checkDmarc(isSaveResults));
          break;
        case 'blacklist':
          tests.push(this.checkBlacklist(isSaveResults));
          break;
        case 'pyzor':
          tests.push(this.checkPyzor(isSaveResults));
          break;
        case 'razor':
          tests.push(this.checkRazor(isSaveResults));
          break;
        // case 'checkdelivery':
        //   break;
        //   // TODO Эта часть работает не стабильно
        //   const checkdeliverySender = new CheckdeliverySender(this.config.checkdeliveryConfig);
        //   tests.push(checkdeliverySender.sendAll(this.ObjectId, this.doc.raw));
        //   break;
        default:
          throw new Error('Test not supported');
      }
    }
    return Promise.allSettled(tests).then(async () => {
      if (isSaveResults) await this.saveDone();
    });
  }

  checkSpamassassin(isSaveResults) {
    const sa = Registry.get('spamassassin');
    return sa.check(this.doc.raw).then(async (report) => {
      this.doc.spamassassin = report;
      if (isSaveResults) await this.saveResults('spamassassin', report);
    });
  }

  checkSpf(isSaveResults) {
    return Spfquery.check(this.doc.lastMtaIP, this.doc.from).then(async (report) => {
      this.doc.spf = report;
      if (isSaveResults) await this.saveResults('spf', report);
    });
  }

  checkSpfcompare(isSaveResults) {
    return Spfcompare.check(this.doc.toDomain).then(async (report) => {
      this.doc.spfcompare = report;
      if (isSaveResults) await this.saveResults('spfcompare', report);
    });
  }

  checkDkim(isSaveResults) {
    return Dkimverify.check(this.doc.raw).then(async (report) => {
      this.doc.dkim = report;
      if (isSaveResults) await this.saveResults('dkim', report);
    });
  }

  checkDmarc(isSaveResults) {
    return Dmarccheck.check(this.doc.from).then(async (report) => {
      this.doc.dmarc = report;
      if (isSaveResults) await this.saveResults('dmarc', report);
    });
  }

  checkBlacklist(isSaveResults) {
    const blacklist = new Blacklist(this.config.dnsServers, this.config.blacklistDomains);
    return blacklist.check(this.doc.lastMtaIP).then(async (report) => {
      this.doc.blacklist = report;
      if (isSaveResults) await this.saveResults('blacklist', report);
    });
  }

  checkPyzor(isSaveResults) {
    return Pyzor.check(this.doc.raw).then(async (report) => {
      this.doc.pyzor = report;
      if (isSaveResults) await this.saveResults('pyzor', report);
    });
  }

  checkRazor(isSaveResults) {
    return Razor.check(this.doc.raw).then(async (report) => {
      this.doc.razor = report;
      if (isSaveResults) await this.saveResults('razor', report);
    });
  }

  async saveResults(section, data) {
    if (!this.ObjectId) throw new Error('No ObjectId specified');
    logger.info('Saving results', { _id: this.ObjectId, section });
    const collectionMails = Registry.get('mongo').collection('mails');
    const update = {};
    update[section] = data;

    return collectionMails.updateOne(
      {
        _id: new ObjectId(this.ObjectId),
      },
      {
        $set: update,
        $push: {
          doneTest: {
            name: section,
            doneAt: new Date(),
          },
        },
      },
      {
        upsert: false,
      },
    );
  }

  async saveDone() {
    if (!this.ObjectId) throw new Error('No ObjectId specified');
    const collectionMails = Registry.get('mongo').collection('mails');
    const update = {
      done: true,
      doneAt: new Date(),
    };
    return collectionMails.updateOne(
      {
        _id: new ObjectId(this.ObjectId),
      },
      {
        $set: update,
      },
      {
        upsert: false,
      },
    );
  }
}

module.exports = Mailbroker;
