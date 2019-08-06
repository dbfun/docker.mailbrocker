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

class Dkimverify {

  async check(msg) {
    let report = await this.fetchData(msg);
    return {
      report: report,
      test: this.parseTest(report)
    }
  }

  async fetchData(msg) {
    return new Promise((resolve, reject) => {
      const dkimverify = spawn('/usr/bin/dkimproxy-verify');
      dkimverify.stdin.write(msg);

      let stdout = '';

      dkimverify.stdout.on('data', (data) => {
        stdout += data;
      });

      dkimverify.on('close', (code) => {
        if(code !== 0) {
          reject(new Error("Error occured"));
          return;
        }
        resolve(stdout);
      });

      dkimverify.stdin.end();

    });
  }

  parseTest(report) {
    let ret = {};

    let regexp = /^(.*?):\s(.*)$/gm;

    var m;
    do {
      m = regexp.exec(report);
      if (m) {
        ret[m[1]] = m[2];
      }
    } while (m);

    return ret;
  }

}

module.exports.Dkimverify = Dkimverify;
