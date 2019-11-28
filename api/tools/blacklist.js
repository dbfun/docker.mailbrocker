"use strict";

const
  availableDNS = process.env.IP_DNS_RESOLVER ? process.env.IP_DNS_RESOLVER.trim().split(",").map(Function.prototype.call, String.prototype.trim) : [ "94.142.137.100", "94.142.136.100" ],
  blacklistDomains = require('../lib/Blacklist/dnsbl-domains'),
  { Blacklist } = require('../lib/Blacklist'),
  blacklist = new Blacklist(availableDNS, blacklistDomains),
  IP = process.argv[2]
  ;

console.log(`check for IP: ${IP}`);
console.log(`DNS: ${availableDNS.join(", ")}`);
console.log();
blacklist.check(IP).then((bl) => {
  console.log(bl);
});
