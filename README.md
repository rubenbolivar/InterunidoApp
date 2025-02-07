# InterUnido Exchange - Versión Local

## Instalación

1. Descarga todos los archivos y mantén la estructura de carpetas:
```
proyecto-interunido/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
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
- Cálculos en tiempo real
- Gestión de múltiples transacciones
- Interfaz moderna con tema azul/gris

## Desarrollo

Los archivos están organizados para fácil mantenimiento:

- `index.html`: Estructura de la aplicación
- `css/styles.css`: Estilos y diseño responsive
- `js/script.js`: Toda la lógica de la aplicación

## Pruebas

1. Completa el formulario inicial con datos de ejemplo
2. Agrega varias transacciones
3. Verifica los cálculos automáticos
4. Prueba la edición y eliminación de transacciones
5. Verifica el diseño responsive ajustando el tamaño de la ventana

## Notas

- Los archivos usan rutas relativas para fácil portabilidad
- No se requiere conexión a internet
- Compatible con todos los navegadores modernos