"use strict";

const
  { spawn } = require('child_process')
  ;

class Spamassassin {

  constructor(config) {
    this.config = config;
  }

  check(msg) {
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

  }



}

module.exports.Spamassassin = Spamassassin;
