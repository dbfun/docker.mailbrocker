const YAML = require('yaml');
const logger = require('log4js').getLogger();
const { Worker } = require('./lib/Worker');

logger.level = 'debug';
logger.category = 'Worker';

const config = {
  apiDomain: process.env.API_DOMAIN,
  apiBaseHref: null,
  checkdelivery: null,
  apiAvailableTests: process.env.API_AVAILABLE_TESTS ? process.env.API_AVAILABLE_TESTS.trim().split(',').map(Function.prototype.call, String.prototype.trim) : [],
  mailFrom: process.env.EXIM_MAIL_FROM,
  replyMtaLettersTo: process.env.API_REPLY_MTA_REPORT_TO ? process.env.API_REPLY_MTA_REPORT_TO.trim().split(',').map(Function.prototype.call, String.prototype.trim) : [],
  DNSresolver: [],
  workerCheckAllCnt: process.env.API_WORKER_CHECK_ALL_CNT
    ? parseInt(process.env.API_WORKER_CHECK_ALL_CNT, 10) : 2,
  blacklistDomains: YAML.parse(process.env.API_BLACKLIST_DOMAINS),
  spamassassin: {
    port: 783,
    maxSize: process.env.INCOMING_MAIL_MAX_SIZE_KILOBYTES * 1000,
  },
  mongo: {
    uri: 'mongodb://mongo:27017/mailbroker',
    db: 'mailbroker',
  },
  rabbitMQuri: `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@rabbitmq/${process.env.RABBITMQ_DEFAULT_VHOST}?heartbeat=60`,
};

// Use reverse proxy for TLS!
config.apiBaseHref = `https://${config.apiDomain}`;

// Отключено до починки checkdelivery
// config.checkdelivery = {
//   mailFrom: config.mailFrom,
//   mailboxes: require("./lib/Checkdelivery/checkdelivery-mails").mailboxes.filter((o) => {
//     return o.active === true;
//   })
// };

(async () => {
  try {
    const worker = new Worker(config);
    await worker.run();
  } catch (err) {
    logger.error('Worker fatal error:', err);
    process.exit(1);
  }
})();
