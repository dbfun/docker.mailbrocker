const assert = require('assert');
const logger = require('log4js').getLogger();
const App = require('./App');
const Mailbroker = require('./Mailbroker');
const Report = require('./Report');
const Registry = require('./Registry');
const Sendmail = require('./Sendmail');
const Spamassassin = require('./Spamassassin');

logger.level = 'debug';
logger.category = process.env.name;

class Worker extends App {
  async init() {
    await this.connectMongo();
    await this.connectRabbitMQ();

    Registry.register('mongo', this.mongo);
    Registry.register('spamassassin', new Spamassassin(this.config.spamassassin));
  }

  async run() {
    await this.init();

    this.amqpChannel.prefetch(this.config.workerCheckAllCnt);

    await this.amqpChannel.consume('checkAll', this.checkAll.bind(this), { noAck: false });
    logger.info('Worker is started');
  }

  async checkAll(msg) {
    logger.info('Mail test start');
    const params = JSON.parse(msg.content.toString());

    try {
      const mailbroker = new Mailbroker({
        availableTests: this.config.availableTests,
        dnsServers: [await this.config.internalDnsResolver],
        blacklistDomains: this.config.blacklistDomains,
        checkdeliveryConfig: this.config.checkdeliveryConfig,
      });
      await mailbroker.load(params.ObjecId);
      await mailbroker.checkAll(true);
      if (params.mode === 'MTA') {
        await this.autoReply(mailbroker);
      }
      logger.info('Mail test complete', { _id: params.ObjecId });
      this.amqpChannel.ack(msg);
    } catch (err) {
      logger.info('Mail test error', { _id: params.ObjecId, err });
      this.amqpChannel.ack(msg);
    }
  }

  autoReply(mailbroker) {
    const fromEmail = mailbroker.getFieldFrom();

    if (this.config.replyMtaLettersTo.includes(mailbroker.getFieldToUsername())) {
      logger.info('Reply mail with spam report in MTA mode', {
        replyMtaLettersTo: this.config.replyMtaLettersTo,
        to: fromEmail,
      });
      return this.mailReport(mailbroker, fromEmail);
    }
    return null;
  }

  async mailReport(mailbroker, mailTo) {
    try {
      const report = new Report(mailbroker, this.security);
      const plain = report.mailPlain({ baseHref: this.config.apiBaseHref });
      const info = await Sendmail.mail({
        from: this.config.mailFrom,
        to: mailTo,
        subject: 'Mail test results',
        text: plain,
      });
      assert.ok(/^250 OK id=/.test(info.response));
    } catch (err) {
      logger.error('Mail report failed', { err });
    }
  }
}

module.exports.Worker = Worker;
