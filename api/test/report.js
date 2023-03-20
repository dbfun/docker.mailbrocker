/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

const
  assert = require('assert'),
  { Report } = require('../lib/Report'),
  fs=require('fs')
  ;

describe('report', () => {

  const mailbroker = require("./data/mailbroker/case-0");
  const expect = fs.readFileSync("./test/data/mailbroker/case-0.txt").toString().trim();

  it("Plain report", () => {
    let security = new(require("../lib/Security").Security)("salt_lake_city");
    let report = new Report(mailbroker, security);
    let plain = report.mailPlain({ baseHref: "http://your-domain.com" }).trim();

    // console.log(plain); process.exit();
    assert.equal(plain, expect);
  });

});
