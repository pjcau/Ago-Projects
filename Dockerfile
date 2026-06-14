# Multi-stage Dockerfile for pnpm workspace (production)
# Build context: root of the monorepo
FROM node:20-alpine AS builder

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

WORKDIR /workspace

# Copy workspace manifest files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all workspace project manifests
COPY apps/01/src/frontend/package.json apps/01/src/frontend/package.json

# Install all workspace dependencies (frozen lockfile)
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Build the frontend application
RUN pnpm --filter product-catalog-app run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx configuration (at root of build context)
COPY apps/01/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /workspace/apps/01/src/frontend/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]