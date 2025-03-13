# Entrega de Código Fuente y Acceso al Repositorio

![InterUnido Logo](../assets/logo.jpg)

## Índice

1. [Introducción](#introducción)
2. [Acceso al Repositorio](#acceso-al-repositorio)
3. [Estructura del Código Fuente](#estructura-del-código-fuente)
4. [Documentación del Código](#documentación-del-código)
5. [Mantenimiento y Escalabilidad](#mantenimiento-y-escalabilidad)
6. [Transferencia de Propiedad Intelectual](#transferencia-de-propiedad-intelectual)
7. [Soporte Post-Entrega](#soporte-post-entrega)

## Introducción

Este documento detalla el proceso de entrega del código fuente completo del proyecto InterUnido.com, así como las instrucciones para acceder al repositorio de código. El código ha sido desarrollado siguiendo estándares de la industria y está completamente documentado para facilitar su mantenimiento futuro y posibles ampliaciones del sistema.

## Acceso al Repositorio

### Plataforma de Control de Versiones

El código fuente del proyecto está alojado en GitHub, una plataforma líder para el control de versiones y colaboración en desarrollo de software.

### Credenciales de Acceso

Se proporcionarán credenciales de acceso con permisos de administrador al repositorio:

- **URL del Repositorio**: https://github.com/rubenbolivar/InterunidoApp
- **Usuario**: Se creará un usuario específico para InterUnido
- **Contraseña**: Se proporcionará en un documento separado por motivos de seguridad

### Proceso de Transferencia

El repositorio será transferido a la propiedad de InterUnido siguiendo estos pasos:

1. Creación de una cuenta organizacional en GitHub a nombre de InterUnido (si aún no existe)
2. Transferencia de la propiedad del repositorio a esta cuenta organizacional
3. Configuración de permisos para los miembros del equipo técnico de InterUnido
4. Sesión de capacitación sobre el uso del repositorio (opcional, según requerimiento)

## Estructura del Código Fuente

El código fuente está organizado de manera lógica y modular para facilitar su comprensión y mantenimiento:

```
interunido.cloud/
├── assets/            # Recursos estáticos (imágenes, logos, etc.)
├── backend/           # Código del servidor y API
│   ├── node_modules/  # Dependencias (no incluidas en el repositorio)
│   ├── logs/          # Registros del sistema
│   ├── server.js      # Punto de entrada principal del backend
│   ├── logger.js      # Sistema de registro
│   ├── package.json   # Dependencias y scripts
│   └── .env           # Variables de entorno (plantilla)
├── components/        # Componentes reutilizables
├── css/               # Hojas de estilo
│   ├── styles.css     # Estilos principales
│   ├── auth.css       # Estilos de autenticación
│   ├── dashboard.css  # Estilos del panel de control
│   └── mobile-menu.css # Estilos para dispositivos móviles
├── js/                # Scripts de cliente
│   ├── auth.js        # Lógica de autenticación
│   ├── dashboard.js   # Funcionalidad del panel de control
│   ├── venta-new.js   # Lógica de operaciones de venta
│   ├── canje.js       # Lógica de operaciones de canje
│   └── ...            # Otros scripts específicos
├── docs/              # Documentación técnica adicional
├── informes/          # Documentación para el cliente
├── *.html             # Páginas principales
└── deploy*.sh         # Scripts de despliegue
```

## Documentación del Código

### Comentarios en el Código

Todo el código fuente está extensamente comentado para facilitar su comprensión y mantenimiento:

1. **Comentarios de Cabecera**: Cada archivo incluye una cabecera que describe su propósito, autor y fecha de creación/modificación.

2. **Comentarios de Funciones**: Cada función y método incluye:
   - Descripción de su propósito
   - Parámetros de entrada y su significado
   - Valores de retorno
   - Posibles excepciones o casos especiales

3. **Comentarios de Bloques**: Los bloques de código complejos incluyen explicaciones detalladas de la lógica implementada.

4. **Comentarios de Variables**: Las variables importantes y estructuras de datos están documentadas para explicar su propósito y formato.

### Ejemplo de Documentación

```javascript
/**
 * Calcula la distribución de ganancias para una transacción de venta
 * 
 * @param {Object} data - Datos de la transacción
 * @param {number} data.amount - Monto en divisa extranjera
 * @param {number} data.sellingRate - Tasa de venta
 * @param {number} data.officeRate - Tasa de oficina (opcional)
 * @param {Array} data.selectedOffices - Oficinas seleccionadas para distribución
 * @param {number} amountToDistributeForeign - Monto a distribuir en divisa extranjera
 * 
 * @returns {Object} Objeto con la distribución calculada (PZO, CCS, executive, clientProfit)
 */
calculateDistribution(data, amountToDistributeForeign) {
  // Inicializar objeto de distribución
  const distribution = { PZO: 0, CCS: 0, executive: 0, clientProfit: 0 };
  
  // Determinar factor de oficina basado en cantidad de oficinas seleccionadas
  const officeCount = data.selectedOffices.length;
  const officeFactor = (officeCount === 2) ? 0.5 : 1;
  
  // Si no hay tasa de oficina y no hay oficinas seleccionadas,
  // toda la ganancia va al cliente
  if (!data.officeRate && officeCount === 0) {
    distribution.clientProfit = amountToDistributeForeign;
    return distribution;
  }
  
  // Calcular distribución para oficinas
  // ...resto del código...
}
```

### Documentación Adicional

Además de los comentarios en el código, se incluye:

1. **README.md**: Archivo principal con instrucciones de instalación, configuración y uso.

2. **Diagramas**: Diagramas de arquitectura, flujo de datos y modelos de base de datos.

3. **Guías de Desarrollo**: Documentos que explican cómo extender o modificar funcionalidades específicas.

## Mantenimiento y Escalabilidad

El código ha sido diseñado pensando en su mantenimiento a largo plazo y en la posibilidad de escalar el sistema:

### Principios de Diseño Aplicados

1. **Modularidad**: El código está organizado en módulos independientes con responsabilidades claramente definidas.

2. **Separación de Preocupaciones**: La lógica de negocio, la presentación y el acceso a datos están separados.

3. **DRY (Don't Repeat Yourself)**: Se han creado funciones y componentes reutilizables para evitar la duplicación de código.

4. **KISS (Keep It Simple, Stupid)**: Se ha priorizado la simplicidad y legibilidad del código sobre optimizaciones prematuras.

### Escalabilidad

El sistema está diseñado para escalar en varias dimensiones:

1. **Volumen de Datos**: La estructura de la base de datos y las consultas están optimizadas para manejar grandes volúmenes de datos.

2. **Usuarios Concurrentes**: El backend puede manejar múltiples conexiones simultáneas.

3. **Funcionalidades**: La arquitectura modular facilita la adición de nuevas características sin afectar las existentes.

4. **Despliegue**: Los scripts de despliegue están automatizados para facilitar actualizaciones.

## Transferencia de Propiedad Intelectual

Con la entrega del código fuente, se transfiere la propiedad intelectual completa del software desarrollado a InterUnido, según lo estipulado en el contrato. Esto incluye:

1. **Código Fuente**: Todo el código desarrollado específicamente para este proyecto.

2. **Diseños**: Interfaces de usuario, logos y otros elementos visuales creados para el proyecto.

3. **Documentación**: Todos los documentos técnicos y manuales desarrollados.

### Licencias de Terceros

El proyecto utiliza algunas bibliotecas y frameworks de código abierto, cada uno con su propia licencia. Estas licencias se respetan y se incluyen en la documentación. Ninguna de estas licencias impone restricciones significativas al uso comercial del sistema por parte de InterUnido.

## Soporte Post-Entrega

Después de la entrega del código fuente, ofrecemos:

1. **Período de Garantía**: 3 meses durante los cuales se corregirán errores sin costo adicional.

2. **Soporte Técnico**: Disponibilidad para resolver dudas sobre el código y su funcionamiento.

3. **Actualizaciones de Seguridad**: Notificaciones sobre posibles vulnerabilidades en las dependencias utilizadas.

4. **Servicios Adicionales**: Posibilidad de contratar servicios de mantenimiento continuo, desarrollo de nuevas funcionalidades o mejoras al sistema existente.

---

*Documento de Entrega de Código Fuente InterUnido.com - Versión 1.0 - Marzo 2025* 