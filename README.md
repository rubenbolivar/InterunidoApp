# InterunidoApp
Aplicación para gestión de operaciones de Interunido

## Documentación de Seguridad y Optimización

### Mejoras de Seguridad y Optimización - Marzo 2025

#### Resumen de Cambios Implementados

1. **Implementación de Variables de Entorno**
   - Creación del archivo `.env` para almacenar información sensible
   - Variables configuradas: SECRET_KEY, MONGODB_URI, PORT
   - Eliminación de credenciales hardcodeadas en el código

2. **Sistema de Logging Mejorado**
   - Implementación de Winston para logging estructurado
   - Configuración de rotación de logs con PM2 Logrotate
   - Eliminación de logs que exponen información sensible

3. **Optimización de Conexión a MongoDB**
   - Eliminación de opciones deprecadas (useNewUrlParser, useUnifiedTopology)
   - Implementación de manejo de errores mejorado en la conexión

4. **Mejoras en el Proceso de Despliegue**
   - Creación de script deploy.sh para automatizar actualizaciones
   - Configuración de PM2 con directorio de trabajo específico
   - Implementación de backups automáticos para archivos críticos

#### Estructura del archivo .env

```
SECRET_KEY=tu_clave_secreta_aquí
MONGODB_URI=mongodb://localhost/interunido
PORT=3000
```

#### Comandos de Mantenimiento

**Reinicio de la aplicación:**
```bash
ssh root@209.74.72.12 "pm2 restart interunido-api"
```

**Visualización de logs:**
```bash
ssh root@209.74.72.12 "pm2 logs interunido-api"
```

**Respaldo de configuración:**
```bash
ssh root@209.74.72.12 "cp /var/www/interunido.com/backend/.env /var/www/interunido.com/backend/.env.backup"
```

**Despliegue de actualizaciones:**
```bash
ssh root@209.74.72.12 "cd /var/www/interunido.com && ./deploy.sh"
```

#### Buenas Prácticas de Seguridad

1. **Rotación periódica de claves:**
   - Cambiar SECRET_KEY cada 90 días
   - Actualizar inmediatamente en caso de sospecha de compromiso

2. **Monitoreo de logs:**
   - Revisar logs regularmente para detectar intentos de acceso no autorizados
   - Buscar patrones anómalos en las operaciones

3. **Respaldos:**
   - Mantener respaldos regulares de la base de datos
   - Almacenar copias del archivo .env en ubicación segura

4. **Actualizaciones:**
   - Mantener dependencias actualizadas para evitar vulnerabilidades
   - Revisar advertencias de deprecación y actualizar el código según sea necesario
