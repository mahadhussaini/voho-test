# Use Node.js 18 LTS Alpine for smaller image size
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production && npm cache clean --force

# Copy application code (after dependencies to leverage Docker layer caching)
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S voho -u 1001 && \
    chown -R voho:nodejs /app

# Switch to non-root user
USER voho

# Expose port
EXPOSE 10000

# Health check using curl (more reliable than custom script)
# Give 60 seconds for app to start, check every 30 seconds, allow 15 seconds for response
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
  CMD curl -f --max-time 10 http://localhost:10000/api/health || exit 1

# Start the application with proper initialization
CMD ["node", "startup.js"]
