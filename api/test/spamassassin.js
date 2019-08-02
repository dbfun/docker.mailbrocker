/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

const
  assert = require('assert'),
  testCases = [
    {
      name: "GTUBE",
      data: `1008.4/5.0
Spam detection software, running on the system "spamassassin",
has identified this incoming email as possible spam.  The original
message has been attached to this so you can view it or label
similar future email.  If you have any questions, see
the administrator of that system for details.
Content preview:  This is 100% spam mail; XJS*C4JDBQADN1.NSBN3*2IDNEN*GTUBE-STANDARD-ANTI-UBE-TEST-EMAIL*C.34X

Content analysis details:   (1008.4 points, 5.0 required)
 pts rule name              description
---- ---------------------- --------------------------------------------------
 0.4 NO_DNS_FOR_FROM        DNS: Envelope sender has no MX or A DNS records
 1.2 MISSING_HEADERS        Missing To: header
1000 GTUBE                  BODY: Generic Test for Unsolicited Bulk Email
 0.1 MISSING_MID            Missing Message-Id: header
 0.0 TVD_SPACE_RATIO        No description available.
 1.4 MISSING_DATE           Missing Date: header
 1.8 MISSING_SUBJECT        Missing Subject: header
 1.0 MISSING_FROM           Missing From: header
 2.5 TVD_SPACE_RATIO_MINFP  Space ratio
 0.0 BODY_EMPTY             No body text in message
`,
      expect: {
        score: 1008.4,
        rules: {
          "NO_DNS_FOR_FROM": {
            name: "NO_DNS_FOR_FROM",
            score: 0.4,
            description: "DNS: Envelope sender has no MX or A DNS records"
          },
          "MISSING_HEADERS": {
            name: "MISSING_HEADERS",
            score: 1.2,
            description: "Missing To: header"
          },
          "GTUBE": {
            name: "GTUBE",
            score: 1000,
            description: "BODY: Generic Test for Unsolicited Bulk Email"
          },
          "MISSING_MID": {
            name: "MISSING_MID",
            score: 0.1,
            description: "Missing Message-Id: header"
          },
          "TVD_SPACE_RATIO": {
            name: "TVD_SPACE_RATIO",
            score: 0.0,
            description: "No description available."
          },
          "MISSING_DATE": {
            name: "MISSING_DATE",
            score: 1.4,
            description: "Missing Date: header"
          },
          "MISSING_SUBJECT": {
            name: "MISSING_SUBJECT",
            score: 1.8,
            description: "Missing Subject: header"
          },
          "MISSING_FROM": {
            name: "MISSING_FROM",
            score: 1.0,
            description: "Missing From: header"
          },
          "TVD_SPACE_RATIO_MINFP": {
            name: "TVD_SPACE_RATIO_MINFP",
            score: 2.5,
            description: "Space ratio"
          },
          "BODY_EMPTY": {
            name: "BODY_EMPTY",
            score: 0.0,
            description: "No body text in message"
          }
        }
      }
    }
  ]
;

describe('spamassassin', () => {

  describe('parseTests', () => {
    const
      { Spamassassin } = require('../lib/Spamassassin');

    for(let testCase of testCases) {
      it(testCase.name, () => {
        assert.deepStrictEqual(Spamassassin.prototype.parseTests(testCase.data), testCase.expect);
      });
    }

  });

});

