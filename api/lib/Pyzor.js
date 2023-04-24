const { spawn } = require('child_process');

/**
 * Pyzor can use public server public.pyzor.org or self server.
 *
 * Pyzor Client Commands: http://www.pyzor.org/en/release-1-0-0/client.html#commands
 * Pyzor Whitelist: https://www.pyzor.org/en/latest/client.html#whitelist
 */

class Pyzor {
  static async check(msg) {
    try {
      const report = await Pyzor.fetchData(msg);
      return {
        result: 'ok',
        data: {
          report,
          test: Pyzor.parseTests(report),
        },
      };
    } catch (e) {
      return {
        result: 'fail',
        message: e.message,
      };
    }
  }

  static async fetchData(msg) {
    return new Promise((resolve) => {
      const pyzor = spawn('pyzor', ['info']);
      let stdout = '';

      pyzor.stdout.on('data', (data) => {
        stdout += data;
      });

      pyzor.on('close', () => {
        /*
        The exit code is useless:
          1 if the report count is 0 or the whitelist count is > 0
          0 if the report count is > 0 and the whitelist count is 0
        */
        resolve(stdout);
      });

      pyzor.stdin.write(msg);
      pyzor.stdin.end();
    });
  }

  static parseTests(data) {
    const results = {};

    const regexp = /^(.*?):\s(.*)$/gm;

    let m;
    do {
      m = regexp.exec(data);
      if (m) {
        results[m[1].trim()] = Pyzor.canonizeVal(m[2]);
      }
    } while (m);

    return results;
  }

  static canonizeVal(val) {
    const num = parseFloat(val);
    // eslint-disable-next-line eqeqeq
    return !Number.isNaN(num) && num == val && Number.isFinite(num) ? num : val;
  }
}

module.exports.Pyzor = Pyzor;
