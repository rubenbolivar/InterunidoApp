# Stack Tecnológico de InterUnido.com

![InterUnido Logo](../assets/logo.jpg)

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Frontend](#frontend)
4. [Backend](#backend)
5. [Base de Datos](#base-de-datos)
6. [Seguridad](#seguridad)
7. [Infraestructura y Despliegue](#infraestructura-y-despliegue)
8. [Herramientas de Desarrollo](#herramientas-de-desarrollo)
9. [Consideraciones Técnicas](#consideraciones-técnicas)

## Resumen Ejecutivo

InterUnido.com es una aplicación web completa para la gestión de operaciones de casa de cambio, desarrollada con una arquitectura moderna cliente-servidor. El sistema utiliza tecnologías web estándar en el frontend y un backend robusto basado en Node.js, con MongoDB como base de datos. Esta combinación proporciona un sistema escalable, seguro y de alto rendimiento para la gestión de operaciones financieras.

## Arquitectura General

El proyecto sigue una arquitectura de aplicación web moderna con separación clara entre:

- **Frontend**: Interfaz de usuario basada en HTML5, CSS3 y JavaScript
- **Backend**: API RESTful desarrollada con Node.js y Express
- **Base de Datos**: Sistema NoSQL MongoDB para almacenamiento de datos
- **Autenticación**: Sistema basado en JWT (JSON Web Tokens)

La arquitectura está diseñada para ser escalable, mantenible y segura, siguiendo principios de diseño modernos y mejores prácticas de desarrollo.

## Frontend

### Tecnologías Principales

- **HTML5**: Estructura semántica para el contenido web
- **CSS3**: Estilos y diseño responsivo
- **JavaScript (ES6+)**: Lógica de cliente y manipulación del DOM
- **Bootstrap 5.3**: Framework CSS para diseño responsivo y componentes de UI
- **Fetch API**: Para comunicación con el backend mediante peticiones HTTP

### Componentes y Bibliotecas

- **Bootstrap Bundle**: Incluye Popper.js para componentes interactivos
- **Sistema de Temas**: Implementación de modo claro/oscuro mediante `theme.js`
- **Componentes Personalizados**: Implementación modular para reutilización de código
- **Generador de Reportes PDF**: Funcionalidad para exportar operaciones a PDF

### Estructura de Archivos Frontend

- **HTML**: Páginas principales como `index.html`, `dashboard.html`, `operaciones.html`, etc.
- **CSS**: Estilos organizados en archivos como `styles.css`, `auth.css`, `dashboard.css`
- **JavaScript**: Lógica de cliente en archivos como `auth.js`, `dashboard.js`, `operaciones.js`
- **Assets**: Recursos estáticos como imágenes, iconos y fuentes

## Backend

### Tecnologías Principales

- **Node.js**: Entorno de ejecución JavaScript del lado del servidor
- **Express.js**: Framework web para crear APIs RESTful
- **Mongoose**: ODM (Object Document Mapper) para MongoDB
- **JWT (jsonwebtoken)**: Implementación de autenticación basada en tokens
- **bcrypt**: Biblioteca para hash seguro de contraseñas
- **Winston**: Sistema de logging para registro de eventos y errores

### Dependencias Principales

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "body-parser": "^1.20.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.10.1",
    "winston": "^3.17.0"
  }
}
```

### Estructura de API

El backend proporciona una API RESTful con endpoints para:

- Autenticación y gestión de usuarios
- CRUD de operaciones (ventas y canjes)
- Gestión de transacciones
- Generación de reportes
- Administración del sistema

## Base de Datos

### Tecnología

- **MongoDB**: Base de datos NoSQL orientada a documentos
- **Mongoose**: ODM para modelado de datos y validación

### Modelos Principales

- **User**: Almacena información de usuarios y credenciales
  ```javascript
  const UserSchema = new mongoose.Schema({
    username: String,
    password: String,  // Hash de la contraseña
    role: String       // "admin" o "operador"
  });
  ```

- **Transaction**: Almacena operaciones de venta y canje
  ```javascript
  const TransactionSchema = new mongoose.Schema({
    type: String,       // "venta" o "canje"
    client: String,
    amount: Number,     // Monto en la divisa
    details: Object,    // Información adicional
    operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Otros campos...
  });
  ```

### Características de la Base de Datos

- Esquemas flexibles para adaptarse a diferentes tipos de operaciones
- Referencias entre documentos para mantener relaciones
- Índices para optimizar consultas frecuentes
- Validación de datos a nivel de esquema

## Seguridad

### Autenticación y Autorización

- **JWT (JSON Web Tokens)**: Para autenticación stateless
- **bcrypt**: Hash seguro de contraseñas con salt
- **Roles de Usuario**: Separación entre administradores y operadores
- **Middleware de Autorización**: Verificación de permisos por ruta

### Protección de Datos

- **Variables de Entorno**: Uso de `.env` para almacenar información sensible
- **HTTPS**: Comunicación cifrada (implementada en producción)
- **Validación de Entradas**: Prevención de inyecciones y ataques XSS
- **CORS**: Configuración para controlar acceso desde dominios externos

## Infraestructura y Despliegue

### Scripts de Despliegue

El proyecto incluye varios scripts para automatizar el despliegue:

- `deploy.sh`: Script principal de despliegue
- `deploy-simple.sh`: Versión simplificada del despliegue
- `deploy-current-branch.sh`: Despliegue desde la rama actual

### Configuración de Entorno

- **dotenv**: Carga de variables de entorno desde archivo `.env`
- **Configuración de Zona Horaria**: Ajustada a "America/Caracas" (UTC-04:00)
- **Logs**: Sistema de registro con Winston para monitoreo y depuración

## Herramientas de Desarrollo

- **Git**: Sistema de control de versiones
- **GitHub**: Alojamiento del repositorio y colaboración
- **npm**: Gestor de paquetes para dependencias de Node.js
- **Scripts Personalizados**: Automatización de tareas comunes

## Consideraciones Técnicas

### Rendimiento

- **Optimización de Consultas**: Estructura de base de datos diseñada para consultas eficientes
- **Paginación**: Implementada para manejar grandes volúmenes de datos
- **Carga Asíncrona**: Uso de Fetch API y Promises para operaciones no bloqueantes

### Escalabilidad

- **Arquitectura Modular**: Facilita la expansión y mantenimiento
- **Separación Frontend/Backend**: Permite escalar componentes independientemente
- **API RESTful**: Diseñada para soportar múltiples clientes (web, móvil, etc.)

### Mantenibilidad

- **Código Estructurado**: Organización clara de archivos y funcionalidades
- **Documentación**: Comentarios en código y documentación externa
- **Convenciones de Nombrado**: Consistentes a través del proyecto
- **Logs Detallados**: Facilitan la depuración y monitoreo

---

*Informe de Stack Tecnológico InterUnido.com - Versión 1.0 - Marzo 2025* 