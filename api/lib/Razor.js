const { spawn } = require('child_process');

class Razor {
  /*
    razor-check checks a mail against the distributed Razor Catalogue by
    communicating with a Razor Catalogue Server
  */

  static async check(msg) {
    try {
      const data = await Razor.fetchData(msg);
      return {
        result: 'ok',
        data,
      };
    } catch (e) {
      return {
        result: 'fail',
        message: e.message,
      };
    }
  }

  static async fetchData(msg) {
    return new Promise((resolve, reject) => {
      const razor = spawn('razor-check', ['-home=/tmp']);

      razor.stdout.on('data', () => {
        /* Do nothing */
      });

      razor.on('close', (code) => {
        /*
        razor-check terminates with exit value:
          - 0 if the signature for the mail is catalogued on the server (spam) or
          - 1 if the mail is not catalogued by the server (not a spam).
        */
        if (code > 1) {
          reject(new Error('Razor exit code must be 0 or 1'));
          return;
        }
        resolve({
          test: code === 0 ? 'spam' : 'ham',
        });
      });

      razor.stdin.write(msg);
      razor.stdin.end();
    });
  }
}

module.exports = Razor;
