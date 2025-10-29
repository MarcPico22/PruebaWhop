const crypto = require('crypto');

console.log('\n🔐 SECRETOS PARA PRODUCCIÓN (Railway)\n');
console.log('Copia y pega estos valores en Railway Variables:\n');

const jwtSecret = crypto.randomBytes(64).toString('hex');
const encryptionSecret = crypto.randomBytes(32).toString('hex');

console.log('JWT_SECRET=');
console.log(jwtSecret);
console.log('\nENCRYPTION_SECRET=');
console.log(encryptionSecret);

console.log('\n✅ Guarda estos valores de forma segura!\n');
