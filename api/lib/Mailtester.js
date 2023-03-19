"use strinct";

const
  simpleParser = require('mailparser').simpleParser,
  { ObjectId } = require('mongodb'),
  Registry = new (require('./Registry').Registry),
  _ = require('lodash'),
  assert = require('assert'),
  { Spfquery } = require('../lib/Spfquery'),
  { Spfcompare } = require('../lib/Spfcompare'),
  { Dkimverify } = require('../lib/Dkimverify'),
  { Dmarccheck } = require('../lib/Dmarccheck'),
  { Blacklist } = require('../lib/Blacklist'),
  { Pyzor } = require('../lib/Pyzor'),
  { Razor } = require('../lib/Razor'),
  { CheckdeliverySender } = require("../lib/Checkdelivery/Sender"),
  defaultConfig = {
    availableTests: [ "spamassassin", "spf", "spfcompare", "dkim", "dmarc", "blacklist", "pyzor", "razor", "checkdelivery" ],
    availableDNS: [ "8.8.8.8", "77.88.8.8", "94.142.137.100", "94.142.136.100" ],
    blacklistDomains: require("../lib/Blacklist/dnsbl-domains"),
    checkdeliveryConfig: {
      mailFrom: "noreply@site.com",
      mailboxes: []
    }
  }
  ;

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

class Mailtester {

  constructor(config) {
    this.config = {...defaultConfig, ...config};
    this.ObjectId = null;
    this.doc = {
      createdAt: new Date(),
      done: false,
      doneTest: [],
      doneAt: null,
      to: "",
      toUsername: "",
      toDomain: "",
      from: "",
      lastMtaIP: null, // ipv4 / ipv6
      raw: null
    };
  }

  async makeFromRaw(raw) {
    this.doc.raw = raw;
    await this.parseMail();
  }

  async load(_ObjecId) {
    this.ObjectId = _ObjecId;
    if(!this.ObjectId) throw new Error("No ObjectId specified");

    let collectionMails = Registry.get('mongo').collection('mails');
    this.doc = await collectionMails.findOne({_id: new ObjectId(this.ObjectId)});
    assert.notEqual(this.doc, null, "Mail not found");
  }

