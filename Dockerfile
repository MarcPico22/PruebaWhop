# Usar Node.js 18
FROM node:18-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar package files
COPY backend/package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código del backend
COPY backend/ ./

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "server.js"]
