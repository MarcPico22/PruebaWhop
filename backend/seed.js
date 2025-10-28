require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { initDatabase, insertPayment } = require('./db');
const { sendPaymentFailedEmail } = require('./mailer');

// Inicializar DB
initDatabase();

async function seedTestPayments() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  const testPayments = [
    {
      id: `pay_seed_${Date.now()}_1`,
      email: 'cliente1@ejemplo.com',
      product: 'Curso Avanzado de JavaScript',
      amount: 99.99,
      status: 'pending',
      retries: 0,
      token: uuidv4(),
    },
    {
      id: `pay_seed_${Date.now()}_2`,
      email: 'cliente2@ejemplo.com',
      product: 'Membresía Premium',
      amount: 29.99,
      status: 'pending',
      retries: 1,
      token: uuidv4(),
    },
    {
      id: `pay_seed_${Date.now()}_3`,
      email: 'cliente3@ejemplo.com',
      product: 'Ebook React Mastery',
      amount: 19.99,
      status: 'pending',
      retries: 0,
      token: uuidv4(),
    }
  ];
  
  console.log('🌱 Creando pagos de prueba...\n');
  
  for (const payment of testPayments) {
    payment.retry_link = `${baseUrl}/retry/${payment.token}`;
    insertPayment(payment);
    await sendPaymentFailedEmail(payment.email, payment.product, payment.amount, payment.retry_link);
    console.log(`✅ Creado: ${payment.id} - ${payment.product} ($${payment.amount})`);
  }
  
  console.log(`\n✅ ${testPayments.length} pagos de prueba creados exitosamente`);
  console.log('🔗 Accede al dashboard en: http://localhost:5173\n');
}

seedTestPayments().catch(console.error);
