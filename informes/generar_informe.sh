#!/bin/bash

# Script para generar informes automáticamente
# Uso: ./generar_informe.sh [título_del_informe]

# Directorio base
BASE_DIR="/Users/rubenbolivar/Desktop/interunido.cloud"
INFORMES_DIR="$BASE_DIR/informes"

# Verificar si el directorio de informes existe, si no, crearlo
if [ ! -d "$INFORMES_DIR" ]; then
    mkdir -p "$INFORMES_DIR"
    echo "✅ Directorio de informes creado en: $INFORMES_DIR"
fi

# Obtener la fecha actual en formato YYYY-MM-DD
FECHA_ACTUAL=$(date +"%Y-%m-%d")

# Obtener el título del informe o usar un valor predeterminado
if [ -z "$1" ]; then
    TITULO_INFORME="Informe de Proyecto InterUnido"
else
    TITULO_INFORME="$1"
fi

# Nombre del archivo
NOMBRE_ARCHIVO="informe_proyecto_${FECHA_ACTUAL}.md"
RUTA_COMPLETA="$INFORMES_DIR/$NOMBRE_ARCHIVO"

# Crear el archivo con la plantilla base
cat > "$RUTA_COMPLETA" << EOF
# ${TITULO_INFORME}
**Fecha**: $(date +"%d de %B de %Y")

## Resumen Ejecutivo

[Incluir aquí un breve resumen del proyecto y avances recientes]

## Estado Actual del Proyecto

### 1. Funcionalidades Implementadas
- 
- 
- 

### 2. Mejoras Recientes
- 
- 
- 

### 3. Problemas Identificados
- 
- 
- 

## Análisis de Rendimiento

### 1. Métricas
- 
- 
- 

### 2. Áreas de Optimización
- 
- 
- 

## Plan de Trabajo

### 1. Tareas Prioritarias
- 
- 
- 

### 2. Calendario de Implementación
- 
- 
- 

## Conclusiones y Recomendaciones

[Incluir aquí las conclusiones y recomendaciones finales]

EOF

echo "✅ Informe creado: $RUTA_COMPLETA"
echo "📝 Puedes abrir el archivo para editarlo."