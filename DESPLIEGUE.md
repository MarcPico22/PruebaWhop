# 🚀 Despliegue a Producción - Guía Completa

Esta guía te ayudará a desplegar el sistema de recuperación de pagos en un servidor de producción.

---

## ✅ Pre-requisitos

Antes de desplegar, asegúrate de tener:

- [x] Servidor Linux (Ubuntu 20.04+ recomendado)
- [x] Node.js v16+ instalado
- [x] Dominio configurado (ej: `recuperapagos.com`)
- [x] Certificado SSL (Let's Encrypt con Certbot)
- [x] Cuenta de Stripe (modo Live)
- [x] Cuenta de SendGrid

---

## 📦 Opción 1: Despliegue en VPS (DigitalOcean, Linode, AWS EC2)

### 1. Preparar el Servidor

```bash
# Conectar por SSH
ssh root@tu-servidor.com

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js (v18 LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 (process manager)
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot para SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Clonar el Proyecto

```bash
# Crear directorio
cd /var/www
sudo mkdir recuperapagos
sudo chown $USER:$USER recuperapagos
cd recuperapagos

# Clonar código (o subir con scp/git)
git clone https://github.com/tu-usuario/recuperapagos.git .

# O subir con scp:
# scp -r ./Prueba/* root@tu-servidor:/var/www/recuperapagos/
```

### 3. Configurar Backend

```bash
cd /var/www/recuperapagos/backend

# Instalar dependencias
npm install --production

# Crear .env de producción
nano .env
```

**Contenido de `.env` producción:**

```bash
# Puerto interno (Nginx hará proxy)
PORT=3000

# Base de datos
DATABASE_URL=/var/www/recuperapagos/backend/data.db

# URL pública del servidor
BASE_URL=https://recuperapagos.com

# Seguridad (CAMBIAR ESTOS)
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Intervalos de reintento (en segundos)
RETRY_INTERVALS=300,900,3600

# NO incluir DEMO keys en producción
# Cada tenant DEBE configurar sus propias keys
```

**Generar secrets:**
```bash
# JWT_SECRET
openssl rand -hex 32

# ENCRYPTION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Iniciar Backend con PM2

```bash
cd /var/www/recuperapagos/backend

# Iniciar con PM2
pm2 start server.js --name recuperapagos-backend

# Configurar arranque automático
pm2 startup
pm2 save

# Ver logs
pm2 logs recuperapagos-backend
```

### 5. Configurar Frontend

```bash
cd /var/www/recuperapagos/frontend

# Crear .env de producción
nano .env.production
```

**Contenido de `.env.production`:**

```bash
VITE_API_URL=https://recuperapagos.com
```

**Modificar `src/` para usar variable de entorno:**

```javascript
// En todos los archivos .jsx, reemplazar:
const API_URL = 'http://localhost:3000'

// Por:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
```

**Build de producción:**

```bash
npm install
npm run build

# Los archivos se generan en ./dist
```

### 6. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/recuperapagos
```

**Contenido:**

```nginx
# Backend (API)
upstream backend {
    server localhost:3000;
}

# Frontend
server {
    listen 80;
    server_name recuperapagos.com www.recuperapagos.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name recuperapagos.com www.recuperapagos.com;

    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/recuperapagos.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/recuperapagos.com/privkey.pem;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend (archivos estáticos)
    location / {
        root /var/www/recuperapagos/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache de assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend (API)
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts (para webhooks largos)
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Webhook de Stripe
    location /webhook/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logs
    access_log /var/log/nginx/recuperapagos_access.log;
    error_log /var/log/nginx/recuperapagos_error.log;
}
```

**Activar sitio:**

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/recuperapagos /etc/nginx/sites-enabled/

# Test de configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 7. Obtener Certificado SSL

```bash
# Certbot con Nginx
sudo certbot --nginx -d recuperapagos.com -d www.recuperapagos.com

# Renovación automática (ya configurada por Certbot)
sudo certbot renew --dry-run
```

### 8. Configurar Firewall

```bash
# UFW (Ubuntu Firewall)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 9. Configurar Webhook de Stripe

1. Ve a [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. **Cambia a modo LIVE** (toggle en la esquina superior derecha)
3. Clic en **"Add endpoint"**
4. URL: `https://recuperapagos.com/api/stripe/webhook`
5. Eventos:
   - `payment_intent.payment_failed`
   - `charge.failed`
   - `invoice.payment_failed`
6. Clic en **"Add endpoint"**
7. **Copia el "Signing secret"** (empieza con `whsec_`)

### 10. Verificación Final

```bash
# Backend corriendo
curl https://recuperapagos.com/api/health
# Esperado: 200 OK

# Frontend cargando
curl -I https://recuperapagos.com
# Esperado: 200 OK

# Logs del backend
pm2 logs recuperapagos-backend

# Status de PM2
pm2 status
```

---

## 📦 Opción 2: Despliegue con Docker (Avanzado)

### 1. Crear `Dockerfile` (Backend)

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### 2. Crear `Dockerfile` (Frontend)

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### 3. Crear `docker-compose.yml`

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: recuperapagos-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - DATABASE_URL=/app/data/data.db
      - BASE_URL=https://recuperapagos.com
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_SECRET=${ENCRYPTION_SECRET}
    volumes:
      - backend-data:/app/data
    networks:
      - recuperapagos-network

  frontend:
    build: ./frontend
    container_name: recuperapagos-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - recuperapagos-network

volumes:
  backend-data:

networks:
  recuperapagos-network:
    driver: bridge
```

### 4. Desplegar

```bash
# Crear .env con secrets
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
echo "ENCRYPTION_SECRET=$(node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))')" >> .env

# Iniciar contenedores
docker-compose up -d

# Ver logs
docker-compose logs -f
```

---

## 🔒 Seguridad en Producción

### Checklist de Seguridad

- [ ] HTTPS habilitado (certificado SSL)
- [ ] Variables de entorno securizadas
- [ ] JWT_SECRET único y aleatorio (32+ caracteres)
- [ ] ENCRYPTION_SECRET único y aleatorio (64 caracteres hex)
- [ ] Firewall configurado (solo puertos 80, 443, 22)
- [ ] SSH con autenticación por llave (no password)
- [ ] Backups automáticos de la base de datos
- [ ] Rate limiting en Nginx (anti DDoS)
- [ ] Logs monitoreados
- [ ] PM2 configurado para restart automático

### Rate Limiting (Nginx)

Agregar a configuración de Nginx:

```nginx
# Límite de requests
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    # ...
    
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        # ...resto de configuración...
    }
}
```

### Backups Automáticos

```bash
# Crear script de backup
sudo nano /usr/local/bin/backup-recuperapagos.sh
```

**Contenido:**

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/recuperapagos"
DB_PATH="/var/www/recuperapagos/backend/data.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/data_$DATE.db

# Mantener solo últimos 30 backups
ls -t $BACKUP_DIR/data_*.db | tail -n +31 | xargs -r rm
```

**Hacer ejecutable:**

```bash
sudo chmod +x /usr/local/bin/backup-recuperapagos.sh
```

**Cron job (cada día a las 2am):**

```bash
sudo crontab -e

# Agregar:
0 2 * * * /usr/local/bin/backup-recuperapagos.sh
```

---

## 📊 Monitoreo

### Logs

```bash
# Logs de Nginx
sudo tail -f /var/log/nginx/recuperapagos_access.log
sudo tail -f /var/log/nginx/recuperapagos_error.log

# Logs de PM2
pm2 logs recuperapagos-backend

# Logs del sistema
sudo journalctl -u nginx -f
```

### PM2 Monitoring

```bash
# Dashboard de PM2
pm2 monit

# Status
pm2 status

# Reiniciar si hay problemas
pm2 restart recuperapagos-backend
```

---

## 🔄 Actualizaciones

### Actualizar Código

```bash
cd /var/www/recuperapagos

# Pull nuevo código
git pull origin main

# Backend
cd backend
npm install
pm2 restart recuperapagos-backend

# Frontend
cd ../frontend
npm install
npm run build

# Reiniciar Nginx
sudo systemctl reload nginx
```

---

## 🆘 Troubleshooting Producción

### Backend no responde

```bash
# Ver logs
pm2 logs recuperapagos-backend

# Reiniciar
pm2 restart recuperapagos-backend

# Si persiste, reiniciar servidor
sudo reboot
```

### Frontend muestra error 502 Bad Gateway

```bash
# Verificar que backend está corriendo
pm2 status

# Verificar configuración de Nginx
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Base de datos corrupta

```bash
# Restaurar desde backup
cp /var/backups/recuperapagos/data_YYYYMMDD_HHMMSS.db /var/www/recuperapagos/backend/data.db

# Reiniciar backend
pm2 restart recuperapagos-backend
```

---

## 📋 Checklist Post-Despliegue

- [ ] Sitio accesible en https://tudominio.com
- [ ] SSL funcionando (candado verde)
- [ ] Backend responde en `/api/health`
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Configuración de integraciones funciona
- [ ] Webhook de Stripe configurado (modo LIVE)
- [ ] Emails de SendGrid se envían correctamente
- [ ] Logs monitoreados
- [ ] Backups automáticos configurados
- [ ] PM2 inicia automáticamente al reiniciar servidor
- [ ] Firewall configurado

---

**¡Listo para producción!** 🚀

Si tienes problemas, revisa los logs y la documentación en [INDICE.md](./INDICE.md)
