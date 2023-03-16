/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html

run one case bundle:
  mocha test/mailtester.js -g "pyzor"
  mocha test/mailtester.js -g "case 0"
*/
"use strict";

require("core-js");

const
  assert = require('assert'),
  fs=require('fs'),
  // availableDNS = process.env.IP_DNS_RESOLVER ? process.env.IP_DNS_RESOLVER.trim().split(",").map(Function.prototype.call, String.prototype.trim) : [ "94.142.137.100", "94.142.136.100" ],
  availableDNS = [ "dns" ],
  testCasesCheckPreparation = [
    {
      src: __dirname + "/../../test-letters/ham-spf-rebus3d.ru.eml",
      expect: {
        ObjecId: "5cc8161582cd8ed026085eb1",
        from: "noreply@rebus3d.ru",
        to: "5cc8161582cd8ed026085eb1@spam24.ru",
        lastMtaIP: "94.100.179.3",
        razor: "ham",
        blacklist: {
          ip: '94.100.179.3',
          reverseIP: '3.179.100.94',
          blackListed: [ ],
          notListed: [
            'bl.mailspike.net',
            'dnsbl.sorbs.net',
            'bl.spamcop.net',
            'sbl.spamhaus.org',
            'multi.surbl.org',
            'black.uribl.com'
          ],
          failListed: [],
          list: [
            { domain: 'bl.mailspike.net', listed: false, success: true },
            { domain: 'dnsbl.sorbs.net', listed: false, success: true },
            { domain: 'bl.spamcop.net', listed: false, success: true },
            { domain: 'sbl.spamhaus.org', listed: false, success: true },
            { domain: 'multi.surbl.org', listed: false, success: true },
            { domain: 'black.uribl.com', listed: false, success: true }
          ]
        },
        spf: {
          'Received-SPF': 'pass (spfquery: domain of rebus3d.ru designates 94.100.179.3 as permitted sender) client-ip=94.100.179.3; envelope-from=noreply@rebus3d.ru;',
          'Response err': 'No errors',
          'Response reason': 'mechanism',
          'Response result': 'pass',
          Context: 'Main query',
          Warning: 'Mechanisms found after the "all:" mechanism will be ignored.',
          spfquery: 'domain of rebus3d.ru designates 94.100.179.3 as permitted sender'
        },
        dkim: {
          "ADSP policy result": "neutral",
          "author policy result": "neutral",
          "originator address": "noreply@rebus3d.ru",
          "sender policy result": "neutral",
          "signature identity": "@rebus3d.ru",
          "verify result": "fail (message has been altered)"
        }
      }
    },
    {
      src: __dirname + "/../../test-letters/ham-speed24.ru.eml",
      expect: {
        ObjecId: "5d443c9882cd8e56734b18e9",
        from: "start@speed24.ru",
        to: "5d443c9882cd8e56734b18e9@spam24.ru",
        lastMtaIP: "37.140.190.181",
        razor: "ham",
        blacklist: {
          blackListed: [],
          failListed: [],
          ip: '37.140.190.181',
          list: [
            { domain: 'bl.mailspike.net', listed: false, success: true },
            { domain: 'dnsbl.sorbs.net', listed: false, success: true },
            { domain: 'bl.spamcop.net', listed: false, success: true },
            { domain: 'sbl.spamhaus.org', listed: false, success: true },
            { domain: 'multi.surbl.org', listed: false, success: true },
            { domain: "black.uribl.com", listed: false, success: true }
          ],
          notListed: [ "bl.mailspike.net", "dnsbl.sorbs.net", "bl.spamcop.net", "sbl.spamhaus.org", "multi.surbl.org", "black.uribl.com" ],
          reverseIP: "181.190.140.37"
        },
        spf: {
          'Received-SPF': 'pass (spfquery: domain of speed24.ru designates 37.140.190.181 as permitted sender) client-ip=37.140.190.181; envelope-from=start@speed24.ru;',
          'Response err': 'No errors',
          'Response reason': 'mechanism',
          'Response result': 'pass',
          Context: 'Main query',
          spfquery: 'domain of speed24.ru designates 37.140.190.181 as permitted sender'
        },
        dkim: {
          "ADSP policy result": "accept",
          "author policy result": "accept",
          "originator address": "start@speed24.ru",
          "sender policy result": "accept",
          "signature identity": "@speed24.ru",
          "verify result": "pass"
        }
      }
    },
    {
      src: __dirname + "/../../test-letters/ham-stepic.org.eml",
      expect: {
        ObjecId: "5cc8161582cd8ed026085eb1",
        from: "noreply@stepik.org",
        to: "5cc8161582cd8ed026085eb1@spam24.ru",
        lastMtaIP: "13.69.75.239",
        razor: "ham",
        blacklist: {
          ip: '13.69.75.239',
          reverseIP: '239.75.69.13',
          blackListed: [],
          notListed: [
            'bl.mailspike.net',
            'dnsbl.sorbs.net',
            'bl.spamcop.net',
            'sbl.spamhaus.org',
            'multi.surbl.org',
            'black.uribl.com'
          ],
          failListed: [],
          list: [
            { domain: 'bl.mailspike.net', listed: false, success: true },
            { domain: 'dnsbl.sorbs.net', listed: false, success: true },
            { domain: 'bl.spamcop.net', listed: false, success: true },
            { domain: 'sbl.spamhaus.org', listed: false, success: true },
            { domain: 'multi.surbl.org', listed: false, success: true },
            { domain: 'black.uribl.com', listed: false, success: true }
          ]
        },
        spf: {
          'Received-SPF': 'pass (spfquery: domain of stepik.org designates 13.69.75.239 as permitted sender) client-ip=13.69.75.239; envelope-from=noreply@stepik.org;',
          'Response err': 'No errors',
          'Response reason': 'mechanism',
          'Response result': 'pass',
          Context: 'Main query',
          spfquery: 'domain of stepik.org designates 13.69.75.239 as permitted sender'
        },
        dkim: {
          "ADSP policy result": "neutral",
          "author policy result": "neutral",
          "originator address": "noreply@stepik.org",
          "sender policy result": "neutral",
          "signature identity": "@stepik.org",
          "verify result": "fail (message has been altered)"
        }
      }
    },
    {
      src: __dirname + "/../../test-letters/spam-GTUBE.eml",
      expect: {
        ObjecId: "5cc8161582cd8ed026085eb2",
        from: null,
        to: "5cc8161582cd8ed026085eb2@spam24.ru",
        lastMtaIP: "193.124.185.185",
        razor: "ham",
        blacklist: {
          ip: '193.124.185.185',
          reverseIP: '185.185.124.193',
          blackListed: [],
          notListed: [
            'bl.mailspike.net',
            'dnsbl.sorbs.net',
            'bl.spamcop.net',
            'sbl.spamhaus.org',
            'multi.surbl.org',
            'black.uribl.com'
          ],
          failListed: [],
          list: [
            { domain: 'bl.mailspike.net', listed: false, success: true },
            { domain: 'dnsbl.sorbs.net', listed: false, success: true },
            { domain: 'bl.spamcop.net', listed: false, success: true },
            { domain: 'sbl.spamhaus.org', listed: false, success: true },
            { domain: 'multi.surbl.org', listed: false, success: true },
            { domain: 'black.uribl.com', listed: false, success: true }
          ]
        },
        spf: {
          'Received-SPF': 'none (spfquery: domain of null does not provide an SPF record) client-ip=193.124.185.185; envelope-from=postmaster@null;',
          'Response err': 'Could not find a valid SPF record',
          'Response reason': '(invalid reason)',
          'Response result': 'none',
          Context: 'Failed to query MAIL-FROM',
          Error: "Host 'null' not found.",
          ErrorCode: '(2) Could not find a valid SPF record',
          spfquery: 'domain of null does not provide an SPF record'
        },
        dkim: {
          "originator address": ""
        }
      }
    },
    {
      src: __dirname + "/../../test-letters/spam-JakobFichtl.eml",
      expect: {
        ObjecId: "5b18b1a182cd8eb11af1873d",
        from: "noreply@guide-des-vins-de-bourgogne.fr",
        to: "5b18b1a182cd8eb11af1873d@spam24.ru",
        lastMtaIP: "212.170.160.112",
        razor: "ham",
        blacklist: {
          ip: '212.170.160.112',
          reverseIP: '112.160.170.212',
          blackListed: [],
          notListed: [
            'bl.mailspike.net',
            'dnsbl.sorbs.net',
            'bl.spamcop.net',
            'sbl.spamhaus.org',
            'multi.surbl.org',
            'black.uribl.com'
          ],
          failListed: [],
          list: [
            { domain: 'bl.mailspike.net', listed: false, success: true },
            { domain: 'dnsbl.sorbs.net', listed: false, success: true },
            { domain: 'bl.spamcop.net', listed: false, success: true },
            { domain: 'sbl.spamhaus.org', listed: false, success: true },
            { domain: 'multi.surbl.org', listed: false, success: true },
            { domain: 'black.uribl.com', listed: false, success: true }
          ]
        },
        spf: {
          'Please see http://www.openspf.org/Why?id=noreply%40guide-des-vins-de-bourgogne.fr&ip=212.170.160.112&receiver=spfquery ': 'Reason: mechanism',
          'Received-SPF': 'softfail (spfquery: transitioning domain of guide-des-vins-de-bourgogne.fr does not designate 212.170.160.112 as permitted sender) client-ip=212.170.160.112; envelope-from=noreply@guide-des-vins-de-bourgogne.fr;',
          'Response err': 'No errors',
          'Response reason': 'mechanism',
          'Response result': 'softfail',
          Context: 'Main query',
          "spfquery": "transitioning domain of guide-des-vins-de-bourgogne.fr does not designate 212.170.160.112 as permitted sender"
        },
        dkim: {
          "originator address": "noreply@guide-des-vins-de-bourgogne.fr",
          "sender policy result": "neutral",
          "author policy result": "neutral",
          "ADSP policy result": "neutral"
        }
      }
    }
  ]
