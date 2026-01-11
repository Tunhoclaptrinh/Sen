# ============================================
# SEN Backend - Dockerfile (Development)
# Hot-reload enabled with nodemon
# Optimized with layer caching
# ============================================

FROM node:20-alpine

WORKDIR /app

# Install nodemon globally for hot-reload
RUN npm install -g nodemon

# Copy package files FIRST (cached if unchanged)
COPY package*.json ./

# Install dependencies (cached if package.json unchanged)
RUN npm install

# Copy source code LAST (this changes often)
COPY . .

# Create uploads directory
RUN mkdir -p /app/database/uploads

# Expose port
EXPOSE 3000

# Start with nodemon for hot-reload
CMD ["npm", "run", "dev"]