  async parseMail() {
    // @see https://nodemailer.com/extras/mailparser/
    this.parsed = await simpleParser(this.doc.raw);
    try {
      this.doc.to = this.parsed.to.value[0].address;
    } catch (e) { }
    try {
      this.doc.from = this.parsed.from.value[0].address;
    } catch (e) { }
    try {
      let parts = this.doc.to.match(/^(.*?)@(.*?)$/);
      this.doc.toUsername = parts[1];
      this.doc.toDomain = parts[2];
    } catch (e) { }

    try {
      let Received = _.find(this.parsed.headerLines, (o) => {
        return o.key === "received" && o.line.match(/^Received: from/);
      });
      let m = Received.line.match(/(\[([0-9a-f:]{8,}|[0-9.]{7,})\])/);
      this.doc.lastMtaIP = m[2];
    } catch (e) { }
    try {
      this.doc.subject = this.parsed.subject;
    } catch (e) { }
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
    if(this.config.availableTests.indexOf(name) === -1) return null;
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

  generateObjectId() {
    return new ObjectId;
  }

  validateObjectId(_ObjectId) {
    return _ObjectId instanceof ObjectId;
  }

  getMailObjectId(to) {
    try {
      let m = to.match(/^([0-9a-f]{24})@/);
      return m[1];
    } catch (e) {
      return null;
    }
  }

  findHeader(headerLines, header) {
    let ret;
    try {
      ret = _.find(headerLines, (o) => {
        return o.key === header;
      });
    } catch (e) { }
    return ret;
  }

  async saveRaw() {
    try {
      this.validateObjectId(this.ObjectId);
    } catch (e) {
      throw new Error("No ObjectId specified");
    }
    let collectionMails = Registry.get('mongo').collection('mails');
    this.doc._ObjectId = this.ObjectId;
    return collectionMails.replaceOne(
      {
        _id: this.ObjectId
      },
      this.doc,
      {
        upsert: true
      }
    );
  }

  async checkAll(isSaveResults) {
    let tests = [];

    for(let testName of this.config.availableTests) {
      switch(testName) {
        case "spamassassin":
          tests.push(this.checkSpamassassin(isSaveResults));
          break;
        case "spf":
          tests.push(this.checkSpf(isSaveResults));
          break;
        case "spfcompare":
          tests.push(this.checkSpfcompare(isSaveResults));
          break;
        case "dkim":
          tests.push(this.checkDkim(isSaveResults));
          break;
        case "dmarc":
          tests.push(this.checkDmarc(isSaveResults));
          break;
        case "blacklist":
          tests.push(this.checkBlacklist(isSaveResults));
          break;
        case "pyzor":
          tests.push(this.checkPyzor(isSaveResults));
          break;
        case "razor":
          tests.push(this.checkRazor(isSaveResults));
          break;
        case "checkdelivery":
          break;
          // TODO Эта часть работает не стабильно
          let checkdeliverySender = new CheckdeliverySender(this.config.checkdeliveryConfig);
          tests.push(checkdeliverySender.sendAll(this.ObjectId, this.doc.raw));
          break;
      }
    }
    return Promise.allSettled(tests).then(async () => {
      if(isSaveResults) await this.saveDone();
    });
  }

  checkSpamassassin(isSaveResults) {
    let spamassassin = Registry.get('spamassassin');
    return spamassassin.check(this.doc.raw).then(async (spamassassin) => {
      this.doc.spamassassin = spamassassin;
      if(isSaveResults) await this.saveResults('spamassassin', spamassassin);
    });
  }

  checkSpf(isSaveResults) {
    let spfquery = new Spfquery;
    return spfquery.check(this.doc.lastMtaIP, this.doc.from).then(async (spf) => {
      this.doc.spf = spf;
      if(isSaveResults) await this.saveResults('spf', spf);
    });
  }

  checkSpfcompare(isSaveResults) {
    let spfcompare = new Spfcompare;
    return spfcompare.check(this.doc.toDomain).then(async (spfcompare) => {
      this.doc.spfcompare = spfcompare;
      if(isSaveResults) await this.saveResults('spfcompare', spfcompare);
    });
  }

  checkDkim(isSaveResults) {
    let dkimverify = new Dkimverify;
    return dkimverify.check(this.doc.raw).then(async (dkim) => {
      this.doc.dkim = dkim;
      if(isSaveResults) await this.saveResults('dkim', dkim);
    });
  }

  checkDmarc(isSaveResults) {
    let dmarccheck = new Dmarccheck;
    return dmarccheck.check(this.doc.from).then(async (dmarc) => {
      this.doc.dmarc = dmarc;
      if(isSaveResults) await this.saveResults('dmarc', dmarc);
    });
  }

  checkBlacklist(isSaveResults) {
    let blacklist = new Blacklist(this.config.availableDNS, this.config.blacklistDomains);
    return blacklist.check(this.doc.lastMtaIP).then(async (bl) => {
      this.doc.blacklist = bl;
      if(isSaveResults) await this.saveResults('blacklist', bl);
    });
  }

  checkPyzor(isSaveResults) {
    let pyzor = new Pyzor;
    return pyzor.check(this.doc.raw).then(async (pz) => {
      this.doc.pyzor = pz;
      if(isSaveResults) await this.saveResults('pyzor', pz);
    });
  }

  checkRazor(isSaveResults) {
    let razor = new Razor;
    return razor.check(this.doc.raw).then(async (rz) => {
      this.doc.razor = rz;
      if(isSaveResults) await this.saveResults('razor', rz);
    });
  }

  async saveResults(section, data) {
    console.log(`Saving results for ${section}`);
    if(!this.ObjectId) throw new Error("No ObjectId specified");
    let collectionMails = Registry.get('mongo').collection('mails');
    let update = {};
    update[section] = data;

    // console.log(`Results saved: ${this.ObjectId}`);

    return collectionMails.updateOne(
      {
        _id: new ObjectId(this.ObjectId)
      },
      {
        $set: update,
        $push: {
          doneTest: {
            name: section,
            doneAt: new Date()
          }
        }
      },
      {
        upsert: false
      }
    );
  }

  async saveDone() {
    if(!this.ObjectId) throw new Error("No ObjectId specified");
    let collectionMails = Registry.get('mongo').collection('mails');
    let update = {
      done: true,
      doneAt: new Date()
    };
    return collectionMails.updateOne(
      {
        _id: new ObjectId(this.ObjectId)
      },
      {
        $set: update
      },
      {
        upsert: false
      }
    );
  }

}

module.exports.Mailtester = Mailtester;