;


describe('mailtester', () => {

  const
    { Mailtester } = require('../lib/Mailtester');

  describe('check', function() {
    this.timeout(15000);

    let tests = [ "spf", "dkim", "blacklist", "pyzor", "razor" ];
    for(let testName of tests) {

      describe(`${testName}`, () => {

        for(let idx in testCasesCheckPreparation) {
          let testCase = testCasesCheckPreparation[idx];

          it(`case ${idx}`, async () => {
            let raw = fs.readFileSync(testCase.src);

            /*
            // TODO: "dmarc"
            let dmarc = mailtester.getResults('dmarc');
            assert.deepStrictEqual(dmarc.test, testCase.expect.dmarc);
            */

            let availableTests = [ testName ];



            let mailtester = new Mailtester({ availableDNS: availableDNS, availableTests: availableTests });
            await mailtester.makeFromRaw(raw);

            let ObjectId = mailtester.getMailObjectId(mailtester.getFieldTo());
            assert.doesNotThrow(() => {
              mailtester.validateObjectId(ObjectId);
            });

            mailtester.setObjectId(ObjectId);

            assert.equal(mailtester.getObjectId(), testCase.expect.ObjecId);
            assert.equal(mailtester.getFieldFrom(), testCase.expect.from);
            assert.equal(mailtester.getFieldTo(), testCase.expect.to);
            assert.equal(mailtester.getFieldLastMtaIP(), testCase.expect.lastMtaIP);

            await mailtester.checkAll(false);


            if(availableTests.indexOf('spf') !== -1) {
              let spf = mailtester.getResults('spf');
              assert.deepStrictEqual(spf.test, testCase.expect.spf);
            }

            if(availableTests.indexOf('dkim') !== -1) {
              let dkim = mailtester.getResults('dkim');
              assert.deepStrictEqual(dkim.test, testCase.expect.dkim);
            }

            if(availableTests.indexOf('blacklist') !== -1) {
              let blacklist = mailtester.getResults('blacklist');
              assert.deepStrictEqual(blacklist, testCase.expect.blacklist);
            }

            if(availableTests.indexOf('pyzor') !== -1) {
              let pyzor = mailtester.getResults('pyzor');
              console.log(pyzor.test.Count);
              assert.ok(typeof pyzor.test.Count !== "undefined", "Count is undefined");
              assert.ok(pyzor.test.Count >= 0);
            }

            if(availableTests.indexOf('razor') !== -1) {
              let razor = mailtester.getResults('razor');
              assert.equal(razor.test, testCase.expect.razor);
            }

          });
        }

      });

    }


  });

});
