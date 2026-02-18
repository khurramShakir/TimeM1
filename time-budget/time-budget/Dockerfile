FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the app
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN apt-get update -y && apt-get install -y openssl

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema and entrypoint script for automated migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Install Prisma CLI globally in the runner for runtime migrations
# and ensure entrypoint has Unix line endings and correct ownership
USER root
RUN npm install -g prisma@5.10.2 && \
    tr -d '\r' < ./scripts/entrypoint.sh > ./scripts/entrypoint_unix.sh && \
    mv ./scripts/entrypoint_unix.sh ./scripts/entrypoint.sh && \
    chmod +x ./scripts/entrypoint.sh && \
    chown nextjs:nodejs ./scripts/entrypoint.sh
USER nextjs

EXPOSE 8080

# set hostname to 0.0.0.0 for Cloud Run
ENV HOSTNAME "0.0.0.0"

CMD ["./scripts/entrypoint.sh"]
