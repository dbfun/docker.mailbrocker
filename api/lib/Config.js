const YAML = require('yaml');
const dotenv = require('dotenv');
const { DockerDns } = require('./DockerDns');

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
    return process.env.API_CATCH_MTA_TO ? process.env.API_CATCH_MTA_TO.trim().split(',').map(Function.prototype.call, String.prototype.trim) : [];
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
}

module.exports = Config;
