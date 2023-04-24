const logger = require('log4js').getLogger();
const dns = require('dns');
const assert = require('assert');
const padIpv6 = require('../node-pad-ipv6'); // @see https://github.com/fc00/node-pad-ipv6

logger.level = 'debug';
logger.category = 'Blacklist';

class Blacklist {
  constructor(availableDNS, domains) {
    this.availableDNS = availableDNS;
    this.domains = domains;
    assert.ok(typeof this.availableDNS === 'object' && this.availableDNS.length > 0);
    dns.setServers(this.availableDNS);
  }

  async check(ip) {
    if (!this.domains) {
      const msg = 'No domains to blacklist check';
      logger.error(msg);
      return {
        result: 'fail',
        message: msg,
      };
    }

    if (!ip) {
      return {
        result: 'fail',
        message: 'Wrong IP',
      };
    }

    const IPver = Blacklist.IPver(ip);

    const reverseIP = IPver === 4 ? Blacklist.reverseIPv4(ip) : Blacklist.reverseIPv6(ip);
    const dnsLookups = [];

    const domains = Blacklist.domainsByIpVer(this.domains, IPver);

    // eslint-disable-next-line no-restricted-syntax
    for (const domainBundle of domains) {
      dnsLookups.push(Blacklist.dnsLookup(reverseIP, domainBundle));
    }

    const results = await Promise.all(dnsLookups);

    const ret = {
      result: 'ok',
      data: {
        ip,
        reverseIP,
        blackListed: [],
        notListed: [],
        failListed: [],
        list: results,
      },
    };

    const { data } = ret;

    results.forEach((o) => {
      switch (o.listed) {
        case true:
          data.blackListed.push(o.domain);
          break;
        case false:
          data.notListed.push(o.domain);
          break;
        case null:
          data.failListed.push(o.domain);
          break;
        default:
          throw new Error('Wrong return value');
      }
    });

    return ret;
  }

  static domainsByIpVer(domains, IPver) {
    const IPverStr = IPver.toString();
    return domains.filter((it) => it.ipv.indexOf(IPverStr) !== -1);
  }

  static IPver(ip) {
    return ip.match(/[0-9a-f:]{8,}/) ? 6 : 4;
  }

  static reverseIPv4(ip) {
    assert.ok(typeof ip === 'string');
    return ip.split('.').reverse().join('.');
  }

  static reverseIPv6(ip) {
    const ipV6Expanded = padIpv6(ip);
    return ipV6Expanded.replace(/:/g, '').split('').reverse().join('.');
  }

  static async dnsLookup(reverseIP, domainBundle) {
    return new Promise((resolve) => {
      const domain = `${reverseIP}.${domainBundle.domain}`;
      const ret = {
        domain: domainBundle.domain,
        listed: null,
      };

      // @see https://nodejs.org/api/dns.html
      dns.resolveAny(domain, (err, data) => {
        if (err !== null) {
          // console.log(domainBundle.domain, err); process.exit(1);
          // not listed
          if (['ENOTIMP', 'ENODATA', 'ENOTFOUND'].indexOf(err.code) !== -1) {
            ret.success = true;
            ret.listed = false;
            resolve(ret);
            return;
          }
          ret.success = false;
          ret.err = err;
          resolve(ret);
          return;
        }

        ret.success = true;
        ret.listed = true;

        if (data && data.length) {
          ret.extra = data;
        }

        resolve(ret);
      });
    });
  }
}

module.exports.Blacklist = Blacklist;
