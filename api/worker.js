"use strict";

const YAML = require('yaml');
const dotenv = require("dotenv");
const logger = require("log4js").getLogger();

dotenv.config({path: "/etc/api/secrets.env"});
logger.level = "debug";
logger.category = "Worker";

const
  assert = require("assert"),
  { App } = require("./lib/App"),
  Registry = new (require("./lib/Registry").Registry),
  sendmail = new (require("./lib/Sendmail").Sendmail),
  { Report } = require("./lib/Report"),
  security = new(require("./lib/Security").Security)(process.env.SECURITY_SALT),
  { Mailbroker } = require("./lib/Mailbroker"),
  { DockerDns } = require("./lib/DockerDns"),
  config = {
    apiDomain: process.env.API_DOMAIN,
    apiPort: 80,
    apiBaseHref: null,
    checkdelivery: null,
    apiAvailableTests: process.env.API_AVAILABLE_TESTS ? process.env.API_AVAILABLE_TESTS.trim().split(",").map(Function.prototype.call, String.prototype.trim) : [],
    mailFrom: process.env.EXIM_MAIL_FROM,
    replyMtaLettersTo: process.env.API_REPLY_MTA_REPORT_TO ? process.env.API_REPLY_MTA_REPORT_TO.trim().split(",").map(Function.prototype.call, String.prototype.trim) : [],
    DNSresolver: [],
    workerCheckAllCnt: process.env.API_WORKER_CHECK_ALL_CNT ? parseInt(process.env.API_WORKER_CHECK_ALL_CNT) : 2,
    blacklistDomains: YAML.parse(process.env.API_BLACKLIST_DOMAINS),
    spamassassin: {
      port: 783,
      maxSize: process.env.INCOMING_MAIL_MAX_SIZE_KILOBYTES * 1000
    },
    mongo: {
      uri: 'mongodb://mongo:27017/mailbroker',
      db: 'mailbroker',
    },
    rabbitMQuri: `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@rabbitmq/${process.env.RABBITMQ_DEFAULT_VHOST}?heartbeat=60`
  }
  ;

// Use reverse proxy for TLS!
config.apiBaseHref = `https://${config.apiDomain}${config.apiPort == 80 ? "" : ":" + config.apiPort}`;

// Отключено до починки checkdelivery
// config.checkdelivery = {
//   mailFrom: config.mailFrom,
//   mailboxes: require("./lib/Checkdelivery/checkdelivery-mails").mailboxes.filter((o) => {
//     return o.active === true;
//   })
// };

class Worker extends App {

  constructor(config) {
    super(config);
    return new Promise(async (appResolve, appReject) => {

      try {
        await this.connectMongo();
        await this.connectRabbitMQ();

        Registry.register("mongo", this.mongo);
        Registry.register("spamassassin", new (require("./lib/Spamassassin").Spamassassin)(this.config.spamassassin));

        appResolve(this);
      } catch (err) {
        appReject(err);
      }

    });
  }

  async run() {
    this.amqpChannel.prefetch(this.config.workerCheckAllCnt);

    let internalDnsResolver = await DockerDns.resolve();
    logger.info("Setup internal DNS resolver", {dns: internalDnsResolver});
    this.config.DNSresolver = internalDnsResolver;

    await this.amqpChannel.consume("checkAll", this.checkAll.bind(this), { noAck: false });
    logger.info("Worker is started");
  }

  async checkAll(msg) {
    logger.info("Mail test start");
    let params = JSON.parse(msg.content.toString());

    try {
      let mailbroker = new Mailbroker({
        availableTests: this.config.apiAvailableTests,
        availableDNS: this.config.DNSresolver,
        blacklistDomains: this.config.blacklistDomains,
        checkdeliveryConfig: this.config.checkdelivery
      });
      await mailbroker.load(params.ObjecId);
      await mailbroker.checkAll(true);
      if(params.mode === "MTA") {
        await this.autoReply(mailbroker);
      }
      logger.info("Mail test complete", {_id: params.ObjecId});
      this.amqpChannel.ack(msg);
    } catch (err) {
      // TODO check error in mongo
      logger.info("Mail test error", {_id: params.ObjecId, err});
      this.amqpChannel.ack(msg);
    }
  }

  autoReply(mailbroker) {
    let fromEmail = mailbroker.getFieldFrom();

    if(this.config.replyMtaLettersTo.includes( mailbroker.getFieldToUsername() )) {
      logger.info("Reply mail with spam report in MTA mode", {
        replyMtaLettersTo: this.config.replyMtaLettersTo,
        to: fromEmail
      });
      return this.mailReport(mailbroker, fromEmail);
    }
  }

  async mailReport(mailbroker, mailTo) {
    try {
      let report = new Report(mailbroker, security);
      let plain = report.mailPlain({ baseHref: this.config.apiBaseHref });
      let info = await sendmail.mail({
        from: this.config.mailFrom,
        to: mailTo,
        subject: "Mail test results",
        text: plain
      });
      assert.ok(/^250 OK id=/.test(info.response));
    } catch (err) {
      logger.error("Mail report failed", {err});
    }
  }

}

let worker = new Worker(config);
worker.then((worker) => {
  worker.run();
}).catch(err => {
  logger.error("Fatal error", {err});
  process.exit(1);
});

