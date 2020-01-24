/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

const
  assert = require('assert'),
  testCasesParseTests = [
    {
      name: "first",
      data:
`public.pyzor.org:24441	(200, 'OK')
	Count: 0
	Entered: Thu Jan  1 00:00:00 1970
	Updated: Thu Jan  1 00:00:00 1970
	WL-Count: 0
	WL-Entered: Thu Jan  1 00:00:00 1970
	WL-Updated: Thu Jan  1 00:00:00 1970
`,
      expect: {
        Count: 0,
        Entered: 'Thu Jan  1 00:00:00 1970',
        Updated: 'Thu Jan  1 00:00:00 1970',
        'WL-Count': 0,
        'WL-Entered': 'Thu Jan  1 00:00:00 1970',
        'WL-Updated': 'Thu Jan  1 00:00:00 1970'
      }
    }


  ];

describe('pyzor', () => {

  const
    { Pyzor } = require('../lib/Pyzor');

  describe('check', () => {
    for(let testCase of testCasesParseTests) {
      it(testCase.name, async () => {
        let pz = Pyzor.prototype.parseTests(testCase.data);
        assert.deepStrictEqual(pz, testCase.expect);
      });
    }
  });





});
