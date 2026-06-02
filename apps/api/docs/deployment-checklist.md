# Deployment Checklist

## Pre-Deployment Checklist

### Code Preparation
- [ ] All code changes committed to version control
- [ ] Version tag created (e.g., v1.0.0)
- [ ] Changelog updated
- [ ] Code reviewed and approved
- [ ] No console.log or debug statements in production code
- [ ] Environment variables documented
- [ ] Dependencies updated to latest stable versions
- [ ] Security vulnerabilities scanned and fixed

### Database Preparation
- [ ] Database migrations tested in staging
- [ ] Database backup created before migration
- [ ] Prisma migrations generated
- [ ] Prisma client generated
- [ ] Database indexes verified
- [ ] Database connection strings updated
- [ ] Database user permissions configured

### Environment Configuration
- [ ] Production environment variables set
- [ ] `.env` file created with production values
- [ ] JWT_SECRET changed from default (minimum 32 characters)
- [ ] COOKIE_SECRET changed from default (minimum 32 characters)
- [ ] CORS_ORIGIN set to production domain
- [ ] DATABASE_URL configured with production credentials
- [ ] REDIS_URL configured (if using Redis)
- [ ] NODE_ENV set to `production`
- [ ] LOG_LEVEL set appropriately (warn or error for production)

### Security Configuration
- [ ] Security headers configured (@fastify/helmet)
- [ ] CORS configuration hardened
- [ ] Rate limits configured and tested
- [ ] Upload validation implemented
- [ ] Request validation implemented
- [ ] Error handling centralized
- [ ] SSL/TLS certificates obtained
- [ ] HTTPS enforced
- [ ] HSTS enabled

## Deployment Steps

### 1. Server Preparation
- [ ] Server provisioned (AWS, DigitalOcean, etc.)
- [ ] Operating system updated
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Nginx installed (if using reverse proxy)
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] SSH keys configured
- [ ] Non-root user created for application
- [ ] File permissions set correctly

### 2. Application Deployment
- [ ] Code deployed to server (git pull or CI/CD)
- [ ] Dependencies installed (`npm ci --only=production`)
- [ ] Application built (`npm run build`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] Uploads directory created with proper permissions
- [ ] Static assets optimized

### 3. Docker Deployment (if using Docker)
- [ ] Docker image built
- [ ] Docker image pushed to registry
- [ ] docker-compose.yml updated with production values
- [ ] Docker containers started
- [ ] Container health checks verified
- [ ] Docker volumes configured for persistence
- [ ] Docker networks configured

### 4. Database Deployment
- [ ] PostgreSQL container/service started
- [ ] PostgreSQL health check passing
- [ ] Database migrations applied
- [ ] Seed data applied (if needed)
- [ ] Database backup scheduled
- [ ] Database monitoring configured

### 5. Redis Deployment (if using Redis)
- [ ] Redis container/service started
- [ ] Redis health check passing
- [ ] Redis persistence configured
- [ ] Redis memory limits set
- [ ] Redis monitoring configured

### 6. Nginx Configuration (if using Nginx)
- [ ] Nginx configuration file deployed
- [ ] SSL certificates installed
- [ ] HTTP to HTTPS redirect configured
- [ ] Reverse proxy configured
- [ ] Rate limiting configured
- [ ] Security headers configured
- [ ] Gzip compression enabled
- [ ] Static file serving configured
- [ ] Nginx tested and reloaded

### 7. Process Manager Setup
- [ ] PM2 installed and configured (if using PM2)
- [ ] systemd service created (if using systemd)
- [ ] Application started with process manager
- [ ] Auto-restart configured
- [ ] Log rotation configured
- [ ] Process monitoring configured

## Post-Deployment Checklist

### Verification
- [ ] Health check endpoint responding
- [ ] API endpoints accessible
- [ ] Database connectivity verified
- [ ] Redis connectivity verified (if using Redis)
- [ ] File uploads working
- [ ] Authentication working
- [ ] Authorization working
- [ ] CORS working correctly
- [ ] Rate limiting working
- [ ] Error logging working
- [ ] Application logs accessible

### Testing
- [ ] Smoke tests passed
- [ ] Integration tests passed
- [ ] API endpoint tests passed
- [ ] Authentication flow tested
- [ ] Checkout flow tested
- [ ] Order creation tested
- [ ] File upload tested
- [ ] Admin functions tested
- [ ] Performance tests passed
- [ ] Load tests passed

### Monitoring Setup
- [ ] Application monitoring configured (PM2, systemd)
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Log aggregation configured (ELK, etc.)
- [ ] Performance monitoring configured (Datadog, New Relic)
- [ ] Uptime monitoring configured
- [ ] Database monitoring configured
- [ ] Redis monitoring configured (if using Redis)
- [ ] Server resource monitoring configured
- [ ] Alert notifications configured

### Backup Setup
- [ ] Database backup scheduled
- [ ] File backup scheduled (uploads)
- [ ] Configuration backup scheduled
- [ ] Backup retention policy set
- [ ] Backup restoration tested
- [ ] Offsite backup configured

### Security Verification
- [ ] SSL certificate valid
- [ ] HTTPS working correctly
- [ ] Security headers present
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] No exposed debug endpoints
- [ ] No default credentials
- [ ] Firewall rules verified
- [ ] SSH access secured
- [ ] File permissions correct

### Documentation
- [ ] Deployment documented
- [ ] Runbook created
- [ ] Onboarding documentation updated
- [ ] API documentation updated
- [ ] Architecture diagrams updated
- [ ] Contact information documented

## Rollback Plan
- [ ] Rollback procedure documented
- [ ] Previous version backup available
- [ ] Database rollback procedure tested
- [ ] Rollback tested in staging
- [ ] Team notified of rollback procedure

## Performance Optimization
- [ ] CDN configured for static assets
- [ ] Image optimization implemented
- [ ] Database queries optimized
- [ ] Caching strategy implemented
- [ ] Compression enabled
- [ ] HTTP/2 enabled
- [ ] Keep-alive configured
- [ ] Connection pooling configured

## Final Checks
- [ ] All services running
- [ ] All health checks passing
- [ ] No errors in logs
- [ ] Performance metrics acceptable
- [ ] Security scan passed
- [ ] Stakeholder sign-off obtained
- [ ] Deployment announcement sent
- [ ] Monitoring team notified

## Ongoing Maintenance
- [ ] Regular security updates scheduled
- [ ] Dependency updates scheduled
- [ ] Database maintenance scheduled
- [ ] Log rotation configured
- [ ] Disk space monitoring configured
- [ ] Certificate renewal automated
- [ ] Backup verification scheduled
- [ ] Performance review scheduled

## Emergency Contacts
- [ ] Primary contact: _______________
- [ ] Secondary contact: _______________
- [ ] Database admin: _______________
- [ ] DevOps contact: _______________
- [ ] Security contact: _______________

## Deployment Notes
- Date: _______________
- Time: _______________
- Deployed by: _______________
- Version: _______________
- Issues encountered: _______________
- Resolution: _______________
