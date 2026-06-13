# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias completas para compilar
RUN npm install

# Copiar el código fuente y compilar a JavaScript
COPY . .
RUN npm run build

# Stage 2: Production Run
FROM node:20-alpine

WORKDIR /app

# Copiar dependencias de ejecución
COPY package*.json ./
RUN npm install --only=production

# Copiar la aplicación compilada desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Puerto expuesto por Fastify por defecto
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["node", "dist/server.js"]
