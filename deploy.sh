#!/bin/bash
# deploy.sh - Script para automatizar el despliegue de InterunidoApp

# Registrar inicio del despliegue
echo "=== INICIANDO DESPLIEGUE: $(date) ==="

# Navegar al directorio de la aplicación
cd /var/www/interunido.com

# Hacer backup del archivo .env si existe
if [ -f backend/.env ]; then
  cp backend/.env backend/.env.backup
fi

# Actualizar desde el repositorio
echo "Actualizando desde el repositorio..."
git fetch
git reset --hard origin/main

# Restaurar el archivo .env
if [ -f backend/.env.backup ]; then
  cp backend/.env.backup backend/.env
fi

# Copiar server.js al directorio backend
echo "Copiando server.js al directorio backend..."
cp server.js backend/server.js

# Instalar dependencias
echo "Instalando dependencias..."
npm --prefix backend install

# Reiniciar la aplicación
echo "Reiniciando servicio..."
pm2 restart interunido-api

# Ajustar permisos
echo "Ajustando permisos..."
chown -R www-data:www-data .
chmod -R 755 .

echo "=== DESPLIEGUE COMPLETADO: $(date) ===" 