"use strict";

require("core-js"); // for Promise.allSettled

const
  assert = require('assert'),
  Registry = new (require('./lib/Registry').Registry),
  config = {
    incomingMailPort: process.env.PORT_API,
    incomingMailMaxSize: process.env.API_INCOMING_MAIL_MAX_SIZE,
    catchAllMtaLetters: process.env.API_CATCH_ALL_MTA === "on",
    catchAllMtaLettersTo: process.env.API_CATCH_ALL_MTA_TO ? process.env.API_CATCH_ALL_MTA_TO.trim().split(",").map(Function.prototype.call, String.prototype.trim) : [],
    maxMailCount: parseInt(process.env.API_MAX_MAIL_COUNT),
    DNSresolver: process.env.IP_DNS_RESOLVER ? process.env.IP_DNS_RESOLVER.trim().split(",").map(Function.prototype.call, String.prototype.trim) : [ "10.1.0.105" ],
    spamassassin: {
      port: process.env.PORT_SPAMASSASSIN,
      maxSize: process.env.SPAMASSASSIN_MAX_MSG_SIZE
    },
    mongo: {
      uri: process.env.MONGO_URI,
      db: process.env.MONGO_DB,
    }
  }
  ;

class Api {
  constructor() {
    return new Promise((appResolve, appReject) => {

      const init = async () => {
        await this.connectMongo();
        await this.initMongo();

        Registry.register('mongo', this.mongo);
        Registry.register('spamassassin', new (require('./lib/Spamassassin').Spamassassin)(config.spamassassin));

        appResolve(this);
        setInterval(this.clearMongo, 3600 * 1000);
        this.clearMongo();
      }

      init().catch(err => {
        console.log(err);
        appReject(err);
      });

    });
  }

  connectMongo() {
    const
      mongodb = require('mongodb'),
      MongoClient = mongodb.MongoClient
      ;

    return new Promise((resolve, reject) => {
      MongoClient.connect(config.mongo.uri, { useNewUrlParser: true }, (err, db) => {
        assert.equal(null, err);
        this.mongo = db.db(config.mongo.db);
        resolve();
      });
    });
  }

  initMongo() {
    return new Promise((resolve, reject) => {
      this.mongo.createCollection("mails").then(() => {
        resolve();
      }).catch(err => {
        reject(err);
      });
    });
  }

  async clearMongo() {
    try {
      let collectionMails = Registry.get('mongo').collection('mails');
      let stats = await collectionMails.stats();
      console.log(`Mails count: ${stats['count']}`);
      let removeBorder = stats['count'] - config.maxMailCount;
      if(removeBorder <= 0) return;
      // `sort({_id: 1})` is not used because sometimes _id order may be random
      let borderDoc = await collectionMails.find().sort({created: 1}).skip(removeBorder).limit(1).next();

      collectionMails.deleteMany({created: { $lt: new Date(borderDoc.created) }});
      console.log(`Removed ${removeBorder} mails`);
    } catch (err) {
      console.log(err);
    }
  }

