# SSL/TLS Configuration Guide

## Overview
This guide provides instructions for configuring SSL/TLS for the Gothic Vault e-commerce platform in production.

## SSL Options

### 1. Let's Encrypt (Free SSL)
Recommended for most production deployments.

#### Installation
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### Obtain Certificate
```bash
# Single domain
sudo certbot --nginx -d api.yourdomain.com

# Multiple domains
sudo certbot --nginx -d api.yourdomain.com -d www.yourdomain.com

# Standalone mode (if not using Nginx)
sudo certbot certonly --standalone -d api.yourdomain.com
```

#### Auto-Renewal
Certbot automatically sets up auto-renewal. Verify with:
```bash
sudo certbot renew --dry-run
```

### 2. Commercial SSL Certificates
For enterprise deployments requiring extended validation.

#### Generate CSR
```bash
# Generate private key
sudo openssl genrsa -out /etc/ssl/private/gothic-vault-api.key 4096

# Generate CSR
sudo openssl req -new -key /etc/ssl/private/gothic-vault-api.key \
    -out /etc/ssl/certs/gothic-vault-api.csr \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=api.yourdomain.com"
```

#### Submit CSR
Submit the CSR to your SSL provider (DigiCert, Comodo, etc.) and download the certificate.

#### Install Certificate
```bash
# Place certificate
sudo cp your-certificate.crt /etc/ssl/certs/gothic-vault-api.crt

# Place intermediate chain (if provided)
sudo cat intermediate.crt >> /etc/ssl/certs/gothic-vault-api.crt
```

### 3. Self-Signed Certificate (Development Only)
For local development or internal testing.

```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
    -keyout /etc/ssl/private/gothic-vault-api.key \
    -out /etc/ssl/certs/gothic-vault-api.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Nginx SSL Configuration

### Update nginx.conf
Uncomment the HTTPS server block in `nginx.conf` and update paths:

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/ssl/certs/gothic-vault-api.crt;
    ssl_certificate_key /etc/ssl/private/gothic-vault-api.key;

    # SSL protocols
    ssl_protocols TLSv1.2 TLSv1.3;

    # SSL ciphers (strong configuration)
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:
                ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:
                ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;

    # SSL session
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/ssl/certs/chain.pem;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Include location blocks from HTTP server
    # ...
}
```

### Test Configuration
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Configuration for Fastify

### Backend SSL (Optional)
If you want to run the Fastify backend with SSL directly:

```typescript
import Fastify from 'fastify';
import fs from 'fs';

const fastify = Fastify({
  https: {
    key: fs.readFileSync('/path/to/private-key.pem'),
    cert: fs.readFileSync('/path/to/certificate.pem'),
  },
});
```

## SSL Verification

### Check Certificate
```bash
# Check certificate details
openssl x509 -in /etc/ssl/certs/gothic-vault-api.crt -text -noout

# Check certificate expiry
openssl x509 -in /etc/ssl/certs/gothic-vault-api.crt -noout -dates

# Verify certificate chain
openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com
```

### SSL Test Tools
- [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)
- [SSL Checker](https://www.sslshopper.com/ssl-checker.html)
- [HTBridge SSL Check](https://www.htbridge.com/ssl/)

## Security Best Practices

### 1. Use Strong Ciphers
- Only allow TLS 1.2 and 1.3
- Disable weak ciphers (RC4, DES, 3DES, MD5)
- Use ECDHE for perfect forward secrecy

### 2. Enable HSTS
Force HTTPS connections:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### 3. OCSP Stapling
Improve SSL handshake performance:
```nginx
ssl_stapling on;
ssl_stapling_verify on;
```

### 4. Certificate Management
- Monitor certificate expiry
- Set up auto-renewal
- Keep private keys secure (chmod 600)
- Never commit certificates to version control

### 5. HTTP to HTTPS Redirect
Always redirect HTTP to HTTPS:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Docker SSL Configuration

### Using Let's Encrypt with Docker
```yaml
  certbot:
    image: certbot/certbot
    volumes:
      - ./ssl/certs:/etc/letsencrypt/live/api.yourdomain.com
      - ./ssl/keys:/etc/letsencrypt/archive/api.yourdomain.com
    command: certonly --standalone -d api.yourdomain.com --email your@email.com --agree-tos

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl/certs:/etc/ssl/certs
      - ./ssl/keys:/etc/ssl/private
    ports:
      - '80:80'
      - '443:443'
    depends_on:
      - certbot
```

### Using Custom SSL with Docker
```yaml
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl/certs:/etc/ssl/certs:ro
      - ./ssl/keys:/etc/ssl/private:ro
    ports:
      - '80:80'
      - '443:443'
```

## Troubleshooting

### Certificate Expired
```bash
# Renew certificate
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal
```

### Mixed Content Errors
Ensure all resources are loaded via HTTPS:
- Update API base URL in frontend
- Update CDN URLs
- Update image URLs

### SSL Handshake Errors
```bash
# Check SSL configuration
sudo nginx -t

# Check certificate chain
openssl s_client -connect api.yourdomain.com:443 -showcerts
```

### Port 443 Blocked
```bash
# Check firewall
sudo ufw status
sudo ufw allow 443/tcp

# Check if port is listening
sudo netstat -tlnp | grep :443
```

## Environment Variables
Add to your `.env` file:
```bash
# Force HTTPS in production
NODE_ENV=production
FORCE_HTTPS=true
```

## Frontend SSL Configuration
Update frontend environment variables:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Monitoring
Set up monitoring for:
- Certificate expiry alerts
- SSL handshake failures
- Mixed content warnings
- HSTS preload status
