# Use Node.js 18 Alpine image
FROM node:18-alpine

# Install curl for health check
RUN apk add --no-cache curl

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy frontend code
COPY . .

# Build the application
RUN npm run build

# Install only production dependencies for runtime
RUN npm ci --only=production && npm cache clean --force

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start the application
CMD ["npm", "start"]
