const dns = require('dns');
const IPTools = require('../IPTools');

class Blacklist {
  constructor(dnsServers, domains) {
    dns.setServers(dnsServers);
    this.domains = domains;

    if (!this.domains) {
      throw new Error('No domains to check in the blacklists');
    }
  }

  async check(ip) {
    if (!ip) {
      return {
        result: 'fail',
        message: 'Wrong IP',
      };
    }

    const IPver = IPTools.IPver(ip);

    const reverseIP = IPver === 4 ? IPTools.reverseIPv4(ip) : IPTools.reverseIPv6(ip);
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

module.exports = Blacklist;
