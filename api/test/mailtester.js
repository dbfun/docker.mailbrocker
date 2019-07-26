/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

const
  assert = require('assert'),
  fs=require('fs'),
  lettersBundle = [
    {
      src: __dirname + "/../../test-letters/ham-stepic.org.eml",
      ObjecId: "5cc8161582cd8ed026085eb1"
    },
    {
      src: __dirname + "/../../test-letters/spam-GTUBE.eml",
      ObjecId: "5cc8161582cd8ed026085eb2"
    },
    {
      src: __dirname + "/../../test-letters/spam-JakobFichtl.eml",
      ObjecId: "5b18b1a182cd8eb11af1873d"
    }
  ];


describe('mailtester', () => {

  describe('parse', () => {
    const
      { Mailtester } = require('../lib/Mailtester');

    for(let bundle of lettersBundle) {

      it('ObjecId', async () => {
        let raw = fs.readFileSync(bundle.src);
        let mailtester = new Mailtester();
        await mailtester.makeFromRaw(raw);

        let ObjecId = mailtester.getMailObjectId(mailtester.doc.to);
        assert.equal(ObjecId, bundle.ObjecId);
      });
    }

  });

});
