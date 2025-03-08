# Manual para Administradores de InterUnido.com

![InterUnido Logo](../assets/logo.jpg)

## Índice

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Panel de Administración](#panel-de-administración)
4. [Gestión de Usuarios](#gestión-de-usuarios)
5. [Configuración del Sistema](#configuración-del-sistema)
6. [Monitoreo y Reportes](#monitoreo-y-reportes)
7. [Gestión de Operaciones](#gestión-de-operaciones)
8. [Respaldo y Seguridad](#respaldo-y-seguridad)
9. [Solución de Problemas](#solución-de-problemas)

## Introducción

Este manual está diseñado para administradores de InterUnido.com, proporcionando instrucciones detalladas sobre la configuración, gestión y mantenimiento del sistema. Como administrador, usted tiene acceso a funcionalidades avanzadas que le permiten gestionar usuarios, configurar parámetros del sistema, monitorear operaciones y garantizar la seguridad de la plataforma.

## Acceso al Sistema

### Inicio de Sesión como Administrador

1. Abra su navegador web (recomendamos Chrome, Firefox o Edge actualizado).
2. Ingrese la dirección: `https://interunido.com` en la barra de direcciones.
3. En la pantalla de inicio de sesión, ingrese sus credenciales de administrador:
   - Usuario: Su nombre de usuario administrativo
   - Contraseña: Su contraseña de administrador
4. Haga clic en "Iniciar Sesión".

> **Nota de Seguridad**: Como administrador, es crucial mantener sus credenciales seguras. Cambie su contraseña regularmente y nunca la comparta con otros usuarios.

### Cambio de Contraseña

Se recomienda cambiar su contraseña periódicamente:

1. Una vez iniciada la sesión, haga clic en su nombre de usuario en la esquina superior derecha.
2. Seleccione "Perfil" en el menú desplegable.
3. En la sección "Seguridad", haga clic en "Cambiar Contraseña".
4. Ingrese su contraseña actual y la nueva contraseña (dos veces para confirmar).
5. Haga clic en "Guardar Cambios".

## Panel de Administración

El Panel de Administración es el centro de control desde donde puede gestionar todos los aspectos del sistema.

### Acceso al Panel de Administración

1. Después de iniciar sesión, haga clic en "Administración" en el menú lateral.
2. Se mostrará el Panel de Administración con las siguientes secciones:
   - Resumen del Sistema
   - Gestión de Usuarios
   - Configuración
   - Reportes
   - Respaldo y Seguridad

### Resumen del Sistema

Esta sección proporciona una visión general del estado actual del sistema:

- **Estadísticas de Uso**: Número de usuarios activos, operaciones realizadas hoy, etc.
- **Estado del Servidor**: Uso de recursos, tiempo de actividad, etc.
- **Alertas**: Notificaciones sobre problemas potenciales o situaciones que requieren atención.
- **Actividad Reciente**: Registro de las últimas acciones administrativas realizadas en el sistema.

## Gestión de Usuarios

Como administrador, puede crear, modificar y gestionar cuentas de usuario en el sistema.

### Visualizar Usuarios

1. En el Panel de Administración, haga clic en "Gestión de Usuarios".
2. Se mostrará una tabla con todos los usuarios registrados, incluyendo:
   - Nombre de usuario
   - Rol (Administrador u Operador)
   - Estado (Activo o Inactivo)
   - Fecha de último acceso
   - Acciones disponibles

### Crear Nuevo Usuario

1. En la página de Gestión de Usuarios, haga clic en "Nuevo Usuario".
2. Complete el formulario con la siguiente información:
   - **Nombre de Usuario**: Identificador único para el usuario (sin espacios).
   - **Contraseña Inicial**: Contraseña temporal que el usuario deberá cambiar en su primer inicio de sesión.
   - **Rol**: Seleccione "Administrador" u "Operador" según corresponda.
   - **Nombre Completo**: Nombre real del usuario.
   - **Correo Electrónico**: Dirección de correo para notificaciones (opcional).
   - **Notas**: Información adicional sobre el usuario (opcional).

3. Haga clic en "Crear Usuario".
4. El sistema generará la cuenta y mostrará un mensaje de confirmación.

### Editar Usuario Existente

1. En la tabla de usuarios, localice el usuario que desea modificar.
2. Haga clic en el botón "Editar" en la columna de Acciones.
3. Modifique los campos necesarios en el formulario.
4. Haga clic en "Guardar Cambios".

### Desactivar/Reactivar Usuario

Para desactivar temporalmente un usuario sin eliminarlo:

1. En la tabla de usuarios, localice el usuario que desea desactivar.
2. Haga clic en el botón "Desactivar" en la columna de Acciones.
3. Confirme la acción en el diálogo de confirmación.

Para reactivar un usuario desactivado:

1. Asegúrese de que la opción "Mostrar usuarios inactivos" esté activada.
2. Localice el usuario inactivo en la tabla.
3. Haga clic en el botón "Activar" en la columna de Acciones.

### Restablecer Contraseña de Usuario

Si un usuario olvida su contraseña:

1. En la tabla de usuarios, localice el usuario correspondiente.
2. Haga clic en "Restablecer Contraseña" en el menú de acciones.
3. El sistema generará una contraseña temporal y la mostrará.
4. Proporcione esta contraseña al usuario, quien deberá cambiarla en su próximo inicio de sesión.

## Configuración del Sistema

Esta sección permite ajustar diversos parámetros que afectan el funcionamiento del sistema.

### Configuración General

1. En el Panel de Administración, haga clic en "Configuración" y luego en "General".
2. Ajuste los siguientes parámetros según sea necesario:
   - **Nombre de la Empresa**: Nombre que aparecerá en reportes y documentos.
   - **Zona Horaria**: Configuración de la zona horaria para fechas y horas.
   - **Formato de Fecha**: Formato preferido para mostrar fechas.
   - **Tiempo de Inactividad**: Minutos antes de cerrar sesión automáticamente por inactividad.

3. Haga clic en "Guardar Configuración".

### Configuración de Operaciones

1. En la sección de Configuración, haga clic en "Operaciones".
2. Configure los parámetros relacionados con las operaciones financieras:
   - **Comisiones Bancarias Predeterminadas**: Valores que aparecerán por defecto en el menú desplegable.
   - **Factores de Distribución**: Porcentajes para la distribución de ganancias (Oficina, Ejecutivo, Cliente).
   - **Divisas Habilitadas**: Tipos de divisas disponibles para operaciones.
   - **Validaciones Automáticas**: Reglas de validación para operaciones.

3. Haga clic en "Guardar Configuración".

### Configuración de Interfaz

1. En la sección de Configuración, haga clic en "Interfaz".
2. Ajuste los parámetros de la interfaz de usuario:
   - **Tema Predeterminado**: Claro u Oscuro.
   - **Elementos por Página**: Número de elementos a mostrar en tablas paginadas.
   - **Tiempo de Notificaciones**: Segundos que permanecen visibles las notificaciones.
   - **Logo Personalizado**: Opción para subir un logo personalizado.

3. Haga clic en "Guardar Configuración".

## Monitoreo y Reportes

Esta sección permite supervisar la actividad del sistema y generar informes detallados.

### Registro de Actividad

1. En el Panel de Administración, haga clic en "Reportes" y luego en "Registro de Actividad".
2. Se mostrará una tabla con todas las acciones realizadas en el sistema, incluyendo:
   - Fecha y hora
   - Usuario
   - Tipo de acción
   - Detalles
   - Dirección IP

3. Utilice los filtros disponibles para acotar los resultados:
   - Rango de fechas
   - Usuario específico
   - Tipo de acción

4. Haga clic en "Exportar" para descargar el registro en formato CSV o PDF.

### Reportes Financieros

1. En la sección de Reportes, haga clic en "Financieros".
2. Seleccione el tipo de reporte que desea generar:
   - **Resumen Diario**: Operaciones y ganancias del día.
   - **Resumen Mensual**: Análisis mensual de operaciones y ganancias.
   - **Reporte por Operador**: Desglose de operaciones por usuario.
   - **Reporte por Divisa**: Análisis de operaciones por tipo de divisa.
   - **Reporte de Distribución**: Desglose de la distribución de ganancias.

3. Configure los parámetros específicos del reporte (rango de fechas, usuarios, etc.).
4. Haga clic en "Generar Reporte".
5. El sistema procesará la información y mostrará el reporte, con la opción de exportarlo a PDF o Excel.

### Estadísticas y Gráficos

1. En la sección de Reportes, haga clic en "Estadísticas".
2. Seleccione el tipo de estadística que desea visualizar:
   - **Volumen de Operaciones**: Gráfico de operaciones por período.
   - **Ganancias**: Evolución de ganancias en el tiempo.
   - **Distribución por Tipo**: Proporción de ventas vs. canjes.
   - **Distribución por Divisa**: Proporción de operaciones por tipo de divisa.

3. Ajuste los filtros según sea necesario (rango de fechas, usuarios, etc.).
4. Los gráficos se generarán automáticamente y podrá exportarlos como imágenes o datos.

## Gestión de Operaciones

Como administrador, tiene capacidades avanzadas para gestionar operaciones en el sistema.

### Visualización de Todas las Operaciones

A diferencia de los operadores regulares, como administrador puede ver todas las operaciones del sistema, independientemente de quién las haya creado:

1. En el menú lateral, haga clic en "Operaciones".
2. Se mostrarán todas las operaciones registradas en el sistema.
3. Utilice los filtros disponibles para encontrar operaciones específicas.

### Edición y Corrección de Operaciones

Como administrador, puede corregir errores en operaciones existentes:

1. Localice la operación que necesita corregir.
2. Haga clic en "Ver Detalle" para abrir el modal de detalles.
3. Haga clic en "Editar Operación" (botón solo visible para administradores).
4. Realice las correcciones necesarias en los campos habilitados.
5. Haga clic en "Guardar Cambios".

> **Nota**: Todas las modificaciones quedarán registradas en el historial de la operación, indicando qué administrador realizó los cambios y cuándo.

### Anulación de Operaciones

En casos excepcionales, puede ser necesario anular una operación:

1. Localice la operación que necesita anular.
2. Haga clic en "Ver Detalle" para abrir el modal de detalles.
3. Haga clic en "Anular Operación" (botón solo visible para administradores).
4. Ingrese el motivo de la anulación en el campo de justificación.
5. Haga clic en "Confirmar Anulación".

> **Advertencia**: La anulación de operaciones es una acción irreversible y debe utilizarse solo en casos excepcionales. Las operaciones anuladas permanecerán en el sistema pero marcadas como "Anuladas" y no se considerarán en los reportes financieros.

## Respaldo y Seguridad

Esta sección permite gestionar aspectos relacionados con la seguridad y el respaldo de datos del sistema.

### Respaldo de Datos

1. En el Panel de Administración, haga clic en "Respaldo y Seguridad" y luego en "Respaldo de Datos".
2. Tiene dos opciones:
   - **Respaldo Manual**: Haga clic en "Iniciar Respaldo" para generar un respaldo inmediato.
   - **Respaldos Programados**: Configure la frecuencia de los respaldos automáticos (diario, semanal, etc.).

3. Los respaldos se almacenan en la ubicación configurada y también pueden descargarse desde esta interfaz.

### Restauración de Datos

En caso de ser necesario restaurar datos desde un respaldo:

1. En la sección de Respaldo y Seguridad, haga clic en "Restaurar Datos".
2. Seleccione el archivo de respaldo que desea restaurar de la lista de respaldos disponibles.
3. Alternativamente, puede subir un archivo de respaldo desde su computadora.
4. Haga clic en "Iniciar Restauración".
5. Confirme la acción en el diálogo de confirmación.

> **Advertencia**: La restauración de datos sobrescribirá la información actual del sistema. Asegúrese de crear un respaldo antes de realizar esta operación.

### Registro de Auditoría de Seguridad

1. En la sección de Respaldo y Seguridad, haga clic en "Auditoría de Seguridad".
2. Se mostrará un registro detallado de eventos relacionados con la seguridad:
   - Intentos de inicio de sesión (exitosos y fallidos)
   - Cambios en permisos de usuarios
   - Acciones administrativas sensibles
   - Accesos a datos confidenciales

3. Utilice los filtros disponibles para acotar los resultados.
4. Haga clic en "Exportar" para descargar el registro en formato CSV o PDF.

## Solución de Problemas

Esta sección proporciona información sobre cómo resolver problemas comunes que pueden surgir en el sistema.

### Problemas de Rendimiento

Si el sistema muestra lentitud o problemas de rendimiento:

1. En el Panel de Administración, verifique el "Resumen del Sistema" para identificar posibles cuellos de botella.
2. Revise el uso de recursos del servidor (CPU, memoria, disco).
3. Considere las siguientes acciones:
   - **Optimización de Base de Datos**: En la sección "Mantenimiento", ejecute la opción "Optimizar Base de Datos".
   - **Limpieza de Registros**: Elimine registros antiguos que ya no sean necesarios.
   - **Ajuste de Configuración**: Modifique parámetros de rendimiento en la configuración avanzada.

### Errores de Aplicación

Si los usuarios reportan errores específicos:

1. Verifique el "Registro de Errores" en la sección de Reportes.
2. Identifique el error específico y su frecuencia.
3. Consulte la documentación técnica o contacte al soporte técnico si es necesario.
4. Considere aplicar parches o actualizaciones disponibles.

### Problemas de Acceso de Usuarios

Si los usuarios tienen problemas para acceder al sistema:

1. Verifique el estado de la cuenta del usuario en "Gestión de Usuarios".
2. Compruebe si la cuenta está activa y tiene los permisos correctos.
3. Restablezca la contraseña del usuario si es necesario.
4. Verifique el registro de auditoría para detectar posibles intentos de acceso fallidos.

### Contacto con Soporte Técnico

Para problemas que no pueda resolver:

1. Prepare la siguiente información:
   - Descripción detallada del problema
   - Capturas de pantalla relevantes
   - Registros de error (si están disponibles)
   - Pasos para reproducir el problema

2. Contacte al soporte técnico a través de:
   - **Correo Electrónico**: soporte.admin@interunido.com
   - **Teléfono**: +58 123 456 7890 (línea directa para administradores)
   - **Portal de Soporte**: https://soporte.interunido.com (acceso con credenciales de administrador)

---

*Manual de Administradores InterUnido.com - Versión 1.0 - Marzo 2025* 