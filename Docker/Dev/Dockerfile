# ============================================
# SEN Backend - Dockerfile (Development)
# Hot-reload enabled with nodemon
# ============================================

FROM node:20-alpine

WORKDIR /app

# Install nodemon globally for hot-reload
RUN npm install -g nodemon

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p /app/database/uploads

# Expose port
EXPOSE 3000

# Start with nodemon for hot-reload
CMD ["npm", "run", "dev"]
