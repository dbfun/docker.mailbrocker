"use strict";

const
  { spawn } = require('child_process')
  ;

class Pyzor {

  /*
    Pyzor can use public server public.pyzor.org or self server
  */


  async check(msg) {
    try {
      let report = await this.fetchData(msg);
      return {
        result: "ok",
        data: {
          report,
          test: this.parseTests(report)
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
      const pyzor = spawn('pyzor', ['info']);
      pyzor.stdin.write(msg);
      let stdout = '';

      pyzor.stdout.on('data', (data) => {
        stdout += data;
      });

      pyzor.on('close', (code) => {
        /*
        The exit code is useless:
          1 if the report count is 0 or the whitelist count is > 0
          0 if the report count is > 0 and the whitelist count is 0
        */
        resolve(stdout);
      });

      pyzor.stdin.end();
    });
  }

  parseTests(data) {
    let results = {};

    let regexp = /^(.*?):\s(.*)$/gm;

    var m;
    do {
      m = regexp.exec(data);
      if (m) {
        results[m[1].trim()] = this.canonizeVal(m[2]);
      }
    } while (m);

    return results;
  }

  canonizeVal(val) {
    val = val.trim();
    let num = parseFloat(val);
    return !isNaN(parseFloat(num)) && num == val && isFinite(num) ? num : val;
  }

}

module.exports.Pyzor = Pyzor;
