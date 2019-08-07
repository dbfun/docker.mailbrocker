"use strinct";

const
  simpleParser = require('mailparser').simpleParser,
  { ObjectId } = require('mongodb'),
  Registry = new (require('./Registry').Registry),
  _ = require('lodash'),
  assert = require('assert'),
  { Spfquery } = require('../lib/Spfquery'),
  { Dkimverify } = require('../lib/Dkimverify'),
  { Dmarccheck } = require('../lib/Dmarccheck'),
  { Blacklist } = require('../lib/Blacklist'),
  blacklistDomains = require('../lib/Blacklist/dnsbl-domains')
  ;

class Mailtester {

  constructor() {
    this.availableTests = [ "spamassassin", "spf", "dkim", "dmarc", "blacklist" ];
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
    this.availableDNS = [ "8.8.8.8", "77.88.8.8", "94.142.137.100", "94.142.136.100" ];
    this.ObjectId = null;
    this.doc = {
      created: new Date(),
      done: false,
      to: null,
      from: null,
      lastMtaIP: null,
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
    this.doc = await collectionMails.findOne({_id: ObjectId(this.ObjectId)});
    assert.notEqual(this.doc, null, "Mail not found");
  }

  async parseMail() {
    // @see https://nodemailer.com/extras/mailparser/
    let parsed = await simpleParser(this.doc.raw);
    try {
      this.doc.to = parsed.to.value[0].address;
      this.ObjectId = this.getMailObjectId(this.doc.to);
    } catch (e) { }
    try {
      this.doc.from = parsed.from.value[0].address;
    } catch (e) { }
    try {
      let Received = _.find(parsed.headerLines, (o) => {
        return o.key === "received" && o.line.match(/^Received: from/);
      });
      let m = Received.line.match(/(\[([0-9a-f:]{8,}|[0-9.]{7,})\])/);
      this.doc.lastMtaIP = m[2];
    } catch (e) { }

  }

  getMailObjectId(to) {
    try {
      let m = to.match(/^([0-9a-f]{24})@/);
      return m[1];
    } catch (e) {
      return null;
    }
  }

  async saveRaw() {
    if(!this.ObjectId) throw new Error("No ObjectId specified");
    let collectionMails = Registry.get('mongo').collection('mails');
    return collectionMails.replaceOne(
      {
        _id: ObjectId(this.ObjectId)
      },
      this.doc,
      {
        upsert: true
      }
    );
  }

  async checkAll() {
    let tests = [];

    for(let testName of this.availableTests) {
      switch(testName) {
        case "spamassassin":
          tests.push(this.checkSpamassassin());
          break;
        case "spf":
          tests.push(this.checkSpf());
          break;
        case "dkim":
          tests.push(this.checkDkim());
          break;
        case "dmarc":
          tests.push(this.checkDmarc());
          break;
        case "blacklist":
          tests.push(this.checkBlacklist());
          break;
      }
    }
    return Promise.all(tests);
  }

  checkSpamassassin() {
    let spamassassin = Registry.get('spamassassin');
    return spamassassin.check(this.doc.raw).then(async (spamassassin) => {
      await this.saveResults('spamassassin', spamassassin);
    });
  }

  checkSpf() {
    let spfquery = new Spfquery;
    return spfquery.check(this.doc.lastMtaIP, this.doc.from).then(async (spf) => {
      await this.saveResults('spf', spf);
    });
  }

  checkDkim() {
    let dkimverify = new Dkimverify;
    return dkimverify.check(this.doc.raw).then(async (dkim) => {
      await this.saveResults('dkim', dkim);
    });
  }

  checkDmarc() {
    let dmarccheck = new Dmarccheck;
    return dmarccheck.check(this.doc.from).then(async (dmarc) => {
      await this.saveResults('dmarc', dmarc);
    });
  }

  checkBlacklist() {
    let blacklist = new Blacklist(this.availableDNS, blacklistDomains);
    return blacklist.check(this.doc.lastMtaIP).then(async (bl) => {
      await this.saveResults('blacklist', bl);
    });
  }

  async saveResults(section, data) {
    if(!this.ObjectId) throw new Error("No ObjectId specified");
    let collectionMails = Registry.get('mongo').collection('mails');
    let update = {};
    update[section] = data;

    // console.log(`Results saved: ${this.ObjectId}`);

    return collectionMails.updateOne(
      {
        _id: ObjectId(this.ObjectId)
      },
      { $set: update },
      {
        upsert: false
      }
    );
  }

}

module.exports.Mailtester = Mailtester;
