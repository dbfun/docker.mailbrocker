const express = require('express');
const assert = require('assert');
const bodyParser = require('body-parser');
const logger = require('log4js').getLogger();
const { App } = require('./App');
const { Mailbroker } = require('./Mailbroker');
const { Mailblocker } = require('./Mailblocker');
const { Registry } = require('./Registry');
const { Security } = require('./Security');

logger.level = 'debug';
logger.category = process.env.name;

const security = new Security(process.env.SECURITY_SALT);

class Api extends App {
  async init() {
    await this.connectMongo();
    await this.initMongo();

    await this.connectRabbitMQ();
    Registry.register('mongo', this.mongo);

    setInterval(this.clearMongo.bind(this), 3600 * 1000);
    this.clearMongo();
  }

  async initMongo() {
    logger.info('Init mongo...');

    const collections = await this.mongo.listCollections({}, { nameOnly: true }).toArray();

    if (!collections.find((o) => o.name === 'mails')) {
      await this.mongo.createCollection('mails');
      logger.info('Collection "mails" created');
    }

    if (!collections.find((o) => o.name === 'mailblocker')) {
      await this.mongo.collection('mailblocker').createIndex({ email: 1 }, { unique: true });
      logger.info('Collection "mailblocker" created');
    }
  }

  async clearMongo() {
    try {
      const collectionMails = Registry.get('mongo').collection('mails');
      const stats = await collectionMails.stats();
      logger.info(`API: mails count: ${stats.count}`);
      const removeBorder = stats.count - this.config.maxMailCount;
      if (removeBorder <= 0) return;
      // `sort({_id: 1})` is not used because sometimes _id order may be random
      const borderDoc = await collectionMails.find()
        .sort({ created: 1 })
        .skip(removeBorder)
        .limit(1)
        .next();

      collectionMails.deleteMany({ created: { $lt: new Date(borderDoc.created) } });
      logger.info(`API: removed ${removeBorder} mails`);
    } catch (err) {
      logger.error('API:', err);
    }
  }

  async addMailToQueue(params) {
    const exchange = '';
    const routingKey = 'checkAll';
    const content = Buffer.from(JSON.stringify(params));
    return new Promise((resolve, reject) => {
      this.amqpChannel.publish(
        exchange,
        routingKey,
        content,
        { persistent: true },
        (err) => {
          if (err) {
            logger.error('[AMQP] publish', err);
            this.amqpChannel.connection.close();
            reject(err);
            return;
          }
          resolve();
        },
      );
    });
  }

