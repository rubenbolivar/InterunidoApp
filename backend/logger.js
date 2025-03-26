const winston = require('winston');
const path = require('path');

// Configuración para diferentes entornos
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'interunido-api' },
  transports: [
    // Escribe todos los logs en el archivo combinado
    new winston.transports.File({ 
      filename: path.join(__dirname, 'logs/combined.log') 
    }),
    // Escribe solo los errores en el archivo de errores
    new winston.transports.File({ 
      filename: path.join(__dirname, 'logs/error.log'), 
      level: 'error' 
    }),
  ],
});

// Si no estamos en producción, también imprime en consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;