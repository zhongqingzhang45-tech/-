module.exports = {
  apps: [{
    name: 'lifeos',
    script: 'server.js',
    cwd: '/opt/lifeos/build',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    restart_delay: 4000,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    error_file: '/opt/lifeos/logs/error.log',
    out_file: '/opt/lifeos/logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};