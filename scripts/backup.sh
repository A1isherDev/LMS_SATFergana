#!/bin/bash

# Database Backup Script for SAT LMS
# Backs up PostgreSQL database and media files

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="sat_lms_db_${DATE}.sql"
MEDIA_BACKUP_FILE="sat_lms_media_${DATE}.tar.gz"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting backup process...${NC}"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Load environment variables
source .env.production

# Backup database
echo -e "${YELLOW}Backing up database...${NC}"
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U ${DB_USER} ${DB_NAME} > ${BACKUP_DIR}/${DB_BACKUP_FILE}

# Compress database backup
gzip ${BACKUP_DIR}/${DB_BACKUP_FILE}

echo -e "${GREEN}Database backup completed: ${DB_BACKUP_FILE}.gz${NC}"

# Backup media files
echo -e "${YELLOW}Backing up media files...${NC}"
tar -czf ${BACKUP_DIR}/${MEDIA_BACKUP_FILE} -C . media/

echo -e "${GREEN}Media backup completed: ${MEDIA_BACKUP_FILE}${NC}"

# Remove old backups
echo -e "${YELLOW}Removing backups older than ${RETENTION_DAYS} days...${NC}"
find ${BACKUP_DIR} -name "sat_lms_*" -type f -mtime +${RETENTION_DAYS} -delete

echo -e "${GREEN}Backup process completed successfully!${NC}"
echo -e "Database backup: ${BACKUP_DIR}/${DB_BACKUP_FILE}.gz"
echo -e "Media backup: ${BACKUP_DIR}/${MEDIA_BACKUP_FILE}"

# Optional: Upload to cloud storage (AWS S3, etc.)
# aws s3 cp ${BACKUP_DIR}/${DB_BACKUP_FILE}.gz s3://your-bucket/backups/
# aws s3 cp ${BACKUP_DIR}/${MEDIA_BACKUP_FILE} s3://your-bucket/backups/
