# ============================================
# SEN Backend - Dockerfile
# Node.js Express API Server
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Install wget for healthcheck and curl for scripts
RUN apk add --no-cache wget curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S senbackend -u 1001

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY --chown=senbackend:nodejs . .

# Create uploads directory with proper permissions
RUN mkdir -p /app/database/uploads && \
    chown -R senbackend:nodejs /app/database

# Switch to non-root user
USER senbackend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api || exit 1

# Start command
CMD ["node", "server.js"]
