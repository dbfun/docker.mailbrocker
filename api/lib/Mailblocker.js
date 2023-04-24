const { ObjectId } = require('mongodb');
const assert = require('assert');
const logger = require('log4js').getLogger();
const { Registry } = require('./Registry');

logger.level = 'debug';
logger.category = 'Mailblocker';

class Mailblocker {
  constructor() {
    this.emails = [];
  }

  async addFromMongo(collectionName, _id, fieldName) {
    assert.ok(typeof collectionName === 'string', 'Collection not found');
    const collection = Registry.get('mongo').collection(collectionName);
    const doc = await collection.findOne({ _id: ObjectId(_id) });
    assert.notEqual(doc, undefined, 'Record not found');
    const mail = doc[fieldName];
    assert.notEqual(mail, undefined, 'Mail not found');
    this.emails.push(mail);
  }

  async block(reason) {
    logger.info(`Block emails for reason "${reason}": `, this.emails);
    const collection = Registry.get('mongo').collection('mailblocker');

    // eslint-disable-next-line no-restricted-syntax,no-underscore-dangle
    for (const _email of this.emails) {
      const email = _email.trim().toLowerCase();
      // eslint-disable-next-line no-await-in-loop
      await collection.replaceOne(
        {
          email,
        },
        {
          email, blocked: true, reason, upd: new Date(),
        },
        {
          upsert: true,
        },
      );
    }
  }

  static async get(email) {
    if (typeof email !== 'string') return null;
    const collection = Registry.get('mongo').collection('mailblocker');
    return collection.findOne({ email: email.trim().toLowerCase() });
  }
}

module.exports.Mailblocker = Mailblocker;
