#!/bin/bash
# deploy-simple.sh - Script simplificado para desplegar InterunidoApp

# Registrar inicio del despliegue
echo "=== INICIANDO DESPLIEGUE SIMPLIFICADO: $(date) ==="

# Navegar al directorio de la aplicación
cd /var/www/interunido.com

# Copiar server.js al directorio backend
echo "Copiando server.js al directorio backend..."
cp server.js backend/server.js

# Reiniciar la aplicación
echo "Reiniciando servicio..."
pm2 restart interunido-api

# Ajustar permisos
echo "Ajustando permisos..."
chown -R www-data:www-data .
chmod -R 755 .

echo "=== DESPLIEGUE COMPLETADO: $(date) ===" 