# ─────────────────────────
# Base (deps + source)
# ─────────────────────────
FROM node:20-alpine AS base

ENV NODE_ENV=development
WORKDIR /usr/src/app

# Install dependencies first (better caching)
COPY ./package*.json ./

RUN npm ci --legacy-peer-deps

COPY . .



# ─────────────────────────
# Build (Next.js app only)
# ─────────────────────────
FROM base AS builder

WORKDIR /usr/src/app

# Build only the frontend app
RUN npm run build



# ─────────────────────────
# Staging
# ─────────────────────────
FROM node:20-alpine AS staging

ENV NODE_ENV=staging
ENV ENV=staging
WORKDIR /usr/src/app

# Copy standalone output (this is key)
COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static
COPY --from=builder /usr/src/app/public ./public

EXPOSE 4000

CMD ["node", "server.js"]


# ─────────────────────────
# Production (distroless)
# ─────────────────────────
FROM gcr.io/distroless/nodejs20-debian11 AS production

ENV NODE_ENV=production
ENV ENV=production
WORKDIR /usr/src/app

# Copy standalone server
COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static
COPY --from=builder /usr/src/app/public ./public

EXPOSE 4000

CMD ["server.js"]