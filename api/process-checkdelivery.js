"use strict";

const
  assert = require("assert"),
  { CheckdeliveryWatcher } = require("./lib/Checkdelivery/Watcher.js"),
  mongodb = require('mongodb'),
  mongoConfig = {
    uri: process.env.MONGO_URI,
    db: process.env.MONGO_DB,
  },
  mailboxes = require("./lib/Checkdelivery/checkdelivery-mails").mailboxes.filter((o) => {
    return o.active === true;
  })
  ;

assert.ok(mailboxes.length > 0, "No mailboxes for check");

class ProcessCheckdelivery {

  constructor() {
    return new Promise((resolve, reject) => {
      const init = async () => {
        await this.connectMongo();
        resolve(this);
      }
      init().catch(err => {
        console.log(err);
        reject(err);
      });
    });
  }

  connectMongo() {
    return new Promise((resolve, reject) => {
      mongodb.MongoClient.connect(mongoConfig.uri, {
          useNewUrlParser: true,
          keepAlive: 1,
          connectTimeoutMS: 5000
        }, (err, db) => {
        assert.equal(null, err);
        this.mongo = db.db(mongoConfig.db);
        resolve();
      });
    });
  }

  async run() {
    this.emitter = await CheckdeliveryWatcher.watchAll(mailboxes);
    let cnt = 0;
    this.emitter.on("result", this.result.bind(this));
  }

  result(data) {
    // console.log(JSON.stringify(data));
    this.updateCheckdelivery(data);
    this.emitter.emit("markSeen", data.checkedLetters.checked);
  }

  updateCheckdelivery(data) {
    try {
      let collectionMails = this.mongo.collection('mails');

      for(let _ObjecId in data.checkedLetters.byObjectId) {
        let report = data.checkedLetters.byObjectId[_ObjecId];
        let set = {
          checkdelivery: {}
        };
        set.checkdelivery[data.mailbox.type] = report;

        console.log(_ObjecId, set);

        collectionMails.updateOne(
          {
            _id: mongodb.ObjectId(_ObjecId)
          },
          {
            $addToSet: set
          },
          {
            upsert: false
          }
        );
      }
    } catch (e) {
      console.log(e);
    }
  }

}

let processCheckdelivery = new ProcessCheckdelivery();
processCheckdelivery.then((processCheckdelivery) => {
  processCheckdelivery.run();
});
