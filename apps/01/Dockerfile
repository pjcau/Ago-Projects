# Multi-stage Dockerfile for React application (monorepo structure)
# Build context: ./apps/01  (set in docker-compose.yml)
# Frontend source lives at frontend/ within the build context.

# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy the entire build context into the image.
# This includes frontend/ (React app) and nginx.conf (for stage 2).
COPY . .

# The package.json lives at frontend/ — change into that directory
# to install dependencies and build.
WORKDIR /app/frontend

# Install ALL dependencies (react-scripts needed for build is in dependencies,
# not devDependencies, but --production flag can cause lockfile edge cases).
RUN npm ci

# Build the React application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy custom nginx configuration (at root of build context)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/frontend/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]