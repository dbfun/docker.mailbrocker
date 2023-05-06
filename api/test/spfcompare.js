/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/

const
  assert = require('assert');

describe('spfcompare', function () {
  this.timeout(15000);

  const Spfcompare = require('../lib/tests/Spfcompare');
  const spfcompare = new Spfcompare();

  it('selftest', async () => {
    const domain = `selftest.${process.env.EXIM_DOMAIN}`; // selftest.site.com
    const report = await spfcompare.check(domain);

    // console.log(report); process.exit(1);

    assert.equal(report.result, 'ok');
    assert.equal(report.data.message, undefined);
    assert.deepStrictEqual(report.data.public.spf, report.data.authoritative.spf);
    assert.ok(report.data.isSame);
  });

  it('notexists', async () => {
    const domain = `notexists.${process.env.EXIM_DOMAIN}`; // notexists.site.com
    const report = await spfcompare.check(domain);

    assert.equal(report.result, 'ok');
    assert.equal(report.data.message, undefined);
    assert.deepStrictEqual(report.data.public.spf, report.data.authoritative.spf);
    assert.ok(report.data.isSame);
  });

  it('junk', async () => {
    const domain = 'junk'; //
    const report = await spfcompare.check(domain);

    assert.equal(report.result, 'ok');
    assert.equal(report.data.message, undefined);

    assert.deepStrictEqual(report.data.public.spf, report.data.authoritative.spf);
    assert.ok(report.data.isSame);
  });
});
