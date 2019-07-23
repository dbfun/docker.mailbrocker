"use strinct";

var spamassassin;

class Mailtester {

  constructor(msg, collectionMails) {
    this.msg = msg;
    this.collectionMails = collectionMails;
  }

  async saveRaw() {
    return this.collectionMails.insertOne({done: false, raw: this.msg});
  }

  async checkAll() {
    let data = await spamassassin.check(this.msg);
    console.log(data);
    let saTests = spamassassin.parseTests(data);
  }

  async saveResults() {

  }

}

module.exports = function(config) {
  const { Spamassassin } = require('./Spamassassin');
  spamassassin = new Spamassassin(config.spamassassin);
  return Mailtester;
};
