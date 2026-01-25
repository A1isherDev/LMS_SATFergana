# SAT Fergana Platform - Docker Setup

This Docker setup allows you to run the entire SAT Fergana platform (backend + frontend + database + redis) with a single command.

## 🐳 Services Included

- **PostgreSQL Database**: Primary data storage
- **Redis**: Message broker for Celery tasks
- **Django Backend**: API server at http://localhost:8000
- **Celery Worker**: Background task processing
- **Celery Beat**: Scheduled task management
- **Next.js Frontend**: Web application at http://localhost:3000

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Docker Compose installed

### 1. Clone and Navigate
```bash
cd d:\SAT_Fergana
```

### 2. Start All Services
```bash
docker-compose up --build
```

### 3. Create Superuser (in new terminal)
```bash
docker-compose exec backend python manage.py createsuperuser
```

### 4. Access Applications
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin

## 📋 Available Commands

### Development Mode (with hot reload)
```bash
docker-compose up --build
```

### Production Mode
```bash
docker-compose -f docker-compose.yml up --build
```

### Stop All Services
```bash
docker-compose down
```

### Stop and Remove Volumes
```bash
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Run Management Commands
```bash
# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Run migrations
docker-compose exec backend python manage.py migrate

# Collect static files
docker-compose exec backend python manage.py collectstatic

# Django shell
docker-compose exec backend python manage.py shell
```

## 🔧 Configuration

### Environment Variables
The setup uses the following environment variables (configured in docker-compose.yml):

**Backend:**
- `DEBUG=True` (development mode)
- `SECRET_KEY`: Django secret key
- `DB_*`: Database connection settings
- `CELERY_*`: Redis/Celery settings
- `CORS_ALLOWED_ORIGINS`: Frontend URLs

**Frontend:**
- `NEXT_PUBLIC_API_URL`: Backend API URL

### Database
- **Type**: PostgreSQL 15
- **Host**: `db` (Docker service name)
- **Port**: 5432
- **Database**: `sat_lms`
- **User**: `postgres`
- **Password**: `postgres`

### Redis
- **Host**: `redis` (Docker service name)
- **Port**: 6379
- **Used for**: Celery task queue

## 📁 Project Structure

```
d:\SAT_Fergana\
├── Dockerfile                 # Backend Docker image
├── docker-compose.yml         # Main orchestration file
├── docker-compose.override.yml # Development overrides
├── .dockerignore             # Files to exclude from Docker build
├── config\                   # Django backend
│   ├── Dockerfile (inherited)
│   ├── init.sql             # Database initialization
│   └── ...
├── frontend\                 # Next.js frontend
│   ├── Dockerfile           # Frontend Docker image
│   ├── .dockerignore       # Frontend exclude files
│   └── ...
└── requirements.txt         # Python dependencies
```

## 🛠️ Troubleshooting

### Port Conflicts
If ports 3000, 5432, 6379, or 8000 are already in use:
1. Stop the conflicting services
2. Or modify the ports in docker-compose.yml

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up --build
```

### Frontend Build Issues
```bash
# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up frontend
```

### Backend Issues
```bash
# Rebuild backend
docker-compose build --no-cache backend
docker-compose up backend
```

### Permission Issues (Linux/Mac)
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

## 🎯 Default Credentials

After creating a superuser:
- **Admin Email**: admin@satfergana.com
- **Admin Password**: Admin123!

## 📊 Service Health

The setup includes health checks for:
- PostgreSQL: `pg_isready -U postgres`
- Redis: `redis-cli ping`

Services will wait for dependencies to be healthy before starting.

## 🔄 Development Workflow

1. **Make changes** to code
2. **Frontend**: Hot reload automatically (development mode)
3. **Backend**: Manual restart needed for some changes
4. **Database**: Migrations run automatically on startup

## 🚀 Production Deployment

For production:
1. Update environment variables (set `DEBUG=False`)
2. Use proper secrets
3. Configure SSL certificates
4. Set up proper backups
5. Use production-grade database

## 📝 Notes

- Data persists in Docker volumes
- Static files are collected automatically
- Media files are stored in dedicated volume
- Logs are available via `docker-compose logs`
- All services are on the same Docker network
