# --- Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies based on lockfile for reproducibility
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src
COPY coupon.json ./

# Build TypeScript
RUN npm run build

# --- Production Stage ---
FROM node:22-alpine AS production

# Install dumb-init to properly handle PID 1 signals
RUN apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production

# Only install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy the compiled code from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/coupon.json ./

# Run as non-root user for security
USER node

EXPOSE 8080

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:8080/health || exit 1

# Entrypoint using dumb-init
ENTRYPOINT ["dumb-init", "node", "dist/server.js"]
