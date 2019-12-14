const
  apiAvailableTests = process.env.API_AVAILABLE_TESTS ? process.env.API_AVAILABLE_TESTS.trim().split(",").map(Function.prototype.call, String.prototype.trim) : [];

let apps = [
  {
    name: 'API',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: [ "index.js", "lib" ],
    max_memory_restart: '1G'
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