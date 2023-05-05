const YAML = require('yaml');
const { DockerDns } = require('./DockerDns');

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
}

module.exports.Config = Config;
