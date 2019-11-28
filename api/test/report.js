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

const mailtester = require("./data/mailtester/case-0");
const expect = fs.readFileSync("./test/data/mailtester/case-0.txt").toString().trim();

  it("Plain report", () => {
    let report = new Report(mailtester);
    let plain = report.mailPlain().trim();

    // console.log(plain); process.exit();
    assert.equal(plain, expect);
  });

});
