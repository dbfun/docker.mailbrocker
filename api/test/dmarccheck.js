/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

const
  assert = require('assert'),
  testCases = [
    {
      domain: "mail.ru",
      expect: {
        test: {
          'Sample percentage': 100,
          'DKIM alignment': 'relaxed',
          'SPF alignment': 'relaxed',
          'Domain policy': 'reject',
          'Subdomain policy': 'unspecified',
          'Aggregate report URIs': [ 'mailto:d@rua.agari.com', 'mailto:dmarc_rua@corp.mail.ru' ],
          'Failure report URIs': [ 'mailto:d@ruf.agari.com' ]
        }
      }
    },
    {
      domain: "gmail.com",
      expect: {
        test: {
          'Sample percentage': 100,
          'DKIM alignment': 'relaxed',
          'SPF alignment': 'relaxed',
          'Domain policy': 'none',
          'Subdomain policy': 'quarantine',
          'Aggregate report URIs': [ 'mailto:mailauth-reports@google.com' ],
          'Failure report URIs': [ '(none)' ]
        }
      }
    },
    {
      domain: "habrahabr.ru",
      expect: {
        test: {
          'Sample percentage': 100,
          'DKIM alignment': 'relaxed',
          'SPF alignment': 'relaxed',
          'Domain policy': 'quarantine',
          'Subdomain policy': 'quarantine',
          'Aggregate report URIs': [ 'mailto:dmarc-receiver@habramail.net' ],
          'Failure report URIs': [ '(none)' ]
        }
      }
    },
  ];

describe('dmarccheck', () => {

  const
    { Dmarccheck } = require('../lib/Dmarccheck');

  describe('check', () => {
    let dmarccheck = new Dmarccheck;
    for(let testCase of testCases) {
      it(testCase.domain, async () => {
        let dmarc = await dmarccheck.check(testCase.domain);
        // console.log(dmarc.test); process.exit(1);
        assert.deepStrictEqual(dmarc.test, testCase.expect.test);
      });
    }
  });





});
