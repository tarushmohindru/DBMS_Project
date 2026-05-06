# ── Stage 1: Build ────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars are inlined at build time — pass via docker-compose build args
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Production image ─────────────────────────────────────────────
FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/.next  ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
