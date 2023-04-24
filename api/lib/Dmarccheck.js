const { spawn } = require('child_process');
const YAML = require('yaml');
const logger = require('log4js').getLogger();

logger.level = 'debug';
logger.category = 'Dmarccheck';

class Dmarccheck {
  static async check(domain) {
    try {
      const report = await Dmarccheck.fetchData(domain);
      return {
        result: 'ok',
        data: {
          report,
          test: Dmarccheck.parseTests(report),
        },
      };
    } catch (e) {
      logger.error(e);
      return {
        result: 'fail',
        message: e.message,
      };
    }
  }

  static async fetchData(domain) {
    return new Promise((resolve, reject) => {
      const opendmarc = spawn('/usr/sbin/opendmarc-check', [domain]);
      let stdout = '';

      opendmarc.stdout.on('data', (data) => {
        stdout += data;
      });

      opendmarc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error('Error occured'));
          return;
        }
        resolve(stdout);
      });
    });
  }

  static parseTests(report) {
    // report looks like YAML
    const yaml = report.replace(/\t/g, '  ').replace(/ {4}/g, '  - ');
    const parsed = YAML.parse(yaml);
    return Object.values(parsed)[0];
  }
}

module.exports.Dmarccheck = Dmarccheck;
