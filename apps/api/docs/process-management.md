# Process Management Guide (PM2 & systemd)

## Overview
This guide provides instructions for managing the Gothic Vault API process in production using PM2 or systemd.

## Option 1: PM2 (Recommended for Node.js)

### Installation
```bash
# Install PM2 globally
npm install -g pm2

# Or using yarn
yarn global add pm2
```

### PM2 Configuration
Create `ecosystem.config.js` in the project root:

```javascript
module.exports = {
  apps: [{
    name: 'gothic-vault-api',
    script: './dist/server.js',
    cwd: '/path/to/apps/api',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true,
  }],
};
```

### Start Application
```bash
# Start in development
pm2 start ecosystem.config.js --env development

# Start in production
pm2 start ecosystem.config.js --env production

# Or start directly
pm2 start dist/server.js --name gothic-vault-api
```

### PM2 Commands
```bash
# List all processes
pm2 list

# Show process details
pm2 show gothic-vault-api

# View logs
pm2 logs gothic-vault-api

# View real-time logs
pm2 logs gothic-vault-api --lines 100

# Restart process
pm2 restart gothic-vault-api

# Reload (zero-downtime)
pm2 reload gothic-vault-api

# Stop process
pm2 stop gothic-vault-api

# Delete process
pm2 delete gothic-vault-api

# Monitor
pm2 monit
```

### PM2 Startup Script
Ensure PM2 starts on system boot:
```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save

# To disable startup
pm2 unstartup
```

### PM2 Monitoring
```bash
# Install PM2 Plus (optional)
pm2 plus

# Or use built-in monitoring
pm2 monit

# View metrics
pm2 show gothic-vault-api
```

## Option 2: systemd (Recommended for Linux Servers)

### Create systemd Service
Create `/etc/systemd/system/gothic-vault-api.service`:

```ini
[Unit]
Description=Gothic Vault API
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=nodejs
Group=nodejs
WorkingDirectory=/var/www/gothic-vault/apps/api
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/var/www/gothic-vault/apps/api/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=gothic-vault-api

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/gothic-vault/apps/api/uploads

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
```

### Enable and Start Service
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable gothic-vault-api

# Start service
sudo systemctl start gothic-vault-api

# Check status
sudo systemctl status gothic-vault-api

# View logs
sudo journalctl -u gothic-vault-api -f

# Restart service
sudo systemctl restart gothic-vault-api

# Stop service
sudo systemctl stop gothic-vault-api
```

### systemd Commands
```bash
# Enable service
sudo systemctl enable gothic-vault-api

# Disable service
sudo systemctl disable gothic-vault-api

# Start service
sudo systemctl start gothic-vault-api

# Stop service
sudo systemctl stop gothic-vault-api

# Restart service
sudo systemctl restart gothic-vault-api

# Reload service (if supported)
sudo systemctl reload gothic-vault-api

# Check status
sudo systemctl status gothic-vault-api

# View logs (last 100 lines)
sudo journalctl -u gothic-vault-api -n 100

# Follow logs in real-time
sudo journalctl -u gothic-vault-api -f

# View logs since last boot
sudo journalctl -u gothic-vault-api -b
```

## Comparison: PM2 vs systemd

### PM2 Advantages
- Built for Node.js applications
- Cluster mode for multi-core utilization
- Easy monitoring and logging
- Zero-downtime reloads
- Web-based monitoring (PM2 Plus)
- Automatic restart on crash

### systemd Advantages
- Native Linux process manager
- Better integration with system services
- More fine-grained control
- Better security features
- No additional dependencies
- Standard for Linux servers

### Recommendation
- Use **PM2** for Node.js-specific features (cluster mode, easy monitoring)
- Use **systemd** for better system integration and security

## Deployment with Process Manager

### Using PM2
```bash
# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

### Using systemd
```bash
# Build application
npm run build

# Copy files to production directory
sudo cp -r . /var/www/gothic-vault/apps/api/

# Set permissions
sudo chown -R nodejs:nodejs /var/www/gothic-vault/apps/api

# Start service
sudo systemctl start gothic-vault-api
```

## Monitoring and Alerts

### PM2 Monitoring
```bash
# Install monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### systemd Monitoring
```bash
# Check service status
sudo systemctl status gothic-vault-api

# Set up monitoring tools (e.g., monit, Nagios)
# Or use cloud monitoring (Datadog, New Relic)
```

## Health Checks

### Add Health Check Endpoint
Ensure your API has a `/health` endpoint:
```typescript
fastify.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
}));
```

### Configure Health Check in systemd
```ini
[Service]
...
Restart=on-failure
RestartSec=10
ExecStartPre=/usr/bin/curl -f http://localhost:3000/health || exit 1
```

## Log Management

### PM2 Log Rotation
```bash
# Install logrotate module
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
```

### systemd Log Rotation
Configure `/etc/logrotate.d/gothic-vault-api`:
```
/var/log/gothic-vault-api/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 nodejs nodejs
}
```

## Security Considerations

### Run as Non-Root User
Both PM2 and systemd should run as a non-root user:
```bash
# Create user
sudo useradd -r -s /bin/false nodejs

# Set ownership
sudo chown -R nodejs:nodejs /var/www/gothic-vault
```

### File Permissions
```bash
# Set appropriate permissions
sudo chmod 750 /var/www/gothic-vault/apps/api
sudo chmod 640 /var/www/gothic-vault/apps/api/.env
```

### Resource Limits
Configure resource limits to prevent resource exhaustion:
```ini
# In systemd
LimitNOFILE=65536
LimitNPROC=4096
MemoryMax=2G
```

## Troubleshooting

### PM2 Issues
```bash
# Check PM2 logs
pm2 logs

# Check process status
pm2 status

# Flush logs
pm2 flush

# Reset PM2
pm2 kill
pm2 resurrect
```

### systemd Issues
```bash
# Check service status
sudo systemctl status gothic-vault-api

# View logs
sudo journalctl -u gothic-vault-api -n 100

# Check for permission issues
sudo journalctl -u gothic-vault-api --since today | grep -i error

# Test configuration
sudo systemd-analyze verify gothic-vault-api.service
```

## Docker Alternative
If using Docker, process management is handled by Docker:
```bash
# Restart policy
docker update --restart=unless-stopped gothic-vault-api

# View logs
docker logs -f gothic-vault-api

# Restart container
docker restart gothic-vault-api
```
