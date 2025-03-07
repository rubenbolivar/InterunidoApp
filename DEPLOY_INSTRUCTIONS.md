# Instrucciones de Despliegue - Sistema de Notas

Este documento contiene las instrucciones para desplegar la nueva funcionalidad del sistema de notas en el servidor de producción.

## Requisitos Previos

- Acceso SSH al servidor
- Permisos para ejecutar comandos git y npm
- PM2 instalado en el servidor

## Opción 1: Usando el Script de Despliegue

1. Sube el archivo `deploy.sh` al servidor:
   ```bash
   scp deploy.sh usuario@servidor:/ruta/temporal/
   ```

2. Conéctate al servidor:
   ```bash
   ssh usuario@servidor
   ```

3. Navega a la ubicación del script y hazlo ejecutable:
   ```bash
   cd /ruta/temporal/
   chmod +x deploy.sh
   ```

4. Ejecuta el script:
   ```bash
   ./deploy.sh
   ```

## Opción 2: Despliegue Manual

Si prefieres realizar el despliegue manualmente, sigue estos pasos:

1. Conéctate al servidor:
   ```bash
   ssh usuario@servidor
   ```

2. Navega al directorio de la aplicación:
   ```bash
   cd /var/www/interunido
   ```

3. Obtén los últimos cambios:
   ```bash
   git fetch
   ```

4. Cambia a la rama feature/notes-system:
   ```bash
   git checkout feature/notes-system
   ```

5. Actualiza el código:
   ```bash
   git pull origin feature/notes-system
   ```

6. Instala las dependencias del backend:
   ```bash
   cd backend
   npm install
   ```

7. Instala las dependencias del frontend y construye la aplicación:
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

8. Reinicia los servicios:
   ```bash
   pm2 restart all
   ```

## Verificación

Después de desplegar, verifica que la funcionalidad esté funcionando correctamente:

1. Accede a la aplicación web
2. Inicia sesión con tus credenciales
3. Navega a la sección de "Notas" desde el menú lateral
4. Intenta crear una nueva nota
5. Verifica que puedas ver, editar y archivar notas
6. Comprueba que las notas aparezcan en los detalles de las transacciones

## Solución de Problemas

Si encuentras algún problema durante el despliegue:

1. Verifica los logs de la aplicación:
   ```bash
   pm2 logs
   ```

2. Asegúrate de que todas las dependencias se hayan instalado correctamente
3. Verifica que los servicios estén ejecutándose:
   ```bash
   pm2 status
   ```

4. Si es necesario, reinicia manualmente los servicios:
   ```bash
   pm2 restart backend
   pm2 restart frontend
   ```

## Rollback

Si necesitas revertir los cambios:

1. Cambia a la rama principal:
   ```bash
   git checkout main
   ```

2. Actualiza el código:
   ```bash
   git pull origin main
   ```

3. Reinicia los servicios:
   ```bash
   pm2 restart all
   ``` 