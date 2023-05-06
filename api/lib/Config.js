const YAML = require('yaml');
const dotenv = require('dotenv');
const DockerDns = require('./DockerDns');

dotenv.config({ path: '/etc/api/secrets.env' });

class Config {
  constructor() {
    this.cache = {};
  }

  get blacklistDomains() {
    if (!this.cache.blacklistDomains) {
      this.cache.blacklistDomains = YAML.parse(process.env.API_BLACKLIST_DOMAINS);
    }
    return this.cache.blacklistDomains;
  }

  get internalDnsResolver() {
    if (!this.cache.internalDnsResolver) {
      this.cache.internalDnsResolver = DockerDns.resolve('dns');
    }
    return this.cache.internalDnsResolver;
  }

  get incomingMailMaxSize() {
    return process.env.INCOMING_MAIL_MAX_SIZE_KILOBYTES * 1000;
  }

  get catchMtaLettersTo() {
    return Config.commaSeparatedToArray(process.env.API_CATCH_MTA_TO);
  }

  get mailFrom() {
    return process.env.EXIM_MAIL_FROM;
  }

  get maxMailCount() {
    return parseInt(process.env.API_MAX_MAIL_COUNT, 10);
  }

  get mongo() {
    return {
      uri: 'mongodb://mongo:27017/mailbroker',
      db: 'mailbroker',
    };
  }

  get rabbitMQuri() {
    return `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@rabbitmq/${process.env.RABBITMQ_DEFAULT_VHOST}?heartbeat=60`;
  }

  get securitySalt() {
    return process.env.SECURITY_SALT;
  }

  get apiDomain() {
    return process.env.API_DOMAIN;
  }

  get apiBaseHref() {
    // Use reverse proxy for TLS!
    return `https://${this.apiDomain}`;
  }

  get checkdeliveryConfig() {
    // Отключено до починки checkdelivery
    return null;

    // return {
    //   mailFrom: this.mailFrom,
    //   mailboxes: require("./lib/Checkdelivery/checkdelivery-mails").mailboxes.filter((o) => {
    //     return o.active === true;
    //   })
    // };
  }

  get availableTests() {
    return Config.commaSeparatedToArray(process.env.API_AVAILABLE_TESTS);
  }

  get replyMtaLettersTo() {
    return Config.commaSeparatedToArray(process.env.API_REPLY_MTA_REPORT_TO);
  }

  get workerCheckAllCnt() {
    return process.env.API_WORKER_CHECK_ALL_CNT
      ? parseInt(process.env.API_WORKER_CHECK_ALL_CNT, 10) : 2;
  }

  get spamassassin() {
    return {
      port: 783,
      maxSize: process.env.INCOMING_MAIL_MAX_SIZE_KILOBYTES * 1000,
    };
  }

  static commaSeparatedToArray(str, def = []) {
    return str ? str.split(',').map((o) => o.trim()) : def;
  }
}

module.exports = Config;
