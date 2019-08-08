"use strict";

const
  { spawn } = require('child_process')
  ;

class Razor {

  /*
    razor-check checks a mail against the distributed Razor Catalogue by communicating with a Razor Catalogue Server
  */


  async check(msg) {
    return await this.fetchData(msg);
  }

  async fetchData(msg) {
    return new Promise((resolve, reject) => {
      const pyzor = spawn('razor-check');
      pyzor.stdin.write(msg);
      let stdout = '';

      pyzor.stdout.on('data', (data) => {
        stdout += data;
      });

      pyzor.on('close', (code) => {
        if(code > 1) {
          reject(new Error("Razor exit code must be 0 or 1"));
          return;
        }
        /*
        razor-check terminates with exit value:
          - 0 if the signature for the mail is catalogued on the server (spam) or
          - 1 if the mail is not catalogued by the server (not a spam).
        */
        resolve({
          test: code === 0 ? "spam" : "ham"
        });
      });

      pyzor.stdin.end();
    });
  }



}

module.exports.Razor = Razor;
