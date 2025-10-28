# Whop Retry - Frontend

Dashboard React para gestionar pagos fallidos.

## 🚀 Instalación

```bash
npm install
```

## 🏃 Ejecutar

```bash
npm run dev
```

El dashboard estará disponible en: http://localhost:5173

## 📋 Características

- **Vista de pagos**: Lista todos los pagos con filtros por estado
- **Estadísticas**: Resumen con totales, pendientes, recuperados y monto total
- **Reintentos manuales**: Botón para forzar reintento de cualquier pago
- **Auto-refresh**: Se actualiza automáticamente cada 10 segundos
- **Links públicos**: Acceso directo a página de reintento para clientes
- **Estados visuales**: Código de colores (verde=recuperado, amarillo=pendiente, rojo=fallido)

## 🎨 Filtros disponibles

- **Todos**: Muestra todos los pagos
- **Pendientes**: Solo pagos con status `pending`
- **Recuperados**: Solo pagos con status `recovered`
- **Fallidos**: Solo pagos con status `failed-permanent`

## 🔧 Configuración

El frontend se conecta por defecto a `http://localhost:3000` (backend).

Si necesitas cambiar la URL del backend, edita la constante `API_URL` en `src/App.jsx`:

```javascript
const API_URL = 'http://localhost:3000'
```

## 📦 Build para producción

```bash
npm run build
```

Los archivos compilados estarán en `./dist`

## 🧪 Pruebas

1. Ejecuta el backend: `cd ../backend && npm run dev`
2. Ejecuta el frontend: `npm run dev`
3. Crea un pago de prueba desde el botón en el dashboard
4. Observa cómo aparece en la tabla y se reintentan automáticamente

## 🎯 Tech Stack

- React 18
- Vite
- Tailwind CSS
- Fetch API para comunicación con backend
