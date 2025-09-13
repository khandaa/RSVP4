module.exports = {
  apps: [
    {
      name: 'rsvp-app',
      script: './backend/app.js',
      cwd: '/var/www/rsvp',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_PATH: '/var/www/rsvp/db/RSVP4.db'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_PATH: '/var/www/rsvp/db/RSVP4.db'
      },

      // Logging
      log_file: '/var/log/rsvp/combined.log',
      out_file: '/var/log/rsvp/out.log',
      error_file: '/var/log/rsvp/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      max_memory_restart: '1G',
      
      // Restart configuration
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_http: {
        url: 'http://localhost:3001/api/health',
        interval: 30000,
        timeout: 5000
      },
      
      // Auto restart on file changes (disabled for production)
      autorestart: true,
      
      // Kill timeout
      kill_timeout: 5000,
      
      // Source map support
      source_map_support: true,
      
      // Merge logs
      merge_logs: true,
      
      // Time zone
      time: true
    },
    {
      name: 'wm-app',
      script: './backend/app.js',
      cwd: '/var/www/wm',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_PATH: '/var/www/wm/db/WorkManagement.db'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_PATH: '/var/www/wm/db/WorkManagement.db'
      },
      log_file: '/var/log/wm/combined.log',
      out_file: '/var/log/wm/out.log',
      error_file: '/var/log/wm/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      health_check_http: {
        url: 'http://localhost:3000/api/health',
        interval: 30000,
        timeout: 5000
      },
      autorestart: true,
      kill_timeout: 5000,
      source_map_support: true,
      merge_logs: true,
      time: true
    }
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: '172.105.43.160',
      ref: 'origin/main',
      repo: 'git@github.com:khandaa/RSVP4.git',
      path: '/var/www/rsvp',
      'pre-deploy-local': '',
      'post-deploy': 'cd /var/www/rsvp/source && npm install --production && pm2 reload ecosystem.config.js --only rsvp-app --env production',
      'pre-setup': ''
    },
    wm_production: {
      user: 'deploy',
      host: '172.105.43.160',
      ref: 'origin/main',
      repo: 'git@github.com:khandaa/wm.git',
      path: '/var/www/wm',
      'pre-deploy-local': '',
      'post-deploy': 'cd /var/www/wm/source && npm install --production && pm2 reload ecosystem.config.js --only wm-app --env production',
      'pre-setup': ''
    }
  }
};
