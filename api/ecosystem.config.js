module.exports = {
  apps : [{
    name: 'API',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: [ "index.js", "lib" ],
    max_memory_restart: '1G'
  }]
};
