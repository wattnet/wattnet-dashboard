# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

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
