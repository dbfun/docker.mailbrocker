const
  apiAvailableTests = process.env.API_AVAILABLE_TESTS ? process.env.API_AVAILABLE_TESTS.trim().split(",").map(Function.prototype.call, String.prototype.trim) : [];

let apps = [
  {
    name: 'API',
    script: 'api.js',
    instances: 1,
    autorestart: true,
    watch: [ "api.js", "lib" ],
    max_memory_restart: '512M'
  },
  {
    name: 'Worker',
    script: 'worker.js',
    instances: 1,
    autorestart: true,
    watch: [ "worker.js", "lib" ],
    max_memory_restart: '512M'
  }
];

if(apiAvailableTests.indexOf("checkdelivery") !== -1) {
  apps.push({
    name: 'Checkdelivery',
    script: 'process-checkdelivery.js',
    instances: 1,
    autorestart: true,
    watch: [ "process-checkdelivery.js", "lib" ],
    max_memory_restart: '200M'
  });
}

module.exports = {
  apps: apps
};