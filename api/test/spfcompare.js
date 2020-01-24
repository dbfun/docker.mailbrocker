/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

const
  assert = require('assert')
  ;

describe('spfcompare', function() {

  this.timeout(15000);

  const
    spfcompare = new (require('../lib/Spfcompare')).Spfcompare;


  it("selftest", async () => {
    let domain = `selftest.${process.env.EXIM_DOMAIN}`; // selftest.site.com
    let report = await spfcompare.check(domain);

    // console.log(report); process.exit(1);

    assert.equal(report.result, "ok");
    assert.equal(report.data.message, undefined);
    assert.deepStrictEqual(report.data.public.spf, report.data.authoritative.spf);
    assert.ok(report.data.isSame);
  });

  it("notexists", async () => {
    let domain = `notexists.${process.env.EXIM_DOMAIN}`; // notexists.site.com
    let report = await spfcompare.check(domain);

    assert.equal(report.result, "ok");
    assert.equal(report.data.message, undefined);
    assert.deepStrictEqual(report.data.public.spf, report.data.authoritative.spf);
    assert.ok(report.data.isSame);
  });

  it("junk", async () => {
    let domain = `junk`; //
    let report = await spfcompare.check(domain);

    assert.equal(report.result, "ok");
    assert.equal(report.data.message, undefined);

    assert.deepStrictEqual(report.data.public.spf, report.data.authoritative.spf);
    assert.ok(report.data.isSame);
  });


});
