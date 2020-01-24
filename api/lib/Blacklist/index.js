"use strinct";

const
  dns = require('dns'),
  assert = require('assert'),
  padIpv6 = require("../node-pad-ipv6") // @see https://github.com/fc00/node-pad-ipv6
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
      if(!ip) {
        resolve({
          result: "fail",
          message: "Wrong IP"
        });
        return;
      }

      let IPver = this.IPver(ip);

      let reverseIP = IPver === 4 ? this.reverseIPv4(ip) : this.reverseIPv6(ip);
      let dnsLookups = [];

      let domains = this.domainsByIpVer(this.domains, IPver);

      for (let domainBundle of domains) {
        dnsLookups.push(this.dnsLookup(reverseIP, domainBundle));
      }

      Promise.all(dnsLookups).then((results) => {
        let ret = {
          result: "ok",
          data: {
            ip: ip,
            reverseIP: reverseIP,
            blackListed: [],
            notListed: [],
            failListed: [],
            list: results
          }
        };
        let data = ret.data;
        results.forEach(o => {
          switch(o.listed) {
            case true:
              data.blackListed.push(o.domain);
              break;
            case false:
              data.notListed.push(o.domain);
              break;
            case null:
              data.failListed.push(o.domain);
              break;
          }

        });
        resolve(ret);
      });

    });
  }

  domainsByIpVer(domains, IPver) {
    let IPverStr = IPver.toString();
    return domains.filter((it) => {
      return it.ipv.indexOf(IPverStr) !== -1;
    });
  }

  IPver(ip) {
    return ip.match(/[0-9a-f:]{8,}/) ? 6 : 4;
  }

  reverseIPv4(ip) {
    assert.ok(typeof ip === "string");
    return ip.split(".").reverse().join(".");
  }

  reverseIPv6(ip) {
    let ipV6Expanded = padIpv6(ip);
    return ipV6Expanded.replace(/:/g, "").split("").reverse().join(".");
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
          // console.log(domainBundle.domain, err); process.exit(1);
          // not listed
          if(["ENOTIMP", "ENODATA", "ENOTFOUND"].indexOf(err.code) !== -1) {
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
