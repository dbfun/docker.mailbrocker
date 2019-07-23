/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

const
  assert = require('assert'),
  reports = {
    spam:
`1008.4/5.0
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
`
};

describe('spamassassin', () => {

  describe('parse', () => {

    it('report must be a string', () => {
      assert.ok(typeof reports.spam === "string");
    });

  });

});

