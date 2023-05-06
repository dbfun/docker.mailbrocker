const Config = require('./lib/Config');
const { initSecretsFile } = require('./init');

const config = new Config();

initSecretsFile();

const apps = [
  {
    name: 'API',
    script: 'api.js',
    instances: 1,
    autorestart: true,
    watch: ['api.js', 'lib'],
    max_memory_restart: '512M',
  },
  {
    name: 'Worker',
    script: 'worker.js',
    instances: 1,
    autorestart: true,
    watch: ['worker.js', 'lib'],
    max_memory_restart: '512M',
  },
];

if (config.availableTests.indexOf('checkdelivery') !== -1) {
  apps.push({
    name: 'Checkdelivery',
    script: 'process-checkdelivery.js',
    instances: 1,
    autorestart: true,
    watch: ['process-checkdelivery.js', 'lib'],
    max_memory_restart: '200M',
  });
}

module.exports = {
  apps,
};
