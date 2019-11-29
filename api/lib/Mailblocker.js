"use strinct";

const
  Registry = new (require('./Registry').Registry),
  { ObjectId } = require('mongodb'),
  assert = require('assert')
  ;

class Mailblocker {

  constructor() {
    this.emails = [];
  }

  async addFromMongo(collectionName, _id, fieldName) {
    let collection = Registry.get('mongo').collection(collectionName);
    let doc = await collection.findOne({_id: ObjectId(_id)});
    assert.notEqual(doc, undefined, "Record not found");
    let mail = doc[fieldName];
    assert.notEqual(mail, undefined, "Mail not found");
    this.emails.push(mail);
  }

  async block(reason) {
    console.log(`Block emails for reason "${reason}": `, this.emails);
    let collection = Registry.get('mongo').collection("mailblocker");

    for(let _email of this.emails) {
      let email = _email.trim().toLowerCase();
      await collection.replaceOne(
        {
          email: email
        },
        { email: email, blocked: true, reason: reason, upd: new Date },
        {
          upsert: true
        }
      );
    }
  }

  async get(email) {
    let collection = Registry.get('mongo').collection("mailblocker");
    return await collection.findOne({email: email.trim().toLowerCase()});
  }

}

module.exports.Mailblocker = Mailblocker;
