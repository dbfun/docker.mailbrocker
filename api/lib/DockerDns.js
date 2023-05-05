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
  static async resolve(host) {
    const IPs = await resolver.resolve4(host);
    return IPs[0];
  }
}

module.exports.DockerDns = DockerDns;
