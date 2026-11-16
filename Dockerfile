# Stage 1: Builder
FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable

# The dependencies first, so that the layer is reused while only the code changes.
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

# No build arguments and no secrets: the settings of the dashboard (the URL of the API, its credential and the
# secret of its tokens) are read when it runs, see the Configuration section of the README.
COPY . .
RUN yarn build


# Stage 2: Runner
FROM node:24-alpine AS runner

WORKDIR /app

# A fixed numeric user, so that a cluster can ask for runAsNonRoot and a read only root filesystem.
RUN addgroup -S -g 10001 app && adduser -S -u 10001 -G app app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# The standalone output has the server and only the modules that it needs: no yarn, no corepack and no
# development dependencies at start. The static files and the public folder are not part of it.
COPY --from=builder --chown=10001:10001 /app/.next/standalone ./
COPY --from=builder --chown=10001:10001 /app/.next/static ./.next/static
COPY --from=builder --chown=10001:10001 /app/public ./public

# The cache of Next.js is written here: with a read only root filesystem, mount a volume on this folder.
RUN mkdir -p .next/cache && chown 10001:10001 .next/cache

USER 10001

EXPOSE 3000

# /api/core and not /: the page answers 200 even when DASHBOARD_TOKEN_SECRET is missing, and then every request
# of the page to the dashboard fails. This one fails the same way, so the container is not healthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/core || exit 1

CMD ["node", "server.js"]
