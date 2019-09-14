/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

const
  assert = require('assert'),
  _ = require('lodash'),
  availableDNS = [ "8.8.8.8", "77.88.8.8", "94.142.137.100", "94.142.136.100" ],
  blacklistDomains = require('../lib/Blacklist/dnsbl-domains'),
  testCases = [
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

        assert.deepStrictEqual(blShallow, testCase.expect);
      });
    }
  });





});
