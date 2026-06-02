# Redis Production Configuration Guide

## Overview
This guide provides recommendations for configuring Redis for production deployment of the Gothic Vault e-commerce platform.

## Docker Compose Configuration
The `docker-compose.yml` already includes Redis with:
- Health checks
- Persistent volumes
- Environment variable configuration
- Network isolation

## Production Recommendations

### 1. Redis Configuration
Add to Redis configuration (`redis.conf`):

```ini
# Memory Management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Security
requirepass your_strong_password_here
protected-mode yes

# Performance
tcp-keepalive 300
tcp-backlog 511

# Logging
loglevel notice
logfile /var/log/redis/redis.log
```

### 2. Security
- Enable password authentication (`requirepass`)
- Use protected mode
- Restrict network access (use internal networks)
- Disable dangerous commands (CONFIG, FLUSHDB, etc.)
- Use TLS for connections in production

### 3. Persistence Strategy
Choose based on use case:
- **RDB (Snapshot)**: Good for backup, faster restart
- **AOF (Append Only File)**: Better durability, slower restart
- **Hybrid**: Both RDB and AOF for maximum durability

For e-commerce, use AOF with `appendfsync everysec` for balance between performance and durability.

### 4. Memory Management
Set appropriate `maxmemory` and eviction policy:
- `allkeys-lru`: Evict least recently used keys
- `volatile-lru`: Evict LRU among keys with expiry
- `allkeys-random`: Evict random keys

For session caching, use `allkeys-lru`.

### 5. Monitoring
Monitor these metrics:
- Memory usage
- Hit/miss ratio
- Connected clients
- Operations per second
- Blocked clients
- Slow log

### 6. High Availability
For production, consider:
- Redis Sentinel for automatic failover
- Redis Cluster for horizontal scaling
- Multiple Redis instances for different use cases (sessions, cache, queues)

### 7. Backup Strategy
```bash
# Manual backup
docker exec gothic-vault-redis redis-cli BGSAVE

# Copy RDB file
docker cp gothic-vault-redis:/data/dump.rdb backup_$(date +%Y%m%d).rdb

# Copy AOF file
docker cp gothic-vault-redis:/data/appendonly.aof backup_$(date +%Y%m%d).aof
```

## Environment Variables
Required environment variables for production:
```bash
REDIS_URL=redis://:password@redis:6379
REDIS_PORT=6379
```

## Usage in Application
```typescript
// Using ioredis or redis client
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: false,
});

// For session storage
redis.setex(`session:${sessionId}`, 3600, JSON.stringify(sessionData));

// For caching
redis.setex(`product:${productId}`, 300, JSON.stringify(productData));
```

## Performance Tips
1. Use connection pooling
2. Pipeline multiple commands
3. Use appropriate TTL for cached data
4. Monitor memory usage and eviction
5. Use Redis clustering for large datasets
6. Avoid storing large objects (>1MB)
7. Use appropriate data structures (hashes, sets, lists)

## Common Use Cases for E-commerce
- **Session Storage**: User sessions with TTL
- **Cache**: Product data, categories, settings
- **Rate Limiting**: API rate limiting counters
- **Cart Storage**: Temporary cart data
- **Queue**: Order processing, email sending

## Troubleshooting
```bash
# Check Redis status
docker exec gothic-vault-redis redis-cli ping

# Monitor Redis
docker exec gothic-vault-redis redis-cli MONITOR

# Check memory usage
docker exec gothic-vault-redis redis-cli INFO memory

# Check slow log
docker exec gothic-vault-redis redis-cli SLOWLOG GET 10

# Flush all data (use with caution)
docker exec gothic-vault-redis redis-cli FLUSHALL
```
