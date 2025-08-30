# Docker Deployment Guide

## Quick Start with Docker Compose

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/web-terminal.git
cd web-terminal
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env file with your settings
```

### 3. Build and run
```bash
# Development mode
docker-compose up --build

# Production mode (with nginx)
docker-compose --profile production up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Docker Compose Services

### web-terminal (Main Service)
- **Ports**: 3000 (API/Frontend), 8081-8100 (GoTTY sessions)
- **Volumes**: 
  - `./data`: Persistent database storage
  - `~/.ssh`: Optional SSH keys mounting
  - `./scripts`: Custom scripts
  - `./config`: Custom configurations

### nginx (Production Profile)
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Purpose**: Reverse proxy, SSL termination, caching, rate limiting

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| NODE_ENV | production | Node environment |
| PORT | 3000 | Backend server port |
| MAX_SESSIONS | 20 | Maximum concurrent sessions |
| SESSION_SECRET | change-me | Session encryption secret |
| CLEANUP_INTERVAL | 3600000 | Cleanup interval (ms) |
| STALE_SESSION_HOURS | 24 | Hours before session is stale |
| LOG_LEVEL | info | Logging level |

## Volume Mounts

### Data Persistence
```yaml
volumes:
  - ./data:/app/data  # SQLite database
```

### SSH Keys (Optional)
```yaml
volumes:
  - ~/.ssh:/home/nodejs/.ssh:ro  # Read-only SSH keys
```

### Custom Scripts
```yaml
volumes:
  - ./scripts:/app/custom-scripts:ro
```

## Resource Limits

Default limits (adjustable in docker-compose.yml):
- **CPU**: 2 cores max, 0.5 core reserved
- **Memory**: 2GB max, 512MB reserved

## Health Checks

The container includes health checks:
- **Endpoint**: `/api/health`
- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3

## SSL/TLS Configuration

For production with SSL:

1. Place certificates in `nginx/ssl/`:
   ```bash
   mkdir -p nginx/ssl
   cp /path/to/cert.pem nginx/ssl/
   cp /path/to/key.pem nginx/ssl/
   ```

2. Update nginx configuration:
   - Uncomment SSL sections in `nginx/conf.d/web-terminal.conf`
   - Update server_name with your domain

3. Run with production profile:
   ```bash
   docker-compose --profile production up -d
   ```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs web-terminal

# Verify ports are available
lsof -i :3000
lsof -i :8081-8100
```

### Database issues
```bash
# Reset database
rm -rf ./data/sessions.db
docker-compose restart web-terminal
```

### Permission issues
```bash
# Fix volume permissions
sudo chown -R 1001:1001 ./data
```

### Network issues
```bash
# Recreate network
docker-compose down
docker network prune
docker-compose up
```

## Backup and Restore

### Backup
```bash
# Backup database
docker-compose exec web-terminal sqlite3 /app/data/sessions.db .dump > backup.sql

# Backup entire data directory
tar -czf web-terminal-backup.tar.gz ./data
```

### Restore
```bash
# Restore database
cat backup.sql | docker-compose exec -T web-terminal sqlite3 /app/data/sessions.db

# Restore data directory
tar -xzf web-terminal-backup.tar.gz
```

## Monitoring

### View real-time logs
```bash
docker-compose logs -f web-terminal
```

### Monitor resource usage
```bash
docker stats web-terminal
```

### Check health status
```bash
curl http://localhost:3000/api/health
```

## Security Considerations

1. **Change default secrets**: Always modify SESSION_SECRET in production
2. **Use HTTPS**: Enable SSL/TLS in production environments
3. **Firewall rules**: Restrict access to GoTTY ports (8081-8100)
4. **Regular updates**: Keep Docker images and dependencies updated
5. **Resource limits**: Set appropriate CPU/memory limits
6. **Network isolation**: Use Docker networks for service communication

## Scaling

For multiple instances:
```yaml
# docker-compose.override.yml
services:
  web-terminal:
    deploy:
      replicas: 3
```

Note: Requires Docker Swarm or Kubernetes for proper orchestration.