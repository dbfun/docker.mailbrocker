"use strict";

const
  { spawn } = require('child_process')
  ;

class Dkimverify {

  async check(msg) {
    try {
      let report = await this.fetchData(msg);
      return {
        result: "ok",
        data: {
          report,
          test: this.parseTest(report)
        }
      }
    } catch (e) {
      return {
        result: "fail",
        message: e.message
      }
    }
  }

  async fetchData(msg) {
    return new Promise((resolve, reject) => {
      const dkimverify = spawn('dkimproxy-verify');
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
