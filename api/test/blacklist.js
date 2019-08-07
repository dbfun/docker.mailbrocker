/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

const
  assert = require('assert'),
  _ = require('lodash'),
  blacklistDomains = [
    {
      "domain": "sbl.spamhaus.org",
    },
    {
      "domain": "bl.spamcannibal.org",
    },
    {
      "domain": "bl.spamcop.net",
    },
    {
      "domain": "0spam.fusionzero.com"
    },
    {
      "domain": "b.barracudacentral.org"
    }
  ],
  testCases = [
    {
      ip: "37.140.190.181",
      expect: {
        ip: "37.140.190.181",
        reverseIP: "181.190.140.37",
        blackListed: [ 'bl.spamcannibal.org' ],
        notListed: [
          'sbl.spamhaus.org',
          'bl.spamcop.net',
          '0spam.fusionzero.com',
          'b.barracudacentral.org'
        ],
        failListed: [],
        list: [
          { domain: 'sbl.spamhaus.org', listed: false, success: true },
          {
            domain: 'bl.spamcannibal.org',
            listed: true,
            success: true,
            extra: null
          },
          { domain: 'bl.spamcop.net', listed: false, success: true },
          { domain: '0spam.fusionzero.com', listed: false, success: true },
          { domain: 'b.barracudacentral.org', listed: false, success: true }
        ]
      }
    },
    {
      ip: "127.0.0.2",
      expect: {
        ip: "127.0.0.2",
        reverseIP: "2.0.0.127",
        blackListed: [
          'bl.spamcannibal.org',
          'bl.spamcop.net',
          '0spam.fusionzero.com',
          'b.barracudacentral.org'
        ],
        notListed: [ 'sbl.spamhaus.org' ],
        failListed: [],
        list: [
          { domain: 'sbl.spamhaus.org', listed: false, success: true },
          {
            domain: 'bl.spamcannibal.org',
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
            domain: '0spam.fusionzero.com',
            listed: true,
            success: true,
            extra: null
          },
          {
            domain: 'b.barracudacentral.org',
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
    // let blacklistDomains = require('../lib/Blacklist/dnsbl-domains'); // test for all domains
    let availableDNS = [ "8.8.8.8", "77.88.8.8", "94.142.137.100", "94.142.136.100" ]
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
