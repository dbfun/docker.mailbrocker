"use strinct";

const
  dns = require('dns'),
  assert = require('assert')
  ;

class Blacklist {

  constructor(availableDNS, domains) {
    this.availableDNS = availableDNS;
    this.domains = domains;
    assert.ok(typeof this.availableDNS === "object" && this.availableDNS.length > 0);
    dns.setServers(this.availableDNS);
  }

  async check(ip) {
    return new Promise(async (resolve, reject) => {

      let reverseIP = this.reverseIP(ip);
      let dnsLookups = [];

      for (let domainBundle of this.domains) {
        dnsLookups.push(this.dnsLookup(reverseIP, domainBundle));
      }

      Promise.all(dnsLookups).then((results) => {
        let ret = {
          ip: ip,
          reverseIP: reverseIP,
          blackListed: [],
          notListed: [],
          failListed: [],
          list: results
        };
        results.forEach(o => {
          switch(o.listed) {
            case true:
              ret.blackListed.push(o.domain);
              break;
            case false:
              ret.notListed.push(o.domain);
              break;
            case null:
              ret.failListed.push(o.domain);
              break;
          }

        });
        resolve(ret);
      });

    });
  }

  reverseIP(ip) {
    return this.reverseIPv4(ip);
  }

  reverseIPv4(ip) {
    assert.ok(typeof ip === "string");
    return ip.split(".").reverse().join(".");
  }

  dnsLookup(reverseIP, domainBundle) {
    return new Promise((resolve, reject) => {
      let domain = `${reverseIP}.${domainBundle.domain}`;
      let ret = {
        domain: domainBundle.domain,
        listed: null
      };

      // @see https://nodejs.org/api/dns.html
      dns.resolveAny(domain, (err, data) => {

        if(err !== null) {
          // console.log(domainBundle.domain, err);
          // not listed
          if(["ENODATA", "ENOTFOUND"].indexOf(err.code) !== -1) {
            ret.success = true;
            ret.listed = false;
            return resolve(ret);
          }
          ret.success = false;
          ret.err = err;
          return resolve(ret);
        }

        ret.success = true;
        ret.listed = true;

        if(data && data.length) {
          ret.extra = data;
        }

        resolve(ret);
      });

    });
  }

}


module.exports.Blacklist = Blacklist;
