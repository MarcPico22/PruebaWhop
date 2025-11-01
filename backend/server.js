require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db');
const routes = require('./routes');
const webhooks = require('./webhooks');
const { startRetryScheduler } = require('./retry-logic');
const { startWhopSyncScheduler } = require('./whop-scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Webhooks necesitan raw body ANTES de parsear JSON
app.use('/api/webhooks', webhooks);

// Para el resto de rutas, parsear JSON normalmente
app.use(express.json());

// Inicializar base de datos
initDatabase();

// Rutas
app.use(routes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Whop Retry MVP is running' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 Whop Retry MVP - Backend iniciado');
  console.log(`📡 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Dashboard frontend: http://localhost:5173 (ejecutar frontend aparte)`);
  console.log(`\n📝 Endpoints disponibles:`);
  console.log(`   POST /webhook/whop - Recibir webhook de pago fallido`);
  console.log(`   GET  /api/payments - Listar pagos`);
  console.log(`   POST /api/payments/:id/retry - Forzar reintento`);
  console.log(`   GET  /retry/:token - Página pública de reintento`);
  console.log(`   POST /seed-test-payment - Crear pago de prueba`);
  console.log(`\n💡 Prueba con:`);
  console.log(`   curl -X POST http://localhost:${PORT}/seed-test-payment`);
  console.log('');
  
  // Iniciar schedulers
  startRetryScheduler();
  startWhopSyncScheduler();
});
