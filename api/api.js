const logger = require('log4js').getLogger();
const { Api } = require('./lib/Api');
const Config = require('./lib/Config');

logger.level = 'debug';
logger.category = process.env.name;

const config = new Config();

(async () => {
  try {
    const api = new Api(config);
    await api.run();
  } catch (err) {
    logger.error('API fatal error:', err);
    process.exit(1);
  }
})();
