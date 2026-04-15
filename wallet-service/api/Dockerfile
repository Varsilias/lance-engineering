# ─────────────────────────
# Base (deps + source)
# ─────────────────────────
FROM node:20-alpine AS base

ENV NODE_ENV=development
WORKDIR /usr/src/app

# Install deps first for better cache hits
COPY ./package*.json ./

RUN npm ci --legacy-peer-deps


COPY . .



# ─────────────────────────
# Build (only the API app)
# ─────────────────────────
FROM base AS builder

WORKDIR /usr/src/app

RUN npm run build:api



# ─────────────────────────
# Staging
# ─────────────────────────
FROM node:20-alpine AS staging

ENV NODE_ENV=staging
ENV ENV=staging
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Trim dev deps in the runtime layer
RUN npm prune --omit=dev --legacy-peer-deps

EXPOSE 7000

CMD ["npm", "run", "start"]


# ─────────────────────────
# Production (distroless)
# ─────────────────────────
# Distroless has Node as entrypoint, no shell/npm available.
FROM gcr.io/distroless/nodejs20-debian11 AS production

ENV NODE_ENV=production
ENV ENV=production
WORKDIR /usr/src/app

# Copy only what we need to run
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./

EXPOSE 7000
# Distroless ENTRYPOINT is ["node"], so just pass the script path
CMD ["dist/apps/api/main.js"]
