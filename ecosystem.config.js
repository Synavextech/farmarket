module.exports = {
  apps: [
    {
      name: 'simotwet-coffee-backend',
      script: './dist/server/index.js',
      instances: 'max', // Cluster mode
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
      // Logs config
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true
    }
  ]
};
