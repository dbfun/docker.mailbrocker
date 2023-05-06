/*
   1. Because `Blacklist` module uses `dns.setServers`, changing servers may cause a problem.
   Let's use `dig`!

   2. Before using our DNS resolver, we must clear the domain zone

   First way: use `unbound-control -s 10.1.0.105@8953 flush_zone site.com.`

   Second way: send an equivalent command over TCP: `UBCT1 flush_zone site.com.`

   @see https://ru.stackoverflow.com/a/1073718/287469
  */
const { spawn } = require('child_process');
const assert = require('assert');
const net = require('net');

const publicDNSList = process.env.API_PUBLIC_DNS
  ? process.env.API_PUBLIC_DNS.trim().split(',').map(Function.prototype.call, String.prototype.trim) : ['8.8.8.8'];
const ownDns = 'dns';
const portOwnDnsControl = 8953;

class Spfcompare {
  static async check(domain) {
    const ret = {
      data: {
        public: null,
        authoritative: null,
      },
    };

    const { data } = ret;

    await Spfcompare.purgeZoneTXT(ownDns, portOwnDnsControl, domain);

    await Promise.all([
      Spfcompare.checkPublic(data, domain),
      Spfcompare.checkAuthoritative(data, domain),
    ]);

    if (data.public.code !== 0) {
      ret.result = 'fail';
      data.message = data.public.debug;
    } else if (data.authoritative.code !== 0) {
      ret.result = 'fail';
      data.message = data.authoritative.debug;
    } else {
      ret.result = 'ok';
      try {
        assert.deepStrictEqual(data.public.spf, data.authoritative.spf);
        data.isSame = true;
      } catch (e) {
        data.isSame = false;
      }
    }

    return ret;
  }

  static async checkPublic(data, domain) {
    const dns = publicDNSList[Math.floor(Math.random() * publicDNSList.length)];
    data.public = await this.fetchData(dns, domain);
  }

  static async checkAuthoritative(data, domain) {
    data.authoritative = await this.fetchData(ownDns, domain);
  }

  static async fetchData(dns, domain) {
    return new Promise((resolve) => {
      /*
        Dummy sample:
          dig +short TXT @dns-server.com domain
      */
      const options = ['+short', 'TXT', `@${dns}`, domain];
      const cmd = `dig ${options.join(' ')}`;
      const dig = spawn('dig', options);

      let stdout = '';
      let stderr = '';

      dig.stdout.on('data', (data) => {
        stdout += data;
      });

      dig.stderr.on('data', (data) => {
        stderr += data;
      });

      dig.on('close', (code) => {
        resolve({
          report: stdout, debug: stderr, cmd, code, spf: Spfcompare.parseSpf(stdout),
        });
      });
    });
  }

  static parseSpf(str) {
    return str.trim().split('\n').map((el) => el.replace(/(^")|("$)/g, '')).filter((el) => /^v=spf1\s/.test(el));
  }

  static async purgeZoneTXT(dns, port, domain) {
    return new Promise((resolve) => {
      const client = new net.Socket();

      const timer = setTimeout(() => {
        client.destroy();
        resolve();
      }, 500);

      client.on('data', (data) => {
        console.log(`RESP: ${data}`);
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

module.exports = Spfcompare;
