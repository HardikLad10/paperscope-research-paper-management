# Backend API Dockerfile for Cloud Run
FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (include dev deps for now, can optimize later)
RUN npm ci

# Copy application code
COPY . .

# Cloud Run sets PORT environment variable
ENV PORT=8080
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use the entry point that Cloud Run expects
CMD ["node", "index.js"]

