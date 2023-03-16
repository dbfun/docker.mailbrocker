"use strict";

const
  assert = require("assert"),
  { App } = require("./lib/App"),
  Registry = new (require("./lib/Registry").Registry),
  sendmail = new (require("./lib/Sendmail").Sendmail),
  { Report } = require("./lib/Report"),
  security = new(require("./lib/Security").Security)(process.env.SECURITY_SALT),
  { Mailtester } = require("./lib/Mailtester"),
  config = {
    apiDomain: process.env.API_DOMAIN,
    apiDomainProtocol: process.env.API_DOMAIN_PROTOCOL,
    apiPort: process.env.PORT_API,
    apiBaseHref: null,
    checkdelivery: null,
    apiAvailableTests: process.env.API_AVAILABLE_TESTS ? process.env.API_AVAILABLE_TESTS.trim().split(",").map(Function.prototype.call, String.prototype.trim) : [],
    mailFrom: process.env.EXIM_MAIL_FROM,
    replyMtaLettersAll: process.env.API_REPLY_MTA_REPORT_ALL === "on",
    replyMtaLettersTo: process.env.API_REPLY_MTA_REPORT_TO ? process.env.API_REPLY_MTA_REPORT_TO.trim().split(",").map(Function.prototype.call, String.prototype.trim) : [],
    // DNSresolver: process.env.IP_DNS_RESOLVER ? process.env.IP_DNS_RESOLVER.trim().split(",").map(Function.prototype.call, String.prototype.trim) : [ "10.1.0.105" ],
    DNSresolver: [ "dns" ],
    workerCheckAllNum: process.env.API_WORKER_CHECK_ALL_NUM ? parseInt(process.env.API_WORKER_CHECK_ALL_NUM) : 2,
    spamassassin: {
      port: process.env.PORT_SPAMASSASSIN,
      maxSize: process.env.SPAMASSASSIN_MAX_MSG_SIZE
    },
    mongo: {
      uri: process.env.MONGO_URI,
      db: process.env.MONGO_DB,
    },
    rabbitMQuri: `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@rabbitmq/${process.env.RABBITMQ_DEFAULT_VHOST}?heartbeat=60`
  }
  ;

config.apiBaseHref = `${config.apiDomainProtocol}://${config.apiDomain}${config.apiPort == 80 ? "" : ":" + config.apiPort}`;
config.checkdelivery = {
  mailFrom: config.mailFrom,
  mailboxes: require("./lib/Checkdelivery/checkdelivery-mails").mailboxes.filter((o) => {
    return o.active === true;
  })
};

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
    this.amqpChannel.prefetch(this.config.workerCheckAllNum);
    await this.amqpChannel.consume("checkAll", this.checkAll.bind(this), { noAck: false });
    console.log("Worker is started");
  }

  async checkAll(msg) {
    let params = JSON.parse(msg.content.toString());

    try {
      let mailtester = new Mailtester({ availableDNS: this.config.DNSresolver, availableTests: this.config.apiAvailableTests, checkdeliveryConfig: this.config.checkdelivery });
      await mailtester.load(params.ObjecId);
      await mailtester.checkAll(true);
      if(params.mode === "MTA") {
        await this.autoReply(mailtester);
      }
      console.error(`Worker: mail test complete ${params.ObjecId}`);
      this.amqpChannel.ack(msg);
    } catch (err) {
      // TODO check error in mongo
      console.log(`Worker: mail test error ${params.ObjecId}:`, err);
      this.amqpChannel.ack(msg);
    }
  }

  autoReply(mailtester) {
    let fromEmail = mailtester.getFieldFrom();

    if(this.config.replyMtaLettersAll) {
      console.log(`Worker: reply mail with spam report in MTA mode with this.config.replyMtaLettersAll option; TO: ${fromEmail}`);
      return this.mailReport(mailtester, fromEmail);
    }

    if(this.config.replyMtaLettersTo.includes( mailtester.getFieldToUsername() )) {
      console.log(`Worker: reply mail with spam report in MTA mode with this.config.replyMtaLettersTo option: ${this.config.replyMtaLettersTo}; TO: ${fromEmail}`);
      return this.mailReport(mailtester, fromEmail);
    }
  }

  async mailReport(mailtester, mailTo) {
    try {
      let report = new Report(mailtester, security);
      let plain = report.mailPlain({ baseHref: this.config.apiBaseHref });
      let info = await sendmail.mail({
        from: this.config.mailFrom,
        to: mailTo,
        subject: "Mail test results",
        text: plain
      });
      assert.ok(/^250 OK id=/.test(info.response));
    } catch (e) {
      console.log("Worker:", e);
    }
  }

}

let worker = new Worker(config);
worker.then((worker) => {
  worker.run();
}).catch(err => {
  console.log("Worker fatal error:", err);
  process.exit(1);
});