  async run() {
    await this.init();

    const api = express();
    api.use(bodyParser.json({ limit: this.config.incomingMailMaxSize, type: 'application/json' }));
    api.use(bodyParser.text({ limit: this.config.incomingMailMaxSize, type: () => true }));

    api.use((req, res, next) => {
      res.setHeader('Content-Type', 'application/json');
      next();
    });

    api.get('/healthcheck', async (req, res) => {
      res.send(JSON.stringify({ result: 'ok' }));
    });

    /*
      This endpoint serves Mailer-Daemon reports
      (messages from Exim Mailer Daemon such as "Dead letter mail")
     */

    api.post('/mailerdaemon', async (req, res, next) => {
      try {
        const mailbroker = new Mailbroker({});
        await mailbroker.makeFromRaw(req.body);

        let failedRecipients;
        try {
          failedRecipients = Mailbroker.findHeader(mailbroker.parsed.headerLines, 'x-failed-recipients').line;
        } catch (e) {
          /* Do nothing */
        }

        let msg = `API: Exim Mailer-Daemon report. Subj: ${mailbroker.doc.subject}`;
        if (failedRecipients) {
          msg += `. Headers: ${failedRecipients}`;
        }
        logger.info(msg);
        res.status(403).send(JSON.stringify({ result: 'fail', reason: msg }));
      } catch (err) {
        // 5xx errors
        logger.error('API:', err);
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

    api.post('/checkmail', async (req, res, next) => {
      // res.status(403).send("Temp error"); return;        // Error test case
      // res.status(503).send("Server error"); return;      // Error test case
      // res.send(JSON.stringify({result: "ok"})); return;  // Ok short case

      try {
        let mode = req.query.mode ? req.query.mode : 'MTA';
        const mailbroker = new Mailbroker({});
        await mailbroker.makeFromRaw(req.body);

        const mailFrom = mailbroker.getFieldFrom();
        logger.info('New mail fetched', { mode, mailFrom, bodyLength: req.body.length });

        // console.log(req.body);

        const doc = await Mailblocker.get(mailFrom);
        if (doc) {
          const msg = `API: mail rejected from ${doc.email}, reason: ${doc.reason}`;
          logger.info(msg);
          res.status(403).send(JSON.stringify({
            result: 'fail', reason: doc.reason, mailFrom, description: msg,
          }));
          return;
        }

        const mailTo = mailbroker.getFieldTo();
        const mailToUsername = mailbroker.getFieldToUsername();
        let ObjectId = null;

        if (['MTA', 'new', 'set'].indexOf(mode) === -1) {
          mode = 'MTA';
        }

        switch (mode) {
          case 'set':
            ObjectId = req.query.ObjectId;
            break;
          case 'new':
            ObjectId = Mailbroker.generateObjectId();
            break;
          case 'MTA':
            if (this.config.mailFrom.toLowerCase() === mailTo.toLowerCase()) {
              const msg = `API: mail rejected in MTA mode: anti loop condition. FROM: "${this.config.mailFrom}" TO: "${mailTo}"`;
              logger.info(msg);
              res.status(403).send(JSON.stringify({ result: 'fail', reason: msg }));
              return;
            }

            ObjectId = Mailbroker.getMailObjectId(mailbroker.getFieldTo());
            if (ObjectId === null) {
              if (this.config.catchMtaLettersTo.indexOf(mailToUsername) !== -1) {
                ObjectId = Mailbroker.generateObjectId();
                logger.info(`API: mail caught from MTA with username ${mailToUsername} and this.config.catchMtaLettersTo option: ${this.config.catchMtaLettersTo}; TO: "${mailTo}"`);
              } else {
                const msg = `API: mail rejected in MTA mode: wrong fied TO: "${mailTo}". Use MongoDB ObjectId as user name`;
                logger.info(msg);
                res.status(403).send(JSON.stringify({ result: 'fail', reason: msg }));
                return;
              }
            }
            break;
          default:
            throw new Error('Wrong mode');
        }

        try {
          Mailbroker.validateObjectId(ObjectId);
        } catch (e) {
          res.status(403).send(JSON.stringify({ result: 'fail', reason: 'Wrong ObjectId' }));
          return;
        }

        mailbroker.setObjectId(ObjectId);

        // Save mail and report about this
        await mailbroker.saveRaw();
        const ret = { result: 'ok', ObjecId: mailbroker.getObjectId() };

        await this.addMailToQueue({ ObjecId: ret.ObjecId, mode });

        logger.info(`API: new mail to check: ${ret.ObjecId}`);
        res.send(JSON.stringify(ret));
      } catch (err) {
        // 5xx errors
        logger.info('API:', err);
        next(err);
      }
    });

    api.get(/^\/mail\/([0-9a-f]{24})(\/(raw|spamassassin|spf|dkim|dmarc|blacklist|pyzor|razor|checkdelivery)?)?$/, async (req, res, next) => {
      try {
        const ObjecId = req.params[0];
        const select = req.params[2];

        const mailbroker = new Mailbroker({});
        try {
          await mailbroker.load(ObjecId);
        } catch (err) {
          res.status(404).send(JSON.stringify({ error: err.message ? err.message : 'Not found' }));
          return;
        }
        if (select === 'raw') {
          res.setHeader('Content-Type', 'text/plain');
          res.send(mailbroker.doc.raw);
          return;
        }
        res.send(JSON.stringify(select ? mailbroker.doc[select] : mailbroker.doc));
      } catch (err) {
        next(err);
      }
    });

    api.get('/unsubscribe', async (req, res) => {
      const mailblocker = new Mailblocker();
      if (!security.isUriValid(req.originalUrl)) {
        return res.status(404).send(JSON.stringify({ result: 'fail', reason: 'Security: wrong url sign' }));
      }

      try {
        assert.equal(req.query.type, 'mongo', 'Unknown type');
        // eslint-disable-next-line no-underscore-dangle
        await mailblocker.addFromMongo(req.query.collection, req.query._id, 'from');
      } catch (e) {
        return res.status(404).send(JSON.stringify({ result: 'fail', reason: e.message }));
      }
      try {
        await mailblocker.block('unsubscribe');
        res.send(JSON.stringify({ result: 'ok' }));
      } catch (e) {
        return res.status(503).send(JSON.stringify({ result: 'fail', reason: e.message }));
      }

      return null;
    });

    // 404 error handler
    api.use((req, res) => {
      res.status(404).send(JSON.stringify({ error: 'Wrong API URI' }));
    });

    // Final error handler
    api.use((err, req, res, next) => {
      logger.info('API:', err);
      if (req.xhr) {
        res.status(500).send(JSON.stringify({ error: err.message ? err.message : 'Internal Server Error' }));
      } else {
        next(err.message ? err.message : err);
      }
    });

    api.listen(80);
    logger.info('API is listening port 80');
  }
}

module.exports.Api = Api;
