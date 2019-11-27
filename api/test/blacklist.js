/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

const
  assert = require('assert'),
  _ = require('lodash'),
  availableDNS = process.env.IP_DNS_RESOLVER ? process.env.IP_DNS_RESOLVER.trim().split(",").map(Function.prototype.call, String.prototype.trim) : [ "94.142.137.100", "94.142.136.100" ],
  blacklistDomains = require('../lib/Blacklist/dnsbl-domains'),
  testCases = [
    {
      ip: '2a01:4f8:140:302e::2',
      expect: {
        ip: '2a01:4f8:140:302e::2',
        reverseIP: '2.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.e.2.0.3.0.4.1.0.8.f.4.0.1.0.a.2',
        blackListed: [],
        notListed: [ 'sbl.spamhaus.org' ],
        failListed: [],
        list: [ { domain: 'sbl.spamhaus.org', listed: false, success: true } ]
      }
    },
    {
      ip: '127.0.0.2',
      expect: {
        ip: '127.0.0.2',
        reverseIP: '2.0.0.127',
        blackListed: [
          'bl.mailspike.net',
          'dnsbl.sorbs.net',
          'bl.spamcop.net',
          'sbl.spamhaus.org',
          'multi.surbl.org',
          'black.uribl.com'
        ],
        notListed: [],
        failListed: [],
        list: [
          {
            domain: 'bl.mailspike.net',
            listed: true,
            success: true,
            extra: null
          },
          {
            domain: 'dnsbl.sorbs.net',
            listed: true,
            success: true,
            extra: null
          },
          {
            domain: 'bl.spamcop.net',
            listed: true,
            success: true,
            extra: null
          },
          {
            domain: 'sbl.spamhaus.org',
            listed: true,
            success: true,
            extra: null
          },
          {
            domain: 'multi.surbl.org',
            listed: true,
            success: true,
            extra: null
          },
          {
            domain: 'black.uribl.com',
            listed: true,
            success: true,
            extra: null
          }
        ]
      }
    }
  ];

describe('blacklist', () => {

  const
    { Blacklist } = require('../lib/Blacklist');

  describe('check', function() {
    this.timeout(15000);
    let blacklist = new Blacklist(availableDNS, blacklistDomains);
    for(let testCase of testCases) {
      it(testCase.ip, async () => {
        let bl = await blacklist.check(testCase.ip);

        // remove extra data
        var blShallow = _.cloneDeepWith(bl, (value, key) => {
          if(["extra", "err"].indexOf(key) !== -1) {
            return null;
          }
        });

        // console.log(blShallow); process.exit(1);

        assert.deepStrictEqual(blShallow, testCase.expect, `If test is not pass, may be one of this DNS servers has been blocked on Blacklist servers: ${availableDNS.join(", ")}`);
      });
    }
  });





});
