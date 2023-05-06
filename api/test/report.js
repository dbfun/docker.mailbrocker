/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/

const
  assert = require('assert');
const fs = require('fs');
const Report = require('../lib/Report');

describe('report', () => {
  const mailbroker = require('./data/mailbroker/case-0');
  const expect = fs.readFileSync('./test/data/mailbroker/case-0.txt').toString().trim();

  it('Plain report', () => {
    const Security = require('../lib/Security');
    const security = new Security('salt_lake_city');
    const report = new Report(mailbroker, security);
    const plain = report.mailPlain({ baseHref: 'http://your-domain.com' }).trim();

    // console.log(plain); process.exit();
    assert.equal(plain, expect);
  });
});
