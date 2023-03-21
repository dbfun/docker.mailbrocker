"use strict";

const dotenv = require('dotenv');
dotenv.config({path: "/etc/api/secrets.env"});

const
  assert = require("assert"),
  { App } = require("./lib/App"),
  Registry = new (require("./lib/Registry").Registry),
  security = new(require("./lib/Security").Security)(process.env.SECURITY_SALT),
  config = {
    apiPort: 80,
    incomingMailMaxSize: process.env.API_INCOMING_MAIL_MAX_SIZE,
    catchMtaLettersTo: process.env.API_CATCH_MTA_TO ? process.env.API_CATCH_MTA_TO.trim().split(",").map(Function.prototype.call, String.prototype.trim) : [],
    mailFrom: process.env.EXIM_MAIL_FROM,
    maxMailCount: parseInt(process.env.API_MAX_MAIL_COUNT),
    mongo: {
      uri: 'mongodb://mongo:27017/mailbroker',
      db: 'mailbroker',
    },
    rabbitMQuri: `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@rabbitmq/${process.env.RABBITMQ_DEFAULT_VHOST}?heartbeat=60`
  }
  ;

class Api extends App {
  constructor(config) {
    super(config);
    return new Promise(async (appResolve, appReject) => {

      try {
        await this.connectMongo();
        await this.initMongo();

        await this.connectRabbitMQ();
        Registry.register("mongo", this.mongo);

        appResolve(this);
        setInterval(this.clearMongo.bind(this), 3600 * 1000);
        this.clearMongo();
      } catch (err) {
        appReject(err);
      }

    });
  }

  async initMongo() {
    console.log('Init mongo...');

    let collections = await this.mongo.listCollections({}, {nameOnly: true}).toArray();

    if(!collections.find(o => o.name === "mails")) {
      await this.mongo.createCollection("mails");
      console.log('Collection "mails" created');
    }

    if(!collections.find(o => o.name === "mailblocker")) {
      await this.mongo.collection("mailblocker").createIndex( { "email": 1 }, { unique: true } );
      console.log('Collection "mailblocker" created');
    }
  }

  async clearMongo() {
    try {
      let collectionMails = Registry.get("mongo").collection("mails");
      let stats = await collectionMails.stats();
      console.log(`API: mails count: ${stats["count"]}`);
      let removeBorder = stats["count"] - this.config.maxMailCount;
      if(removeBorder <= 0) return;
      // `sort({_id: 1})` is not used because sometimes _id order may be random
      let borderDoc = await collectionMails.find().sort({created: 1}).skip(removeBorder).limit(1).next();

      collectionMails.deleteMany({created: { $lt: new Date(borderDoc.created) }});
      console.log(`API: removed ${removeBorder} mails`);
    } catch (err) {
      console.log("API:", err);
    }
  }

