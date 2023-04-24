const logger = require('log4js').getLogger();
const { Api } = require('./lib/Api');

logger.level = 'debug';
logger.category = process.env.name;

const config = {
  incomingMailMaxSize: process.env.INCOMING_MAIL_MAX_SIZE_KILOBYTES * 1000,
  catchMtaLettersTo: process.env.API_CATCH_MTA_TO ? process.env.API_CATCH_MTA_TO.trim().split(',').map(Function.prototype.call, String.prototype.trim) : [],
  mailFrom: process.env.EXIM_MAIL_FROM,
  maxMailCount: parseInt(process.env.API_MAX_MAIL_COUNT, 10),
  mongo: {
    uri: 'mongodb://mongo:27017/mailbroker',
    db: 'mailbroker',
  },
  rabbitMQuri: `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@rabbitmq/${process.env.RABBITMQ_DEFAULT_VHOST}?heartbeat=60`,
};

(async () => {
  try {
    const api = new Api(config);
    await api.run();
  } catch (err) {
    logger.error('API fatal error:', err);
    process.exit(1);
  }
})();
