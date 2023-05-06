/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/

const
  assert = require('assert');
const fs = require('fs');

const testCases = [
  {
    src: `${__dirname}/../../test-letters/ham-speed24.ru.eml`,
    name: 'ham',
    expect: {
      result: 'ok',
      data: {
        test: 'ham',
      },
    },
  },

];

describe('razor', () => {
  const Razor = require('../lib/Razor');

  describe('check', function () {
    const razor = new Razor();
    this.timeout(5000);
    for (const testCase of testCases) {
      it(testCase.name, async () => {
        const raw = fs.readFileSync(testCase.src);
        const rz = await razor.check(raw);
        assert.deepStrictEqual(rz, testCase.expect);
      });
    }
  });
});
