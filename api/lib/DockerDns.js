const { Resolver } = require('node:dns').promises;
const logger = require('log4js').getLogger();

logger.level = 'debug';
logger.category = 'DockerDns';

const resolver = new Resolver();
const expected = '127.0.0.11';
const actual = resolver.getServers()[0];

const isDockerDns = expected === actual;

if (!isDockerDns) {
  logger.warn(`Unexpected Docker DNS resolver. Expected ${expected}, received ${actual}`);
}

class DockerDns {
  static async resolve() {
    return resolver.resolve4('dns');
  }
}

module.exports.DockerDns = DockerDns;
