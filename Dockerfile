# Backend API Dockerfile for Cloud Run (from root)
FROM node:22-slim

WORKDIR /app

# Copy package files from root
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code (server.js and any other needed files from root)
COPY server.js ./
# Copy any other files server.js might need (if any)
# COPY *.js ./

# Cloud Run sets PORT environment variable
ENV PORT=8080
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use server.js from root (matches local setup)
CMD ["node", "server.js"]

