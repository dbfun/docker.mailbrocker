const assert = require('assert');
const logger = require('log4js').getLogger();
const { App } = require('./App');
const { DockerDns } = require('./DockerDns');
const { Mailbroker } = require('./Mailbroker');
const { Report } = require('./Report');
const { Registry } = require('./Registry');
const { Security } = require('./Security');
const { Sendmail } = require('./Sendmail');
const { Spamassassin } = require('./Spamassassin');

const security = new Security(process.env.SECURITY_SALT);

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

    const internalDnsResolver = [await DockerDns.resolve('dns')];
    logger.info('Setup internal DNS resolver', { dns: internalDnsResolver });
    this.config.DNSresolver = internalDnsResolver;

    await this.amqpChannel.consume('checkAll', this.checkAll.bind(this), { noAck: false });
    logger.info('Worker is started');
  }

  async checkAll(msg) {
    logger.info('Mail test start');
    const params = JSON.parse(msg.content.toString());

    try {
      const mailbroker = new Mailbroker({
        availableTests: this.config.apiAvailableTests,
        availableDNS: this.config.DNSresolver,
        blacklistDomains: this.config.blacklistDomains,
        checkdeliveryConfig: this.config.checkdelivery,
      });
      await mailbroker.load(params.ObjecId);
      await mailbroker.checkAll(true);
      if (params.mode === 'MTA') {
        await this.autoReply(mailbroker);
      }
      logger.info('Mail test complete', { _id: params.ObjecId });
      this.amqpChannel.ack(msg);
    } catch (err) {
      // TODO check error in mongo
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
      const report = new Report(mailbroker, security);
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
