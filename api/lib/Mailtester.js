"use strinct";

const
  simpleParser = require('mailparser').simpleParser,
  { ObjectId } = require('mongodb'),
  Registry = new (require('./Registry').Registry)
  ;

class Mailtester {

  constructor() {
    this.ObjectId = null;
    this.to = null;
    this.doc = {
      created: new Date(),
      done: false,
      to: null,
      raw: null
    };
  }

  async makeFromRaw(raw) {
    this.doc.raw = raw;
    await this.parseMail();
  }

  async parseMail() {
    // @see https://nodemailer.com/extras/mailparser/
    let parsed = await simpleParser(this.doc.raw);
    try {
      this.doc.to = parsed.to.value[0].address;
      this.ObjectId = this.getMailObjectId(this.doc.to);
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
    let spamassassin = Registry.get('spamassassin');
    spamassassin.check(this.doc.raw).then(async (data) => {
      let results = spamassassin.parseTests(data);
      await this.saveResults('spamassassin', results);
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
