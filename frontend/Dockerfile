# Frontend Dockerfile for Cloud Run
FROM node:22-slim as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code (including .env.production if it exists)
COPY . .

# Build the application (Vite will use env vars from build-time)
# Vite automatically reads .env.production if it exists
# ARG is optional fallback (no default - must be provided or use .env.production)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Debug: Show what we have
RUN echo "=== Build Environment ===" && \
    echo "ARG VITE_API_BASE_URL=${VITE_API_BASE_URL:-'NOT SET'}" && \
    if [ -f .env.production ]; then \
      echo ".env.production exists and will be read by Vite:"; \
      cat .env.production; \
    else \
      echo "⚠️  WARNING: .env.production not found!"; \
    fi && \
    echo "Vite will read VITE_API_BASE_URL from .env.production or ENV"

# Build - Vite automatically reads .env.production
RUN npm run build

# Production stage - use a simple Node.js server for Cloud Run
FROM node:22-slim

WORKDIR /app

# Install a simple static file server
RUN npm install -g serve

# Copy built files
COPY --from=builder /app/dist ./dist

# Cloud Run sets PORT environment variable
ENV PORT=8080

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Serve the static files
CMD ["serve", "-s", "dist", "-l", "8080"]

