"use strict";

const
  /*
   1. Because `Blacklist` use `dns.setServers`, changing servers may cause a problem.
   Let's use `dig`!

   2. Before using our DNS resolver, we must clear the domain zone

   First way: use `unbound-control -s 10.1.0.105@8953 flush_zone site.com.`

   Second way: send an equivalent command over TCP: `UBCT1 flush_zone site.com.`

   @see https://ru.stackoverflow.com/a/1073718/287469

  */
  { spawn } = require('child_process'),
  assert = require('assert'),
  net = require('net'),
  publicDNSList = process.env.API_PUBLIC_DNS ? process.env.API_PUBLIC_DNS.trim().split(",").map(Function.prototype.call, String.prototype.trim) : [ "8.8.8.8" ],
  // ownDns = process.env.IP_DNS_RESOLVER,
  ownDns = "dns",
  portOwnDnsControl = process.env.PORT_DNS_CONTROL
  ;

class Spfcompare {

  async check(domain) {
    const ret = {
      data: {
        public: null,
        authoritative: null
      }
    };

    let data = ret.data;

    await this.purgeZoneTXT(ownDns, portOwnDnsControl, domain);

    await Promise.all([
      new Promise(async (resolve, reject) => {
        const dns = publicDNSList[Math.floor(Math.random() * publicDNSList.length)];
        data.public = await this.fetchData(dns, domain);
        resolve();
      }),
      new Promise(async (resolve, reject) => {
        data.authoritative = await this.fetchData(ownDns, domain);
        resolve();
      })
    ]);


    if(data.public.code !== 0) {
      ret.result = "fail";
      data.message = data.public.debug;
    } else if (data.authoritative.code !== 0) {
      ret.result = "fail";
      data.message = data.authoritative.debug;
    } else {
      ret.result = "ok";
      try {
        assert.deepStrictEqual(data.public.spf, data.authoritative.spf);
        data.isSame = true;
      } catch (e) {
        data.isSame = false;
      }
    }


    return ret;
  }

  async fetchData(dns, domain) {
    return new Promise((resolve, reject) => {
      /*
        Dummy sample:
          dig +short TXT @dns-server.com domain
      */
      let options = ['+short', 'TXT', `@${dns}`, domain];
      let cmd = "dig " + options.join(" ");
      const dig = spawn('dig', options);

      let stdout = '';
      let stderr = '';

      dig.stdout.on('data', (data) => {
        stdout += data;
      });

      dig.stderr.on('data', function (data) {
        stderr += data;
      });

      dig.on('close', (code) => {
        resolve({report: stdout, debug: stderr, cmd, code, spf: this.parseSpf(stdout)});
      });

    });
  }

  parseSpf(str) {
    return str.trim().split("\n").map((el) => {
      return el.replace(/(^")|("$)/g, '');
    }).filter((el) => {
      return /^v=spf1\s/.test(el);
    });
  }

  async purgeZoneTXT(dns, port, domain) {
    return new Promise((resolve, reject) => {

      let client = new net.Socket();

      let timer = setTimeout(() => {
        client.destroy();
        resolve();
      }, 500);

      client.on('data', (data) => {
        console.log('RESP: ' + data);
        clearTimeout(timer);
        client.destroy();
        resolve();
      });

      client.connect(port, dns, () => {
        client.write(`UBCT1 flush_type ${domain}. TXT\n`);
      });

    });
  }

}

module.exports.Spfcompare = Spfcompare;
