# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

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

# Instala dependencias de producción y desarrollo
COPY package*.json ./
RUN npm ci

# Copia todo el código y construye
COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Copia solo lo necesario desde el builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Instala solo dependencias de producción
RUN npm ci --omit=dev

# Crea un usuario sin privilegios
RUN addgroup -S app && adduser -S app -G app
USER app

# Expone puerto
EXPOSE 3000

# Ejecuta la app como usuario no-root
CMD ["npm", "start"]
