# PostgreSQL Production Configuration Guide

## Overview
This guide provides recommendations for configuring PostgreSQL for production deployment of the Gothic Vault e-commerce platform.

## Docker Compose Configuration
The `docker-compose.yml` already includes PostgreSQL with:
- Health checks
- Persistent volumes
- Environment variable configuration
- Network isolation

## Production Recommendations

### 1. Connection Pooling
Use a connection pooler like PgBouncer for high-traffic deployments:
```yaml
  pgbouncer:
    image: edoburu/pgbouncer:latest
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_DBNAME: gothic_vault
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 25
    depends_on:
      - postgres
```

### 2. PostgreSQL Tuning Parameters
Add to PostgreSQL configuration (`postgresql.conf`):

```ini
# Memory Settings
shared_buffers = 256MB              # 25% of RAM
effective_cache_size = 1GB          # 50-75% of RAM
work_mem = 16MB                     # Per operation
maintenance_work_mem = 64MB

# WAL Settings
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9

# Query Performance
random_page_cost = 1.1              # For SSD storage
effective_io_concurrency = 200      # For SSD storage

# Connection Settings
max_connections = 100
```

### 3. Backup Strategy
Implement automated backups:
```bash
# Daily backup
docker exec gothic-vault-postgres pg_dump -U postgres gothic_vault > backup_$(date +%Y%m%d).sql

# Compressed backup
docker exec gothic-vault-postgres pg_dump -U postgres gothic_vault | gzip > backup_$(date +%Y%m%d).sql.gz
```

### 4. Monitoring
Enable PostgreSQL monitoring:
- Install `pg_stat_statements` extension
- Monitor connection counts
- Track slow queries
- Monitor disk usage and WAL size

### 5. Security
- Use strong passwords (minimum 32 characters)
- Restrict network access (use internal networks)
- Enable SSL connections
- Regular security updates
- Enable row-level security for sensitive data

### 6. High Availability
For production, consider:
- PostgreSQL streaming replication
- Patroni for automatic failover
- Read replicas for reporting

## Environment Variables
Required environment variables for production:
```bash
POSTGRES_USER=your_secure_user
POSTGRES_PASSWORD=your_secure_password_32_chars_min
POSTGRES_DB=gothic_vault
POSTGRES_PORT=5432
```

## Migration Commands
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (destructive)
npx prisma migrate reset
```

## Performance Tips
1. Add indexes to frequently queried columns
2. Use connection pooling in application
3. Monitor query performance with `EXPLAIN ANALYZE`
4. Regular vacuum and analyze (autovacuum is enabled by default)
5. Archive old data to improve performance
