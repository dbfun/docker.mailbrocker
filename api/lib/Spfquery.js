"use strict";

const
  { spawn } = require('child_process'),
  // @see https://metacpan.org/pod/release/JMEHNLE/Mail-SPF-Query-1.999.1/lib/Mail/SPF/Query.pm
  resultDescription = {
    "pass": "The client IP address is an authorized mailer for the sender. The mail should be accepted subject to local policy regarding the sender.",
    "fail": "The client IP address is not an authorized mailer, and the sender wants you to reject the transaction for fear of forgery.",
    "softfail": "The client IP address is not an authorized mailer, but the sender prefers that you accept the transaction because it isn't absolutely sure all its users are mailing through approved servers. The softfail status is often used during initial deployment of SPF records by a domain.",
    "neutral": "The sender makes no assertion about the status of the client IP.",
    "none": "There is no SPF record for this domain.",
    "error": "The DNS lookup encountered a temporary error during processing.",
    "unknown [...]": `The domain has a configuration error in the published data or defines a mechanism that this library does not understand. If the data contained an unrecognized mechanism, it will be presented following "unknown". You should test for unknown using a regexp /^unknown/ rather than eq "unknown".`
  };

class Spfquery {


  async check(ip, from) {
    let data = await fetchData(ip, from);
    return parseTest(data.report);
  }

  async fetchData(ip, from) {
    return new Promise((resolve, reject) => {
      /*
        Dummy sample:
          echo '8.8.8.8 info@google.com' | spfquery -debug -f - > /tmp/stdout 2>/tmp/stderr
          debug message writes to stderr
      */
      const spfquery = spawn('spfquery', ['-debug', '-f']);
      spfquery.stdin.write(`${ip} ${from}`);
      let stdout = '';
      let stderr = '';

      spfquery.stdout.on('data', (data) => {
        stdout += data;
      });

      spfquery.stderr.on('data', function (data) {
        stderr += data;
      });

      spfquery.on('close', (code) => {
        resolve({report: stdout, debug: stderr});
      });

      spfquery.stdin.end();
    });
  }

  parseTest(report) {
    let ret = {
      result: null
    };

    var m;

    m = report.match(/^Response result:\s(.*)$/m);
    ret.result = m ? m[1].trim() : null;

    return ret;

  }



}

module.exports.Spfquery = Spfquery;
module.exports.resultDescription = resultDescription;