#!/bin/bash

# SAT LMS Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "========================================="
echo "SAT LMS Platform - Deployment Script"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    print_info "Please copy .env.production.example to .env.production and configure it"
    exit 1
fi

# Validate required environment variables
print_info "Validating environment variables..."
source .env.production

required_vars=("SECRET_KEY" "DB_NAME" "DB_USER" "DB_PASSWORD" "ALLOWED_HOSTS")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set"
        exit 1
    fi
done

# Check if SECRET_KEY is still the default
if [[ "$SECRET_KEY" == *"CHANGE_THIS"* ]]; then
    print_error "SECRET_KEY is still set to default value. Please change it!"
    exit 1
fi

print_info "Environment validation passed ✓"

# Pull latest changes (optional, uncomment if using git)
# print_info "Pulling latest changes from git..."
# git pull origin main

# Build Docker images
print_info "Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop existing containers
print_info "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Start services
print_info "Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for database to be ready
print_info "Waiting for database to be ready..."
sleep 10

# Run migrations
print_info "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate

# Collect static files
print_info "Collecting static files..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

# Create superuser (optional, only on first deployment)
# print_info "Creating superuser..."
# docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Health check
print_info "Performing health check..."
sleep 5

if curl -f http://localhost/api/ > /dev/null 2>&1; then
    print_info "Health check passed ✓"
else
    print_warning "Health check failed. Please check the logs."
fi

# Show running containers
print_info "Running containers:"
docker-compose -f docker-compose.prod.yml ps

echo ""
print_info "========================================="
print_info "Deployment completed successfully! ✓"
print_info "========================================="
print_info "Backend API: http://localhost/api/"
print_info "Frontend: http://localhost/"
print_info "Admin Panel: http://localhost/admin/"
echo ""
print_info "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
print_info "To stop services: docker-compose -f docker-compose.prod.yml down"
