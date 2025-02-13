# InterUnido Exchange - Versión Local

## Instalación

1. Descarga todos los archivos y mantén la estructura de carpetas:
```
proyecto-interunido/
├── index.html
├── venta.html
├── canje.html
├── css/
│   └── styles.css
├── js/
│   ├── script.js
│   ├── venta.js
│   └── canje.js
└── README.md
```

2. No se requieren dependencias adicionales ni servidor especial.

## Ejecución

### Método 1: Directo desde el navegador
- Simplemente haz doble clic en el archivo `index.html`
- Se abrirá en tu navegador predeterminado

### Método 2: Usando un servidor local
Si prefieres usar un servidor local (recomendado), puedes:

1. Usar Python:
```bash
# Si tienes Python 3
python -m http.server 8000

# Si tienes Python 2
python -m SimpleHTTPServer 8000
```

2. Usar Node.js con http-server:
```bash
# Instalar http-server globalmente
npm install -g http-server

# Ejecutar en la carpeta del proyecto
http-server
```

3. Usar Live Server en VS Code:
- Instala la extensión "Live Server"
- Click derecho en index.html
- Selecciona "Open with Live Server"

## Características

- Diseño responsive (3 columnas en desktop, scroll vertical en móvil)
- Sistema de múltiples transacciones parciales
- Cálculos en tiempo real
- Gestión de comisiones arbitrarias
- Distribución automática de ganancias
- Interfaz moderna con tema azul/gris

## Desarrollo

### Estructura de Archivos
- `index.html`: Dashboard principal
- `venta.html`: Módulo de ventas
- `canje.html`: Módulo de canje
- `css/styles.css`: Estilos y diseño responsive
- `js/`:
  - `script.js`: Lógica general
  - `venta.js`: Lógica específica de ventas
  - `canje.js`: Lógica específica de canje

### Convenciones de Código

#### Formularios de Transacción
Todos los formularios siguen una estructura estandarizada:

1. **Estructura HTML:**
```html
<div class="transaction-form card shadow-sm mb-4">
    <div class="card-body">
        <!-- Campos del formulario -->
    </div>
</div>
```

2. **Identificación de Campos:**
- Uso de atributo `name` en lugar de `id`
- Nombres estandarizados:
  - `operador`: Nombre del operador
  - `montoTransaccion`: Monto de la transacción
  - `tasaVenta`: Tasa de venta
  - `tasaOficina`: Tasa de oficina
  - `oficinaPZO`: Checkbox oficina PZO
  - `oficinaCCS`: Checkbox oficina CCS
  - `comisionBancaria`: Comisión bancaria
  - `comisionCalculada`: Comisión calculada

3. **Clases Principales:**
- `transaction-form`: Contenedor principal del formulario
- `comisiones-arbitrarias`: Contenedor de comisiones
- Uso de clases Bootstrap para estilos

## Pruebas

### Módulo de Ventas
1. Ingresa el monto total a vender en Stage 1
2. En Stage 2:
   - Completa el formulario de la primera transacción
   - Verifica los cálculos parciales
   - Agrega transacciones adicionales si es necesario
3. En Stage 3:
   - Verifica los resultados parciales de cada transacción
   - Comprueba el resumen global cuando se complete el monto total

### Validaciones Importantes
- El monto de cada transacción no debe exceder el monto restante
- Las tasas y comisiones deben ser números válidos
- Las oficinas seleccionadas deben reflejarse en la distribución
- Las comisiones arbitrarias deben calcularse correctamente

## Notas Técnicas

- Uso de JavaScript moderno (ES6+)
- Manejo de estado mediante variables globales controladas
- Sistema de validación en tiempo real
- Cálculos precisos con manejo de decimales
- Compatibilidad con navegadores modernos
- No requiere conexión a internet
- Diseño modular para fácil mantenimiento y extensión

## Mantenimiento

Para agregar nuevas funcionalidades:
1. Seguir las convenciones de nombrado establecidas
2. Usar la estructura de formularios definida
3. Mantener la separación de responsabilidades en los archivos
4. Documentar cambios significativos en este README