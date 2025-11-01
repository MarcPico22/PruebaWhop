const winston = require('winston');
const path = require('path');

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Añadir metadata si existe
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// Configuración del logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'whop-recovery' },
  transports: [
    // Errores a archivo separado
    new winston.transports.File({ 
      filename: path.join(process.env.RAILWAY_ENVIRONMENT ? '/data' : '.', 'logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Todos los logs a combined.log
    new winston.transports.File({ 
      filename: path.join(process.env.RAILWAY_ENVIRONMENT ? '/data' : '.', 'logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// En desarrollo, también mostrar en consola con colores
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
} else {
  // En producción (Railway), usar consola sin colores
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Crear directorio de logs si no existe
const fs = require('fs');
const logsDir = path.join(process.env.RAILWAY_ENVIRONMENT ? '/data' : '.', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Helper functions para facilitar el uso
logger.logPayment = (action, paymentId, metadata = {}) => {
  logger.info(`Payment ${action}`, { paymentId, ...metadata });
};

logger.logWebhook = (event, metadata = {}) => {
  logger.info(`Webhook: ${event}`, metadata);
};

logger.logRetry = (paymentId, attempt, result, metadata = {}) => {
  logger.info(`Retry payment ${paymentId} - attempt ${attempt}: ${result}`, metadata);
};

logger.logAuth = (action, email, metadata = {}) => {
  logger.info(`Auth: ${action}`, { email, ...metadata });
};

logger.logStripe = (action, metadata = {}) => {
  logger.info(`Stripe: ${action}`, metadata);
};

module.exports = logger;
