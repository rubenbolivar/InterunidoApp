#!/bin/bash

# Script de despliegue para InterUnido Cloud
# Este script actualiza el código y reinicia los servicios

echo "Iniciando despliegue de InterUnido Cloud..."

# Directorio de la aplicación
APP_DIR="/var/www/interunido"

# Verificar si el directorio existe
if [ ! -d "$APP_DIR" ]; then
  echo "Error: El directorio $APP_DIR no existe."
  exit 1
fi

# Ir al directorio de la aplicación
cd $APP_DIR

# Guardar cambios locales si los hay
git stash

# Obtener los últimos cambios
echo "Obteniendo los últimos cambios del repositorio..."
git fetch

# Cambiar a la rama feature/notes-system
echo "Cambiando a la rama feature/notes-system..."
git checkout feature/notes-system

# Actualizar el código
echo "Actualizando el código..."
git pull origin feature/notes-system

# Instalar dependencias del backend si hay cambios
if [ -f "$APP_DIR/backend/package.json" ]; then
  echo "Instalando dependencias del backend..."
  cd $APP_DIR/backend
  npm install
fi

# Instalar dependencias del frontend si hay cambios
if [ -f "$APP_DIR/frontend/package.json" ]; then
  echo "Instalando dependencias del frontend..."
  cd $APP_DIR/frontend
  npm install
  
  # Construir el frontend
  echo "Construyendo el frontend..."
  npm run build
fi

# Volver al directorio principal
cd $APP_DIR

# Reiniciar los servicios con PM2
echo "Reiniciando servicios..."
pm2 restart all

echo "¡Despliegue completado con éxito!" 