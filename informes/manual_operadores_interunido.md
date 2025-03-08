# Manual para Operadores de InterUnido.com

![InterUnido Logo](../assets/logo.jpg)

## Índice

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Operaciones de Venta](#operaciones-de-venta)
4. [Operaciones de Canje](#operaciones-de-canje)
5. [Gestión de Operaciones](#gestión-de-operaciones)
6. [Generación de Reportes PDF](#generación-de-reportes-pdf)
7. [Notas y Documentación](#notas-y-documentación)
8. [Solución de Problemas Comunes](#solución-de-problemas-comunes)

## Introducción

Este manual está diseñado para guiar a los operadores de InterUnido.com en el uso diario del sistema para realizar y gestionar operaciones de venta y canje de divisas. El manual proporciona instrucciones paso a paso para cada proceso, desde el inicio de sesión hasta la generación de reportes.

## Acceso al Sistema

### Inicio de Sesión

1. Abra su navegador web (recomendamos Chrome, Firefox o Edge actualizado).
2. Ingrese la dirección: `https://interunido.com` en la barra de direcciones.
3. Se mostrará la pantalla de inicio de sesión:

   ![Pantalla de Login](../assets/login_screen.jpg)

4. Ingrese su nombre de usuario en el campo "Usuario".
5. Ingrese su contraseña en el campo "Contraseña".
6. Haga clic en el botón "Iniciar Sesión".

> **Nota**: Si no recuerda su contraseña, contacte al administrador del sistema para restablecerla.

### Cambio de Tema (Claro/Oscuro)

Una vez que haya iniciado sesión, puede cambiar entre el tema claro y oscuro:

1. Haga clic en el botón de tema ubicado en la esquina superior derecha de cualquier página.
2. El sistema cambiará inmediatamente entre los modos claro y oscuro.
3. Su preferencia se guardará para futuras sesiones.

## Operaciones de Venta

Las operaciones de venta permiten registrar transacciones donde el cliente vende divisas (USD, EUR, USDT) y recibe bolívares.

### Crear una Nueva Operación de Venta

1. En el menú lateral, haga clic en "Venta de Divisas".
2. Se mostrará la página de venta con tres etapas (stages):

#### Stage 1: Datos de la Operación

1. Complete los siguientes campos:
   - **Nombre del Cliente**: Ingrese el nombre completo del cliente.
   - **Monto que desea vender**: Ingrese la cantidad en la divisa extranjera.
   - **Tipo de Divisa**: Seleccione una opción del menú desplegable:
     - Euros en efectivo
     - Euro transferencia
     - Dólares en efectivo
     - Dólares Zelle
     - Dólares en Bancos internacionales
     - Binance USDT
   - **Tasa Cliente**: Ingrese la tasa de cambio acordada con el cliente.

2. El sistema calculará automáticamente el "Monto que debe recibir el cliente" en bolívares.
3. Haga clic en "Continuar" para avanzar al Stage 2.

#### Stage 2: Agregar Transacciones

En esta etapa, puede registrar una o varias transacciones que componen la operación total:

1. Para cada transacción, complete:
   - **Nombre del Operador**: Su nombre o el de quien realiza la transacción.
   - **Monto**: La cantidad parcial en divisa extranjera para esta transacción.
   - **Tasa de Venta**: La tasa a la que se vende la divisa (por defecto, igual a la tasa cliente).
   - **Tasa de Oficina**: La tasa interna de la oficina (puede ser diferente a la tasa cliente).
   - **Comisión Bancaria**: Seleccione el porcentaje de comisión bancaria aplicable.

2. Haga clic en "Procesar Transacción" para calcular los resultados.
3. El sistema mostrará:
   - **Monto en Bs**: El equivalente en bolívares.
   - **Comisión**: La tasa calculada con la comisión bancaria.
   - **Distribución**: El reparto de la ganancia entre oficina, ejecutivo y cliente.

4. Si necesita agregar más transacciones (por ejemplo, si el monto total se procesa en partes), haga clic en "Agregar Transacción" y repita los pasos anteriores.
5. Una vez agregadas todas las transacciones necesarias, el sistema mostrará automáticamente el Stage 3.

#### Stage 3: Resultado de la Operación

Esta etapa muestra el resumen de toda la operación:

1. Revise la información mostrada:
   - **Cliente**: Nombre del cliente.
   - **Divisa**: Tipo de divisa seleccionada.
   - **Monto Total**: Cantidad total en divisa extranjera.
   - **Tasa Cliente**: Tasa acordada con el cliente.
   - **Total en Bs**: Monto total en bolívares.
   - **Detalle de Transacciones**: Lista de todas las transacciones agregadas.
   - **Resumen de Distribución**: Totales de distribución de ganancias.

2. Si todo es correcto, haga clic en "Registrar Operación" para guardar la operación en el sistema.
3. Si necesita hacer cambios, puede volver a los stages anteriores.

### Guardar Operación Incompleta

Si no puede completar toda la operación en un solo momento (por ejemplo, si solo ha procesado una parte del monto total):

1. Complete al menos una transacción en el Stage 2.
2. Haga clic en "Registrar Operación" en el Stage 3.
3. El sistema guardará la operación como "Incompleta" y podrá completarla posteriormente desde la página de Operaciones.

## Operaciones de Canje

Las operaciones de canje permiten registrar intercambios entre diferentes divisas.

### Crear una Nueva Operación de Canje

1. En el menú lateral, haga clic en "Canje de Divisas".
2. Se mostrará la página de canje con tres etapas (stages):

#### Stage 1: Datos de la Operación

1. Complete los siguientes campos:
   - **Cliente**: Ingrese el nombre del cliente.
   - **Tipo de Canje**: Seleccione "Interno" o "Externo".
     - **Interno**: Para canjes dentro de la misma empresa.
     - **Externo**: Para canjes con otras entidades (incluye distribución especial de ganancias).
   - **Monto (total)**: Ingrese el monto total de la operación de canje.

2. Haga clic en "Procesar Operación" para avanzar al Stage 2.

#### Stage 2: Transacciones de Canje

En esta etapa, puede registrar una o varias transacciones que componen la operación de canje:

1. Para cada transacción, complete:
   - **Nombre del Operador**: Su nombre o el de quien realiza la transacción.
   - **Monto (parcial)**: La cantidad parcial para esta transacción.
   - **Comisión de Costo (%)**: El porcentaje de comisión de costo.
   - **Comisión de Venta (%)**: El porcentaje de comisión de venta.

2. Haga clic en "Calcular Transacción".
3. El sistema calculará automáticamente la "Diferencia" entre las comisiones.
4. Si necesita agregar más transacciones, haga clic en "Agregar Transacción" y repita los pasos anteriores.
5. Una vez agregadas todas las transacciones necesarias, el sistema actualizará el Stage 3.

#### Stage 3: Resultado de la Operación

Esta etapa muestra el resumen de toda la operación de canje:

1. Revise la información mostrada:
   - **Cliente**: Nombre del cliente.
   - **Tipo de Canje**: Interno o Externo.
   - **Monto Total**: Cantidad total de la operación.
   - **Suma Monto (Transacciones)**: Total de las transacciones registradas.
   - **Total Diferencia**: Suma de las diferencias de todas las transacciones.
   - **Distribución** (solo para canjes externos):
     - Nómina (5%)
     - Ganancia Total
     - Oficina PZO (30%)
     - Oficina CCS (30%)
     - Ejecutivo (40%)

2. Si todo es correcto, haga clic en "Finalizar y Guardar Operación" para registrar la operación en el sistema.
3. Si el monto total no coincide con la suma de las transacciones, el sistema mostrará una advertencia. Puede:
   - Agregar más transacciones para completar el monto total.
   - Guardar la operación como incompleta para completarla posteriormente.

### Guardar Operación Incompleta

Si no puede completar toda la operación de canje en un solo momento:

1. Complete al menos una transacción en el Stage 2.
2. Haga clic en "Finalizar y Guardar Operación" en el Stage 3.
3. Si el sistema detecta que el monto total no coincide con la suma de las transacciones, mostrará una advertencia.
4. Confirme que desea guardar la operación como incompleta.
5. Podrá completarla posteriormente desde la página de Operaciones.

## Gestión de Operaciones

La página de Operaciones permite visualizar, filtrar y gestionar todas las operaciones registradas en el sistema.

### Acceder a la Página de Operaciones

1. En el menú lateral, haga clic en "Operaciones".
2. Se mostrará la lista de todas las operaciones registradas, con la siguiente información:
   - Cliente / Fecha
   - Total
   - Pendiente (para operaciones incompletas)
   - Ganancia
   - Tipo (Venta o Canje)
   - Estado (Completa o Incompleta)
   - Acciones

### Filtrar Operaciones

Para encontrar operaciones específicas:

1. En la sección "Filtrar Operaciones", utilice los siguientes filtros:
   - **Fecha**: Seleccione una fecha específica.
   - **Cliente**: Escriba el nombre del cliente (la búsqueda se actualiza en tiempo real).
   - **Tipo de Operación**: Seleccione "Venta", "Canje" o "Todos".

2. Haga clic en "Buscar" para aplicar los filtros.
3. Los resultados se mostrarán en la tabla inferior.

### Completar una Operación Incompleta

Para completar una operación que se guardó como incompleta:

1. En la lista de operaciones, identifique la operación con estado "Incompleta".
2. Haga clic en el botón "Completar" en la columna de Acciones.
3. El sistema le redirigirá a la página correspondiente (Venta o Canje) con los datos precargados.
4. Complete las transacciones adicionales necesarias para cubrir el monto pendiente.
5. Guarde la operación siguiendo los pasos normales.
6. Si el monto pendiente llega a cero, la operación se marcará automáticamente como "Completa".

### Ver Detalles de una Operación

Para ver los detalles completos de una operación:

1. En la lista de operaciones, haga clic en el botón "Ver Detalle" para operaciones completas (o en el botón "Completar" y luego cancelar, para operaciones incompletas).
2. Se abrirá un modal con toda la información de la operación:
   - Datos básicos (cliente, fecha, tipo, estado)
   - Monto total y pendiente
   - Ganancia
   - Transacciones registradas
   - Distribución (si aplica)

3. Desde este modal, puede:
   - Cerrar para volver a la lista de operaciones
   - Generar un PDF de la operación

## Generación de Reportes PDF

El sistema permite generar reportes en formato PDF para documentar las operaciones.

### Generar PDF de una Operación

1. En la página de Operaciones, haga clic en "Ver Detalle" para la operación deseada.
2. En el modal de detalles, haga clic en el botón "Generar PDF".
3. El sistema procesará la información y generará un archivo PDF.
4. Dependiendo de la configuración de su navegador, el PDF se descargará automáticamente o se abrirá en una nueva pestaña.

### Contenido del PDF

El reporte PDF incluye:

- Encabezado con logo de InterUnido
- Fecha y hora de generación
- Número de operación
- Datos del cliente
- Tipo de operación (Venta o Canje)
- Detalles de la operación (montos, tasas, etc.)
- Listado de transacciones
- Resumen de distribución de ganancias (si aplica)
- Firma digital del operador

### Guardar e Imprimir el PDF

Una vez generado el PDF, puede:

1. **Guardar**: Utilice la opción de guardar de su navegador o visor de PDF.
2. **Imprimir**: Utilice la opción de imprimir de su navegador o visor de PDF.
3. **Compartir**: Envíe el archivo por correo electrónico u otros medios según sea necesario.

## Notas y Documentación

El sistema de Notas permite crear y gestionar documentación interna relevante para las operaciones.

### Acceder al Sistema de Notas

1. En el menú lateral, haga clic en "Notas".
2. Se mostrará la página de gestión de notas con dos secciones principales:
   - Lista de notas existentes (izquierda)
   - Editor de notas (derecha)

### Crear una Nueva Nota

1. Haga clic en el botón "Nueva Nota".
2. Complete los siguientes campos:
   - **Título**: Un nombre descriptivo para la nota.
   - **Contenido**: El texto de la nota, con formato si es necesario.
   - **Etiquetas**: Palabras clave para categorizar la nota (separadas por comas).

3. Haga clic en "Guardar" para crear la nota.
4. La nueva nota aparecerá en la lista de notas existentes.

### Buscar y Filtrar Notas

Para encontrar notas específicas:

1. Utilice el campo de búsqueda en la parte superior de la lista de notas.
2. Escriba palabras clave relacionadas con el título, contenido o etiquetas.
3. Los resultados se actualizarán automáticamente mientras escribe.
4. También puede filtrar por etiquetas haciendo clic en una etiqueta específica.

### Editar o Eliminar Notas

Para modificar una nota existente:

1. Haga clic en la nota en la lista de notas.
2. Realice los cambios necesarios en el editor.
3. Haga clic en "Guardar" para actualizar la nota.

Para eliminar una nota:

1. Haga clic en la nota en la lista de notas.
2. Haga clic en el botón "Eliminar" en la parte inferior del editor.
3. Confirme la eliminación cuando se le solicite.

## Solución de Problemas Comunes

### Problemas de Inicio de Sesión

- **Contraseña incorrecta**: Verifique que no tenga activado el bloqueo de mayúsculas. Si continúa el problema, contacte al administrador para restablecer su contraseña.
- **Sesión expirada**: El sistema cierra sesión automáticamente después de un período de inactividad. Simplemente vuelva a iniciar sesión.

### Problemas con Operaciones

- **No se puede completar una operación**: Verifique que esté accediendo desde la página de Operaciones haciendo clic en "Completar".
- **Error al guardar**: Asegúrese de que todos los campos obligatorios estén completos y que los valores ingresados sean válidos.
- **Monto pendiente incorrecto**: Verifique que la suma de las transacciones sea igual al monto total de la operación.

### Problemas con Reportes PDF

- **No se genera el PDF**: Asegúrese de que su navegador no esté bloqueando ventanas emergentes.
- **PDF incompleto**: Verifique que todos los datos de la operación estén correctamente ingresados.

### Contacto de Soporte

Si encuentra problemas que no puede resolver, contacte al soporte técnico:

- **Correo electrónico**: soporte@interunido.com
- **Teléfono**: +58 123 456 7890
- **Horario de atención**: Lunes a Viernes, 8:00 AM - 5:00 PM

---

*Manual de Operadores InterUnido.com - Versión 1.0 - Marzo 2025* 