  run() {
    const
      express = require('express'),
      bodyParser = require('body-parser'),
      api = express(),
      { Mailtester } = require('./lib/Mailtester')
      ;

    api.use(bodyParser.text({limit: config.incomingMailMaxSize, type: 'text/plain'}));

    api.use(function(req, res, next) {
      res.setHeader('Content-Type', 'application/json');
      next();
    });

    api.get('/healthcheck', async (req, res) => {
      res.send(JSON.stringify({result: "ok"}));
    });

    /*
      This endpoint serve web and MTA incoming messages

      API must return
      * 201 Created - all is fine
      * 400 Bad Request - wrong field "To:"
      * 500 Internal Server Error - for server errors

      MTA will be retry delivery via API for 5xx HTTP codes and "Connection refused" (exit code 7)

      POST /checkmail
      POST /checkmail?mode=MTA
        => parse mail header "TO:" for ObjectId (default mode for MTA)
        => if option `config.catchAllMtaLetters` checked, generate ObjectId
        => looks for a special address "TO:" (`config.catchAllMtaLettersTo`), generate ObjectId
        => otherwise reject mail saving (a letter is real spam from spammer)
      POST /checkmail?mode=new
        - generate ObjectId
      POST /checkmail?mode=set&ObjectId=...
        - set ObjectId from URI query string
    */

    api.post('/checkmail', async (req, res, next) => {
      // res.status(400).send('Temp error'); return;        // Error test case
      // res.status(503).send('Server error'); return;      // Error test case
      // res.send(JSON.stringify({result: "ok"})); return;  // Ok short case

      try {
        let mailtester = new Mailtester({ availableDNS: config.DNSresolver });
        await mailtester.makeFromRaw(req.body);

        let mode = req.query.mode ? req.query.mode : 'MTA';
        if(["MTA", "new", "set"].indexOf(mode) === -1) {
          mode = "MTA";
        }

        if(mode === "set") {
          mailtester.setObjectId(req.query.ObjectId);
        }
        if(mode === "new") {
          mailtester.generateObjectId();
        }

        let emailAddress = mailtester.getFieldTo();

        if(mode === "MTA" && mailtester.getObjectId() === null) {
          if(config.catchAllMtaLetters) {
            mailtester.generateObjectId();
            console.log(`mail catched from MTA with config.catchAllMtaLetters option; TO: ${emailAddress}`);
          } else if(config.catchAllMtaLettersTo.length) {
            let name = mailtester.getFieldToName();
            if(config.catchAllMtaLettersTo.indexOf(name) !== -1) {
              mailtester.generateObjectId();
              console.log(`mail catched from MTA with name ${name} and config.catchAllMtaLettersTo option: ${config.catchAllMtaLettersTo}; TO: ${emailAddress}`);
            }
          }
        }

        try {
          // Save mail and report about this
          await mailtester.saveRaw();
          let ret = {result: "ok", ObjecId: mailtester.getObjectId()};
          console.log(`new mail to check: ${ret.ObjecId}`);
          res.send(JSON.stringify(ret));
        } catch (err) {
          // ... or report about wrong ObjectId in To: field
          if(mailtester.getObjectId() === null) {
            console.log(`mail rejected in ${mode} mode; TO: ${emailAddress}`);
            res.status(400).send(JSON.stringify({result: "fail", reason: "Wrong fied \"To:\" - use MongoDB ObjectId as user name"}));
            return;
          } else {
            // ... or report about server fault, and MTA will retry
            throw err;
          }
        }

        try {
          await mailtester.checkAll(true);
        } catch (err) {
          console.log(err);
        }
      } catch (err) {
        console.log(err);
        next(err);
      }
    });

    api.get(/^\/mail\/([0-9a-f]{24})(\/(raw|spamassassin|spf|dkim|dmarc|blacklist|pyzor|razor)?)?$/, async (req, res, next) => {
      try {
        let ObjecId = req.params[0];
        let select = req.params[2];

        let mailtester = new Mailtester({ availableDNS: config.DNSresolver });
        try {
          await mailtester.load(ObjecId);
        } catch (err) {
          res.status(404).send(JSON.stringify({ error: err.message ? err.message : "Not found" }));
          return;
        }
        if(select === "raw") {
          res.setHeader('Content-Type', 'text/plain');
          res.send(mailtester.doc.raw);
          return;
        }
        res.send(JSON.stringify(select ? mailtester.doc[select] : mailtester.doc));

      } catch (err) {
        next(err);
      }
    });

    // 404 error handler
    api.use(function(req, res, next) {
      res.status(404).send(JSON.stringify({ error: "Wrong API URI" }));
    });

    // Final error handler
    api.use(function(err, req, res, next) {
      console.log(err);
      if (req.xhr) {
        res.status(500).send(JSON.stringify({ error: err.message ? err.message : "Internal Server Error" }));
      } else {
        next(err.message ? err.message : err);
      }
    });

    api.listen(config.incomingMailPort);
    console.log(`API is listening port ${config.incomingMailPort}`);
  }
}

var api = new Api();
api.then((api) => {
  api.run();
});
