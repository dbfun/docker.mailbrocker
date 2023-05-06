const { spawn } = require('child_process');
const BodyParser = require('./BodyParser');

class Spamassassin {
  constructor(config) {
    this.config = config;
  }

  async check(msg) {
    try {
      const report = await this.fetchData(msg);
      return {
        result: 'ok',
        data: {
          report,
          test: Spamassassin.parseTests(report),
        },
      };
    } catch (e) {
      return {
        result: 'fail',
        message: e.message,
      };
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
        if (code !== 0) {
          reject(new Error('Error occured'));
          return;
        }
        resolve(stdout);
      });

      spamc.stdin.end();
    });
  }

  static parseTests(data) {
    const bodyParser = new BodyParser(data);

    return {
      score: bodyParser.score(),
      rules: bodyParser.rules(),
    };
  }
}

module.exports = Spamassassin;
