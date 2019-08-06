"use strict";

const
  { spawn } = require('child_process'),
  assert = require('assert').strict,
  YAML = require('yaml')
  ;

class Dmarccheck {

  async check(domain) {
    let report = await this.fetchData(domain);
    return {
      report: report,
      test: this.parseTest(report)
    }
  }

  async fetchData(domain) {
    return new Promise((resolve, reject) => {
      const opendmarc = spawn('/usr/sbin/opendmarc-check', [domain]);
      let stdout = '';

      opendmarc.stdout.on('data', (data) => {
        stdout += data;
      });

      opendmarc.on('close', (code) => {
        if(code !== 0) {
          reject(new Error("Error occured"));
          return;
        }
        resolve(stdout);
      });
    });
  }

  parseTest(report) {
    // report looks like YAML
    report = report.replace(/\t/g, '  ').replace(/    /g, '  - ');
    report = YAML.parse(report);
    for(var k in report){
      return report[k];
    }
  }

  _parseTest(report) {
    let ret = {};

    let regexp = /^(\t+)(.*?):(.*)$/gm;

    var m, prevKey, key, val;
    do {
      m = regexp.exec(report);
      if (m) {
        switch(m[1].length) {

          // key-val
          case 1:
            key = m[2].trim();
            val = m[3].trim();

            assert.notStrictEqual(key, "");

            if(val === "") {
              ret[key] = [];
              prevKey = key;
            } else {
              ret[key] = val;
              prevKey = null;
            }

            break;

          // val of prev key
          case 2:
            val = m[0].trim();

            assert.notStrictEqual(val, "");
            assert.ok(typeof prevKey, "string");

            ret[prevKey].push(val);

            break;
          default:
        }
        // console.log(m[1].length);
        // process.exit(10);
        // ret[m[1].trim()] = m[2].trim();
      }
    } while (m);
    console.log(ret);
    process.exit(1);

    return ret;
  }

}

module.exports.Dmarccheck = Dmarccheck;
