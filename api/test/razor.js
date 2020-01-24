/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

const
  assert = require('assert'),
  fs=require('fs'),
  testCases = [
    {
      src: __dirname + "/../../test-letters/ham-speed24.ru.eml",
      name: "ham",
      expect: {
        result: "ok",
        data: {
          test: 'ham'
        }
      }
    }


  ];

describe('razor', () => {

  const
    { Razor } = require('../lib/Razor');

  describe('check', function() {
    let razor = new Razor;
    this.timeout(5000);
    for(let testCase of testCases) {
      it(testCase.name, async () => {
        let raw = fs.readFileSync(testCase.src);
        let rz = await razor.check(raw);
        assert.deepStrictEqual(rz, testCase.expect);
      });
    }
  });





});
