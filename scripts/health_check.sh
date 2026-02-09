#!/bin/bash

# Health Check Script for SAT LMS
# Monitors the health of all services

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check service health
check_service() {
    local service_name=$1
    local check_command=$2
    
    if eval $check_command > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service_name is healthy"
        return 0
    else
        echo -e "${RED}✗${NC} $service_name is unhealthy"
        return 1
    fi
}

echo "========================================="
echo "SAT LMS Platform - Health Check"
echo "========================================="

# Check if Docker is running
check_service "Docker" "docker info"

# Check if containers are running
echo ""
echo "Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "Service Health Checks:"

# Check database
check_service "PostgreSQL Database" "docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U postgres"

# Check Redis
check_service "Redis" "docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping"

# Check backend API
check_service "Backend API" "curl -f http://localhost/api/"

# Check frontend
check_service "Frontend" "curl -f http://localhost/"

# Check Celery worker
check_service "Celery Worker" "docker-compose -f docker-compose.prod.yml exec -T celery_worker celery -A config inspect ping"

# Check Celery beat
check_service "Celery Beat" "docker-compose -f docker-compose.prod.yml ps celery_beat | grep -q Up"

echo ""
echo "========================================="
echo "Health check completed"
echo "========================================="
