# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

ARG API_URL
ARG API_TOKEN_ENDPOINT
ARG API_EMAIL
ARG API_PASSWORD
ARG DASHBOARD_API_KEY
ARG NEXT_PUBLIC_DASHBOARD_API_KEY

ENV API_URL=$API_URL \
    API_TOKEN_ENDPOINT=$API_TOKEN_ENDPOINT \
    API_EMAIL=$API_EMAIL \
    API_PASSWORD=$API_PASSWORD \
    DASHBOARD_API_KEY=$DASHBOARD_API_KEY \
    NEXT_PUBLIC_DASHBOARD_API_KEY=$NEXT_PUBLIC_DASHBOARD_API_KEY

# Copia archivos de dependencias
COPY package.json yarn.lock .yarnrc.yml ./

# Instala dependencias
RUN yarn install --immutable

# Copia el resto del código
COPY . .

# Build
RUN yarn build


# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable

ENV NODE_ENV=production

# Copia artefactos necesarios
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts

# Usuario no root
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000

CMD ["yarn", "start"]