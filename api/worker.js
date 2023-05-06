const YAML = require('yaml');
const logger = require('log4js').getLogger();
const { Worker } = require('./lib/Worker');
const Config = require('./lib/Config');

logger.level = 'debug';
logger.category = 'Worker';

const config = new Config();

(async () => {
  try {
    const worker = new Worker(config);
    await worker.run();
  } catch (err) {
    logger.error('Worker fatal error:', err);
    process.exit(1);
  }
})();
