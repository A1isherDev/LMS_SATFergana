# SAT LMS Platform - Deployment Guide

This guide provides comprehensive instructions for deploying the SAT-focused Learning Management System to production.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Production Deployment](#production-deployment)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Environment Configuration](#environment-configuration)
- [Database Management](#database-management)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Git** for version control
- **Domain name** (for production with SSL)
- **PostgreSQL** 15+ (if not using Docker)
- **Redis** 7+ (if not using Docker)

### System Requirements
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum
- **OS**: Linux (Ubuntu 20.04+), macOS, or Windows with WSL2

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd LMS_SATFergana
```

### 2. Configure Environment
```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with your configuration
nano .env.production
```

**Critical Settings to Change:**
- `SECRET_KEY`: Generate a secure random string
- `DB_PASSWORD`: Set a strong database password
- `ALLOWED_HOSTS`: Add your domain name
- `NEXT_PUBLIC_API_URL`: Set to your domain's API URL

### 3. Deploy
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The deployment script will:
- Validate environment variables
- Build Docker images
- Start all services
- Run database migrations
- Collect static files
- Perform health checks

### 4. Create Superuser
```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### 5. Access the Application
- **Frontend**: `http://your-domain.com`
- **API**: `http://your-domain.com/api/`
- **Admin Panel**: `http://your-domain.com/admin/`

## Production Deployment

### Architecture Overview
```
┌─────────────┐
│   Nginx     │  (Port 80/443)
│  (Reverse   │
│   Proxy)    │
└──────┬──────┘
       │
       ├──────────┬──────────────┬──────────────┐
       │          │              │              │
   ┌───▼───┐  ┌──▼───┐     ┌────▼────┐   ┌────▼────┐
   │Django │  │Next.js│     │Celery   │   │Celery   │
   │Backend│  │Frontend│    │Worker   │   │Beat     │
   └───┬───┘  └──────┘     └────┬────┘   └────┬────┘
       │                         │             │
       ├─────────────────────────┴─────────────┘
       │                         │
   ┌───▼──────┐          ┌──────▼─────┐
   │PostgreSQL│          │   Redis    │
   │ Database │          │            │
   └──────────┘          └────────────┘
```

### Docker Services

#### Backend (Django + Gunicorn)
- **Container**: `sat_fergana_backend_prod`
- **Port**: Internal 8000
- **Workers**: 4 Gunicorn workers
- **Health Check**: `/api/` endpoint

#### Frontend (Next.js)
- **Container**: `sat_fergana_frontend_prod`
- **Port**: Internal 3000
- **Build**: Standalone output for optimal performance

#### Database (PostgreSQL)
- **Container**: `sat_fergana_db_prod`
- **Port**: 5432 (internal only)
- **Persistence**: `postgres_data` volume

#### Cache/Queue (Redis)
- **Container**: `sat_fergana_redis_prod`
- **Port**: 6379 (internal only)
- **Persistence**: `redis_data` volume with AOF

#### Nginx
- **Container**: `sat_fergana_nginx_prod`
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Features**: Reverse proxy, static file serving, SSL termination, rate limiting

## SSL/HTTPS Setup

### Option 1: Let's Encrypt (Recommended)

#### Install Certbot
```bash
sudo apt-get update
sudo apt-get install certbot
```

#### Generate Certificate
```bash
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

#### Copy Certificates
```bash
# Create SSL directory
mkdir -p ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
```

#### Auto-Renewal
```bash
# Add to crontab
sudo crontab -e

# Add this line for automatic renewal
0 0 * * * certbot renew --quiet && docker-compose -f docker-compose.prod.yml restart nginx
```

### Option 2: Self-Signed Certificate (Development Only)
```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem \
  -out ssl/fullchain.pem
```

## Environment Configuration

### Required Environment Variables

#### Django Settings
```bash
SECRET_KEY=<generate-with-python-secrets>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

#### Database
```bash
DB_NAME=sat_lms_prod
DB_USER=sat_lms_user
DB_PASSWORD=<strong-password>
DB_HOST=db
DB_PORT=5432
```

#### Celery/Redis
```bash
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

#### Frontend
```bash
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

### Generating SECRET_KEY
```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Database Management

### Migrations
```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create migration
docker-compose -f docker-compose.prod.yml exec backend python manage.py makemigrations

# Show migration status
docker-compose -f docker-compose.prod.yml exec backend python manage.py showmigrations
```

### Database Backup
```bash
# Manual backup
./scripts/backup.sh

# Automated daily backup (add to crontab)
0 2 * * * /path/to/LMS_SATFergana/scripts/backup.sh
```

### Database Restore
```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore database
gunzip < /backups/sat_lms_db_YYYYMMDD_HHMMSS.sql.gz | \
  docker-compose -f docker-compose.prod.yml exec -T db psql -U sat_lms_user sat_lms_prod

# Restore media files
tar -xzf /backups/sat_lms_media_YYYYMMDD_HHMMSS.tar.gz

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring & Logging

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f celery_worker
```

### Health Checks
```bash
# Run health check script
./scripts/health_check.sh

# Manual checks
curl http://localhost/api/
docker-compose -f docker-compose.prod.yml ps
```

### Resource Monitoring
```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Backup & Recovery

### Automated Backups
The `scripts/backup.sh` script backs up:
- PostgreSQL database (compressed SQL dump)
- Media files (tar.gz archive)
- Retention: 30 days

### Backup to Cloud Storage (Optional)
Add to `scripts/backup.sh`:
```bash
# AWS S3
aws s3 cp ${BACKUP_DIR}/${DB_BACKUP_FILE}.gz s3://your-bucket/backups/
aws s3 cp ${BACKUP_DIR}/${MEDIA_BACKUP_FILE} s3://your-bucket/backups/
```

## Troubleshooting

### Common Issues

#### 1. Containers Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Rebuild images
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

#### 2. Database Connection Errors
```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps db

# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Verify environment variables
docker-compose -f docker-compose.prod.yml exec backend env | grep DB_
```

#### 3. Static Files Not Loading
```bash
# Collect static files
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Check nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

#### 4. Celery Tasks Not Running
```bash
# Check Celery worker status
docker-compose -f docker-compose.prod.yml logs celery_worker

# Restart Celery services
docker-compose -f docker-compose.prod.yml restart celery_worker celery_beat
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Run inside PostgreSQL
VACUUM ANALYZE;
REINDEX DATABASE sat_lms_prod;
```

#### 2. Redis Memory Management
```bash
# Check Redis memory
docker-compose -f docker-compose.prod.yml exec redis redis-cli INFO memory

# Clear cache if needed
docker-compose -f docker-compose.prod.yml exec redis redis-cli FLUSHDB
```

#### 3. Docker Cleanup
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full system cleanup
docker system prune -a --volumes
```

## Security Checklist

- [ ] Changed `SECRET_KEY` from default
- [ ] Set `DEBUG=False`
- [ ] Configured `ALLOWED_HOSTS`
- [ ] Set strong database password
- [ ] Enabled HTTPS/SSL
- [ ] Configured security headers in Nginx
- [ ] Set up automated backups
- [ ] Configured firewall rules
- [ ] Enabled rate limiting
- [ ] Regular security updates

## Maintenance

### Regular Tasks
- **Daily**: Check logs for errors
- **Weekly**: Review backup integrity
- **Monthly**: Update dependencies
- **Quarterly**: Security audit

### Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./deploy.sh
```

## Support

For issues or questions:
- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- Run health check: `./scripts/health_check.sh`
- Review this documentation
- Contact system administrator
