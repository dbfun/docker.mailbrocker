/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

const
  assert = require('assert'),
  { Report } = require('../lib/Report')
  ;

describe('report', () => {

  // GTUBE test
  const mailtester = {
    doc: {
      "spamassassin": {
        "test": {
          "score": 1000,
          "rules": {
            "GTUBE": {
              "score": 1000,
              "name": "GTUBE",
              "description": "BODY: Generic Test for Unsolicited Bulk Email"
            }
          }
        }
      }
    }
  };

let expect = `Hello, your spam score is 1000.

Spamassassin rules:

score: 1000
name: GTUBE
description: BODY: Generic Test for Unsolicited Bulk Email`;

  it("Plain report", () => {
    let report = new Report(mailtester);
    let plain = report.mailPlain();

    // console.log(plain); process.exit();
    assert.equal(plain, expect);
  });

});
