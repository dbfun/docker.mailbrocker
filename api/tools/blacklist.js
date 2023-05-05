const assert = require('assert');
const Config = require('../lib/Config');
const { Blacklist } = require('../lib/Blacklist');

const IP = process.argv[2];
assert.ok(typeof IP === 'string', 'Wrong IP. Use: "make tools-blacklist IP=..."');

const config = new Config();

(async () => {
  const dns = await config.internalDnsResolver;

  const blacklist = new Blacklist([dns], config.blacklistDomains);

  console.log(`Check for IP: ${IP}`);
  console.log();

  const bl = await blacklist.check(IP);
  console.log(bl);
})();
