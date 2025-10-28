const crypto = require('crypto');

/**
 * Genera un ENCRYPTION_SECRET aleatorio de 64 caracteres hexadecimales
 * Usa esto para el .env: ENCRYPTION_SECRET=...
 */

const secret = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 ENCRYPTION_SECRET generado:\n');
console.log(secret);
console.log('\n📋 Copia esto en tu archivo .env:');
console.log(`ENCRYPTION_SECRET=${secret}`);
console.log('\n⚠️  IMPORTANTE: Nunca compartas este secret. Guárdalo de forma segura.\n');
