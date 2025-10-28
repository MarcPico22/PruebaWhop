const crypto = require('crypto');

// Algoritmo de encriptación (AES-256-CBC)
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'default-secret-change-in-production-min-32-chars';

// Asegurar que la key tenga 32 bytes (256 bits)
const KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

/**
 * Encripta un texto sensible (API key, secret, etc.)
 */
function encrypt(text) {
  if (!text || text === '') {
    return null;
  }
  
  try {
    const iv = crypto.randomBytes(16); // Vector de inicialización
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Retornar IV + encrypted (separados por :)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('❌ Error encriptando:', error.message);
    throw new Error('Error encriptando datos sensibles');
  }
}

/**
 * Desencripta un texto encriptado
 */
function decrypt(encryptedText) {
  if (!encryptedText || encryptedText === '') {
    return null;
  }
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Formato de encriptación inválido');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Error desencriptando:', error.message);
    throw new Error('Error desencriptando datos sensibles');
  }
}

/**
 * Enmascara una API key para mostrarla en UI
 * Ejemplo: "sk_test_abc123def456" -> "sk_test_•••••••456"
 */
function maskApiKey(key) {
  if (!key || key.length < 8) {
    return '••••••••';
  }
  
  const prefix = key.substring(0, 7);  // "sk_test" o "pk_test" o "SG."
  const suffix = key.substring(key.length - 3);  // Últimos 3 chars
  const masked = '•'.repeat(Math.min(key.length - 10, 12));  // Máximo 12 bullets
  
  return prefix + masked + suffix;
}

/**
 * Valida que una Stripe key tenga el formato correcto
 */
function validateStripeKey(key, type = 'secret') {
  if (!key) return false;
  
  if (type === 'secret') {
    // sk_test_... o sk_live_...
    return /^sk_(test|live)_[a-zA-Z0-9]{24,}$/.test(key);
  } else if (type === 'publishable') {
    // pk_test_... o pk_live_...
    return /^pk_(test|live)_[a-zA-Z0-9]{24,}$/.test(key);
  } else if (type === 'webhook') {
    // whsec_...
    return /^whsec_[a-zA-Z0-9]{24,}$/.test(key);
  }
  
  return false;
}

/**
 * Valida que una SendGrid API key tenga el formato correcto
 */
function validateSendGridKey(key) {
  if (!key) return false;
  
  // SG.xxx con al menos 20 caracteres después del punto
  return /^SG\.[a-zA-Z0-9_-]{20,}$/.test(key);
}

module.exports = {
  encrypt,
  decrypt,
  maskApiKey,
  validateStripeKey,
  validateSendGridKey
};
