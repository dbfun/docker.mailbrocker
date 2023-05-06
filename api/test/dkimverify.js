/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/

const assert = require('assert');
const fs = require('fs');

const testCases = [
  {
    src: `${__dirname}/../../test-letters/junk-data.eml`,
    name: 'junk-data',
    expect: {
      result: 'ok',
      data: {
        report: 'originator address: \n',
        test: {
          'originator address': '',
        },
      },
    },
  },
  {
    src: `${__dirname}/../../test-letters/ham-speed24.ru.eml`,
    name: 'pass',
    expect: {
      result: 'ok',
      data: {
        test: {
          'originator address': 'start@speed24.ru',
          'signature identity': '@speed24.ru',
          'verify result': 'pass',
          'sender policy result': 'accept',
          'author policy result': 'accept',
          'ADSP policy result': 'accept',
        },
      },
    },
  },
  {
    src: `${__dirname}/../../test-letters/ham-stepic.org.eml`,
    name: 'fail',
    expect: {
      result: 'ok',
      data: {
        test: {
          'originator address': 'noreply@stepik.org',
          'signature identity': '@stepik.org',
          'verify result': 'fail (message has been altered)',
          'sender policy result': 'neutral',
          'author policy result': 'neutral',
          'ADSP policy result': 'neutral',
        },
      },
    },
  },
  {
    src: `${__dirname}/../../test-letters/spam-JakobFichtl.eml`,
    name: 'neutral',
    expect: {
      result: 'ok',
      data: {
        test: {
          'originator address': 'noreply@guide-des-vins-de-bourgogne.fr',
          'sender policy result': 'neutral',
          'author policy result': 'neutral',
          'ADSP policy result': 'neutral',
        },
      },
    },
  },
];

describe('dkimverify', () => {
  const Dkimverify = require('../lib/Dkimverify');

  describe('check', () => {
    const dkimverify = new Dkimverify();
    for (const testCase of testCases) {
      it(testCase.name, async () => {
        const raw = fs.readFileSync(testCase.src);
        const dkim = await dkimverify.check(raw);
        assert.deepStrictEqual(dkim.data.test, testCase.expect.data.test);
      });
    }
  });
});
