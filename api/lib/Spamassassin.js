"use strict";

const
  { spawn } = require('child_process')
  ;

class Spamassassin {

  constructor(config) {
    this.config = config;
  }

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
      const spamc = spawn('spamc', ['-d', 'spamassassin', '-p', this.config.port, '-R', '-s', this.config.maxSize]);
      spamc.stdin.write(msg);
      let stdout = '';

      spamc.stdout.on('data', (data) => {
        stdout += data;
      });

      spamc.on('close', (code) => {
        if(code !== 0) {
          reject(new Error("Error occured"));
          return;
        }
        resolve(stdout);
      });

      spamc.stdin.end();

    });
  }

  parseTests(data) {
    let ret = {
      score: null,
      rules: {}
    };
    var m;

    m = data.match(/Content\s+analysis\s+details:\s+\(([0-9.-]+)\s+points/);
    ret.score = m ? parseFloat(m[1]) : null;

    m = data.match(/(-{1,}\s+-{3,}\s+-{3,})\n(.*)(\r\n|\r|\n)$/ms);
    try {
      let rules = m[2].split(/\r\n|\r|\n/)

      for(let rule of rules) {
        let m = rule.match(/^\s*([0-9.]+)\s+([a-z_]+)\s+(.*)$/i);
        try {
          let name = m[2].trim();
          ret.rules[name] = {
            score: parseFloat(m[1]),
            name: name,
            description: m[3].trim()
          };
        } catch (e) { }
      }

    } catch (e) { }

    return ret;

  }

}

module.exports.Spamassassin = Spamassassin;
