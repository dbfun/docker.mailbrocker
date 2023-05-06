/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/

const assert = require('assert');
const Security = require('../lib/Security');

describe('security', () => {
  it('Sign uri', () => {
    const security = new Security('salt_lake_city');
    let uri = 'http://your-domain.com/unsubscribe?type=mongo&collection=mails&_id=5ddf860007e6da349d3fe6bb';
    const expect = 'http://your-domain.com/unsubscribe?type=mongo&collection=mails&_id=5ddf860007e6da349d3fe6bb&sign=afd9edddf5cd5beee53d9d067c76e117eac6eceb';
    uri = security.signUri(uri);
    assert.equal(uri, expect);
  });

  it('Check right uri sign', () => {
    const security = new Security('salt_lake_city');
    const uri = 'http://your-domain.com/unsubscribe?type=mongo&collection=mails&_id=5ddf860007e6da349d3fe6bb&sign=afd9edddf5cd5beee53d9d067c76e117eac6eceb';
    const valid = security.isUriValid(uri);
    assert.equal(valid, true);
  });

  it('Check wrong uri sign', () => {
    const security = new Security('salt_lake_city');
    const uri = 'http://your-domain.com/unsubscribe?type=mongo&collection=mails&_id=5ddf860007e6da349d3fe6bb&sign=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const valid = security.isUriValid(uri);
    assert.equal(valid, false);
  });
});
