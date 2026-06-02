# Nginx Reverse Proxy Configuration Guide

## Overview
This guide explains how to configure Nginx as a reverse proxy for the Gothic Vault API in production.

## Configuration File
The `nginx.conf` file provides a production-ready Nginx configuration with:
- Reverse proxy to Fastify backend
- Rate limiting
- Security headers
- Gzip compression
- SSL/TLS support (ready to enable)
- Static file serving
- Health checks

## Installation

### 1. Install Nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# macOS (for local testing)
brew install nginx
```

### 2. Deploy Configuration
```bash
# Copy configuration to Nginx sites-available
sudo cp nginx.conf /etc/nginx/sites-available/gothic-vault-api

# Create symbolic link to sites-enabled
sudo ln -s /etc/nginx/sites-available/gothic-vault-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 3. Update Domain
Edit `/etc/nginx/sites-available/gothic-vault-api` and replace:
- `api.yourdomain.com` with your actual domain
- Upstream server addresses if needed

## SSL/TLS Configuration

### Using Let's Encrypt (Free SSL)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
```

### Using Custom SSL Certificates
1. Place certificates in `/etc/ssl/certs/` and `/etc/ssl/private/`
2. Uncomment the HTTPS server block in `nginx.conf`
3. Update certificate paths
4. Reload Nginx

## Features

### 1. Rate Limiting
- General API: 100 requests/second
- Auth endpoints: 10 requests/second
- Configurable burst limits

### 2. Security Headers
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: Restricts sensitive features

### 3. Gzip Compression
Compresses text-based content for faster transfer:
- Text files (HTML, CSS, JS, XML)
- JSON responses
- Fonts
- SVG images

### 4. Load Balancing
The `upstream` block supports multiple backend servers:
```nginx
upstream gothic_vault_api {
    least_conn;
    server api1:3000 max_fails=3 fail_timeout=30s;
    server api2:3000 max_fails=3 fail_timeout=30s;
    server api3:3000 max_fails=3 fail_timeout=30s;
}
```

### 5. Health Checks
The `/health` endpoint is always accessible without rate limiting for monitoring.

## Monitoring

### View Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/gothic-vault-access.log

# Error logs
sudo tail -f /var/log/nginx/gothic-vault-error.log
```

### Monitor Performance
```bash
# Check Nginx status
sudo systemctl status nginx

# Check active connections
sudo netstat -an | grep :80 | wc -l
```

## Docker Integration

### Add Nginx to docker-compose.yml
```yaml
  nginx:
    image: nginx:alpine
    container_name: gothic-vault-nginx
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./uploads:/app/uploads
      - ./ssl:/etc/nginx/ssl  # For custom SSL certificates
    depends_on:
      - api
    networks:
      - gothic-vault-network
```

## Troubleshooting

### Configuration Test
```bash
sudo nginx -t
```

### Reload After Changes
```bash
sudo systemctl reload nginx
```

### Check Listening Ports
```bash
sudo netstat -tlnp | grep nginx
```

### Common Issues
1. **502 Bad Gateway**: Backend API is down or unreachable
2. **429 Too Many Requests**: Rate limit exceeded
3. **504 Gateway Timeout**: Backend taking too long to respond
4. **SSL Certificate Error**: Certificate expired or misconfigured

## Performance Optimization

### 1. Worker Processes
Edit `/etc/nginx/nginx.conf`:
```nginx
worker_processes auto;
worker_connections 1024;
```

### 2. Buffer Sizes
```nginx
client_body_buffer_size 128k;
client_max_body_size 10M;
client_header_buffer_size 1k;
large_client_header_buffers 4 16k;
```

### 3. Caching
Add caching for static content:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

location /api {
    proxy_cache my_cache;
    proxy_cache_valid 200 5m;
    proxy_pass http://gothic_vault_api;
}
```

## Security Best Practices

1. **Keep Nginx Updated**: Regular security updates
2. **Use Strong SSL/TLS**: TLS 1.2+ with strong ciphers
3. **Enable HSTS**: Force HTTPS connections
4. **Rate Limiting**: Prevent DDoS attacks
5. **Hide Version**: Disable server tokens
6. **Restrict Access**: Use firewall rules
7. **Monitor Logs**: Regular security audit
8. **Fail2Ban**: Block malicious IPs