  async addMailToQueue(params) {
    let exchange = "";
    let routingKey = "checkAll";
    let content = Buffer.from(JSON.stringify(params));
    return new Promise((resolve, reject) => {
      this.amqpChannel.publish(exchange, routingKey, content, { persistent: true },
        (err, ok) => {
          if (err) {
            console.error("[AMQP] publish", err);
            this.amqpChannel.connection.close();
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  run() {
    const
      express = require("express"),
      bodyParser = require("body-parser"),
      api = express(),
      { Mailbroker } = require("./lib/Mailbroker"),
      { Mailblocker } = require("./lib/Mailblocker")
      ;

    api.use(bodyParser.json({limit: this.config.incomingMailMaxSize, type: "application/json"}));
    api.use(bodyParser.text({limit: this.config.incomingMailMaxSize, type: () => { return true; }}));

    api.use((req, res, next) => {
      res.setHeader("Content-Type", "application/json");
      next();
    });

    api.get("/healthcheck", async (req, res) => {
      res.send(JSON.stringify({result: "ok"}));
    });

    /*
      This endpoint serves Mailer-Daemon reports (messages from Exim Mailer Daemon such as "Dead letter mail")
    */
    api.post("/mailerdaemon", async (req, res, next) => {
      try {
        let mailbroker = new Mailbroker({});
        await mailbroker.makeFromRaw(req.body);

        let failedRecipients;
        try {
          failedRecipients = mailbroker.findHeader(mailbroker.parsed.headerLines, "x-failed-recipients").line;
        } catch (e) { }

        let msg = `API: Exim Mailer-Daemon report. Subj: ${mailbroker.doc.subject}`;
        if(failedRecipients) {
          msg += `. Headers: ${failedRecipients}`;
        }
        console.log(msg);
        res.status(403).send(JSON.stringify({result: "fail", reason: msg}));
      } catch (err) {
        // 5xx errors
        console.log("API:", err);
        next(err);
      }
    });

    /*
      This endpoint serves incoming API and MTA messages

      API must return
      * 201 Created - all is fine
      * 403 Forbidden - wrong field "To:"
      * 500 Internal Server Error - for server errors

      MTA will be retry delivery via API for 5xx HTTP codes and "Connection refused" (exit code 7)

      POST /checkmail
      POST /checkmail?mode=MTA
        => parse mail header "TO:" for ObjectId (default mode for MTA)
        => looks for a special address "TO:" (`this.config.catchMtaLettersTo`), generate ObjectId
        => otherwise reject mail saving (a letter is real spam from spammer)
      POST /checkmail?mode=new
        - generate ObjectId
      POST /checkmail?mode=set&ObjectId=...
        - set ObjectId from URI query string
    */

    api.post("/checkmail", async (req, res, next) => {
      // res.status(403).send("Temp error"); return;        // Error test case
      // res.status(503).send("Server error"); return;      // Error test case
      // res.send(JSON.stringify({result: "ok"})); return;  // Ok short case

      try {
        let mailbroker = new Mailbroker({});
        await mailbroker.makeFromRaw(req.body);

        let mailFrom = mailbroker.getFieldFrom();

        let mailblocker = new Mailblocker;
        let doc = await mailblocker.get(mailFrom);
        if(doc) {
          let msg = `API: mail rejected from ${doc.email}, reason: ${doc.reason}`;
          console.log(msg);
          res.status(403).send(JSON.stringify({result: "fail", reason: doc.reason, mailFrom: mailFrom, description: msg}));
          return;
        }

        let mode = req.query.mode ? req.query.mode : "MTA";
        let mailTo = mailbroker.getFieldTo();
        let mailToUsername = mailbroker.getFieldToUsername();
        let ObjectId = null;

        if(["MTA", "new", "set"].indexOf(mode) === -1) {
          mode = "MTA";
        }

        switch(mode) {
          case "set":
            ObjectId = req.query.ObjectId;
            break;
          case "new":
            ObjectId = mailbroker.generateObjectId();
            break;
          case "MTA":
            if(this.config.mailFrom.toLowerCase() === mailTo.toLowerCase()) {
              let msg = `API: mail rejected in MTA mode: anti loop condition. FROM: "${this.config.mailFrom}" TO: "${mailTo}"`;
              console.log(msg);
              res.status(403).send(JSON.stringify({result: "fail", reason: msg}));
              return;
            }

            ObjectId = mailbroker.getMailObjectId(mailbroker.getFieldTo());
            if(ObjectId === null) {
              if(this.config.catchMtaLettersTo.indexOf(mailToUsername) !== -1) {
                ObjectId = mailbroker.generateObjectId();
                console.log(`API: mail catched from MTA with username ${mailToUsername} and this.config.catchMtaLettersTo option: ${this.config.catchMtaLettersTo}; TO: "${mailTo}"`);
              } else {
                let msg = `API: mail rejected in MTA mode: wrong fied TO: "${mailTo}". Use MongoDB ObjectId as user name`;
                console.log(msg);
                res.status(403).send(JSON.stringify({result: "fail", reason: msg}));
                return;
              }
            }
            break;
        }

        try {
          mailbroker.validateObjectId(ObjectId);
        } catch (e) {
          res.status(403).send(JSON.stringify({result: "fail", reason: "Wrong ObjectId"}));
          return;
        }

        mailbroker.setObjectId(ObjectId);

        // Save mail and report about this
        await mailbroker.saveRaw();
        let ret = {result: "ok", ObjecId: mailbroker.getObjectId()};

        await this.addMailToQueue({ObjecId: ret.ObjecId, mode});

        console.log(`API: new mail to check: ${ret.ObjecId}`);
        res.send(JSON.stringify(ret));

      } catch (err) {
        // 5xx errors
        console.log("API:", err);
        next(err);
      }
    });

    api.get(/^\/mail\/([0-9a-f]{24})(\/(raw|spamassassin|spf|dkim|dmarc|blacklist|pyzor|razor|checkdelivery)?)?$/, async (req, res, next) => {
      try {
        let ObjecId = req.params[0];
        let select = req.params[2];

        let mailbroker = new Mailbroker({});
        try {
          await mailbroker.load(ObjecId);
        } catch (err) {
          res.status(404).send(JSON.stringify({ error: err.message ? err.message : "Not found" }));
          return;
        }
        if(select === "raw") {
          res.setHeader("Content-Type", "text/plain");
          res.send(mailbroker.doc.raw);
          return;
        }
        res.send(JSON.stringify(select ? mailbroker.doc[select] : mailbroker.doc));

      } catch (err) {
        next(err);
      }
    });

    api.get("/unsubscribe", async (req, res, next) => {
      let mailblocker = new Mailblocker;
      if(!security.isUriValid(req.originalUrl)) {
        return res.status(404).send(JSON.stringify({result: "fail", reason: "Security: wrong url sign"}));
      }

      try {
        assert.equal(req.query.type, "mongo", "Unknown type");
        await mailblocker.addFromMongo(req.query.collection, req.query._id, "from");
      } catch (e) {
        return res.status(404).send(JSON.stringify({result: "fail", reason: e.message}));
      }
      try {
        await mailblocker.block("unsubscribe");
        res.send(JSON.stringify({result: "ok"}));
      } catch (e) {
        return res.status(503).send(JSON.stringify({result: "fail", reason: e.message}));
      }
    });

    // 404 error handler
    api.use((req, res, next) => {
      res.status(404).send(JSON.stringify({ error: "Wrong API URI" }));
    });

    // Final error handler
    api.use((err, req, res, next) => {
      console.log("API:", err);
      if (req.xhr) {
        res.status(500).send(JSON.stringify({ error: err.message ? err.message : "Internal Server Error" }));
      } else {
        next(err.message ? err.message : err);
      }
    });

    api.listen(this.config.apiPort);
    console.log(`API is listening port ${this.config.apiPort}`);
  }

}

let api = new Api(config);
api.then((api) => {
  api.run();
}).catch(err => {
  console.log("API fatal error:", err);
  process.exit(1);
});
