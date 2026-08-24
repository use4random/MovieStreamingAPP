module.exports = {
  apps: [
    {
      name: 'cinepulse-server',
      script: './server/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      max_memory_restart: '500M',
      listen_timeout: 8000,
      kill_timeout: 3000
    }
  ]
};
