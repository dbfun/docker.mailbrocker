/**
 * Not working! WIP.
 */

const assert = require('assert');
const mongodb = require('mongodb');
const { CheckdeliveryWatcher } = require('./lib/Checkdelivery/Watcher');

const mongoConfig = {
  uri: 'mongodb://mongo:27017/mailbroker',
  db: 'mailbroker',
};
const mailboxes = require('./lib/Checkdelivery/checkdelivery-mails').mailboxes.filter((o) => o.active === true);

assert.ok(mailboxes.length > 0, 'No mailboxes for check');

class ProcessCheckdelivery {
  constructor() {
    return new Promise((resolve, reject) => {
      const init = async () => {
        await this.connectMongo();
        resolve(this);
      };
      init().catch((err) => {
        console.log(err);
        reject(err);
      });
    });
  }

  connectMongo() {
    return new Promise((resolve, reject) => {
      mongodb.MongoClient.connect(mongoConfig.uri, {
        useNewUrlParser: true,
        keepAlive: true,
        connectTimeoutMS: 5000,
      }, (err, db) => {
        assert.equal(null, err);
        this.mongo = db.db(mongoConfig.db);
        resolve();
      });
    });
  }

  async run() {
    this.emitter = await CheckdeliveryWatcher.watchAll(mailboxes);
    const cnt = 0;
    this.emitter.on('result', this.result.bind(this));
  }

  result(data) {
    // console.log(JSON.stringify(data));
    this.updateCheckdelivery(data);
    this.emitter.emit('markSeen', data.checkedLetters.checked);
  }

  updateCheckdelivery(data) {
    try {
      const collectionMails = this.mongo.collection('mails');

      for (const _ObjecId in data.checkedLetters.byObjectId) {
        const report = data.checkedLetters.byObjectId[_ObjecId];
        const set = {
          checkdelivery: {},
        };
        set.checkdelivery[data.mailbox.type] = report;

        console.log(_ObjecId, set);

        collectionMails.updateOne(
          {
            _id: mongodb.ObjectId(_ObjecId),
          },
          {
            $addToSet: set,
          },
          {
            upsert: false,
          },
        );
      }
    } catch (e) {
      console.log(e);
    }
  }
}

const processCheckdelivery = new ProcessCheckdelivery();
processCheckdelivery.then((processCheckdelivery) => {
  processCheckdelivery.run();
});
