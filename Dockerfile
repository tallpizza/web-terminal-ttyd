# Multi-stage build for Web Terminal

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Stage 3: Final image
FROM node:18-alpine

# Install required packages
RUN apk add --no-cache \
    bash \
    curl \
    wget \
    git \
    openssh-client \
    sqlite \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Install GoTTY
RUN wget https://github.com/yudai/gotty/releases/download/v1.0.1/gotty_linux_amd64.tar.gz \
    && tar -xzf gotty_linux_amd64.tar.gz \
    && mv gotty /usr/local/bin/ \
    && rm gotty_linux_amd64.tar.gz \
    && chmod +x /usr/local/bin/gotty

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist /app/backend/static

# Copy backend from stage 2
COPY --from=backend-builder /app/backend /app/backend

# Copy CLI
COPY cli/ /app/cli/

# Copy scripts
COPY scripts/ /app/scripts/

# Create data directory for database
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    DATABASE_PATH=/app/data/sessions.db \
    GOTTY_BINARY_PATH=/usr/local/bin/gotty \
    GOTTY_START_PORT=8081

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 \
    && chown -R nodejs:nodejs /app

USER nodejs

# Expose ports
EXPOSE 3000
EXPOSE 8081-8100

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
WORKDIR /app/backend
CMD ["node", "server.js"]