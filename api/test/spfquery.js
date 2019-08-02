/*
@see https://mochajs.org/
@see https://nodejs.org/api/assert.html
*/
"use strict";

const
  assert = require('assert'),
  testCases = [
    {
      name: "echo '8.8.8.8 info@google.com' | spfquery -debug -f - 2>/tmp/stderr",
      data: `--vv--
Context: Main query
Response result: softfail
Response reason: mechanism
Response err: No errors
StartError
EndError
--^^--
softfail
Please see http://www.openspf.org/Why?id=info%40google.com&ip=8.8.8.8&receiver=spfquery : Reason: mechanism
spfquery: transitioning domain of google.com does not designate 8.8.8.8 as permitted sender
Received-SPF: softfail (spfquery: transitioning domain of google.com does not designate 8.8.8.8 as permitted sender) client-ip=8.8.8.8; envelope-from=info@google.com; helo=;`
      ,
      expect: {
        result: "softfail"
      }
    },
    {
      name: "echo '8.8.8.8 info@wrong-domain-name.com' | spfquery -debug -f - 2>/tmp/stderr",
      data: `--vv--
Context: Main query
Response result: none
Response reason: (invalid reason)
Response err: No errors
StartError
Error: [UNRETURNED] Host 'wrong-domain-name.com' not found.
EndError
--^^--
StartError
Context: Failed to query MAIL-FROM
ErrorCode: (2) Could not find a valid SPF record
Error: Host 'wrong-domain-name.com' not found.
EndError
none`,
      expect: {
        result: "none"
      }
    },
    {
      name: "echo '37.9.109.3 devnull@yandex-team.ru' | spfquery -debug -f - 2>/tmp/stderr",
      data: `--vv--
Context: Main query
Response result: pass
Response reason: mechanism
Response err: No errors
StartError
EndError
--^^--
pass

spfquery: domain of yandex-team.ru designates 37.9.109.3 as permitted sender
Received-SPF: pass (spfquery: domain of yandex-team.ru designates 37.9.109.3 as permitted sender) client-ip=37.9.109.3; envelope-from=devnull@yandex-team.ru; helo=;`,
      expect: {
        result: "pass"
      }
    },
    {
      name: "echo '8.8.8.8 devnull@yandex-team.ru' | spfquery -debug -f - 2>/tmp/stderr",
      data: `--vv--
Context: Main query
Response result: fail
Response reason: mechanism
Response err: No errors
StartError
EndError
--^^--
fail
Please see http://www.openspf.org/Why?id=devnull%40yandex-team.ru&ip=8.8.8.8&receiver=spfquery : Reason: mechanism
spfquery: domain of yandex-team.ru does not designate 8.8.8.8 as permitted sender
Received-SPF: fail (spfquery: domain of yandex-team.ru does not designate 8.8.8.8 as permitted sender) client-ip=8.8.8.8; envelope-from=devnull@yandex-team.ru; helo=;`,
      expect: {
        result: "fail"
      }
    },
    {
      name: "echo '37.9.109.3 info@yandex.ru' | spfquery -debug -f - 2>/tmp/stderr",
      data: `--vv--
Context: Main query
Response result: (invalid)
Response reason: none
Response err: No errors
StartError
Error: [UNRETURNED] Temporary DNS failure for 'yandex.ru'.
EndError
--^^--
StartError
Context: Failed to query MAIL-FROM
ErrorCode: (26) DNS lookup failure
Error: Temporary DNS failure for 'yandex.ru'.
EndError
(invalid)`,
      expect: {
        result: "(invalid)"
      }
    },
    {
      name: "echo '2a02:6b8:0:1a2d::503 devnull@yandex-team.ru' | spfquery -debug -f - 2>/tmp/stderr",
      data: `--vv--
Context: Main query
Response result: pass
Response reason: mechanism
Response err: No errors
StartError
EndError
--^^--
pass

spfquery: domain of yandex-team.ru designates 2a02:6b8:0:1a2d::503 as permitted sender
Received-SPF: pass (spfquery: domain of yandex-team.ru designates 2a02:6b8:0:1a2d::503 as permitted sender) client-ip=2a02:6b8:0:1a2d::503; envelope-from=devnull@yandex-team.ru; helo=;`,
      expect: {
        result: "pass"
      }
    },
    /*{
      name: "",
      data: ``,
      expect: {
        result: "none"
      }
    },*/
  ];

describe('spfquery', () => {

  describe('parseTest', () => {
    const
      { Spfquery } = require('../lib/Spfquery');

      for(let testCase of testCases) {
        it(testCase.name, () => {
          assert.deepStrictEqual(Spfquery.prototype.parseTest(testCase.data), testCase.expect);
        });
      }


  });

});

