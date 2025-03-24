/**
 * exportPdf.js - Script para la exportación de informes PDF desde el dashboard
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de exportación PDF cargado correctamente');
    
    // Obtener todos los botones de exportación
    const exportBtns = document.querySelectorAll('#exportBtn, [id^="exportBtn"], .btn-primary:contains("Generar Informe PDF")');
    
    // Si no se encontraron mediante el selector anterior, buscar por texto
    if (exportBtns.length === 0) {
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.includes('PDF') || btn.textContent.includes('Exportar') || btn.textContent.includes('Informe')) {
                btn.addEventListener('click', handleExportClick);
                console.log('Botón de exportación encontrado por texto:', btn.textContent);
            }
        });
    } else {
        // Configurar evento para cada botón encontrado
        exportBtns.forEach(btn => {
            btn.addEventListener('click', handleExportClick);
            console.log('Botón de exportación encontrado:', btn.textContent);
        });
    }
    
    /**
     * Manejador del evento de clic para botones de exportación
     */
    function handleExportClick() {
        console.log('Botón de exportación clickeado');
        
        // Verificar si la biblioteca html2pdf está disponible
        if (typeof html2pdf === 'undefined') {
            console.error('ERROR: La biblioteca html2pdf no está cargada');
            alert('Error: No se pudo cargar la biblioteca necesaria para generar PDF. Por favor, actualice la página e intente nuevamente.');
            
            // Intentar cargar la biblioteca dinámicamente
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = () => {
                console.log('Biblioteca html2pdf cargada dinámicamente');
                generateFullDashboardPDF();
            };
            document.head.appendChild(script);
            return;
        }
        
        // Generar el PDF completo
        generateFullDashboardPDF();
    }
    
    /**
     * Función para generar un PDF completo con todos los datos del dashboard
     */
    async function generateFullDashboardPDF() {
        try {
            // Mostrar mensaje inicial
            alert('Generando informe PDF completo. Este proceso puede tardar unos segundos, por favor espere...');
            
            // Crear elemento contenedor temporal
            const element = document.createElement('div');
            element.style.padding = '15mm';
            element.style.backgroundColor = '#fff';
            element.style.color = '#000';
            element.style.fontFamily = 'Arial, sans-serif';
            element.style.maxWidth = '210mm'; // Ancho A4
            
            // Obtener información del período seleccionado
            let periodoTexto = 'Período actual';
            const activePeriodBtn = document.querySelector('.date-filter-btn.active');
            if (activePeriodBtn) {
                periodoTexto = activePeriodBtn.textContent.trim();
            }
            
            // === CABECERA ===
            const header = document.createElement('div');
            header.style.textAlign = 'center';
            header.style.marginBottom = '20px';
            header.innerHTML = `
                <img src="assets/logo.jpg" alt="InterUnido" style="width: 150px; height: auto;">
                <h1 style="margin-top: 10px; color: #333;">Informe General</h1>
                <p style="margin: 5px 0; color: #666;">
                    Período: ${periodoTexto}<br>
                    Fecha de generación: ${new Date().toLocaleString()}
                </p>
            `;
            element.appendChild(header);
            
            // === MÉTRICAS CLAVE ===
            const metricsSection = document.createElement('div');
            metricsSection.style.marginBottom = '25px';
            
            // Obtener los valores de las métricas - Mejorar la forma de capturar los datos
            let ventas = '$0,00';
            let porcentaje = '0%';
            let operaciones = '0';
            let promedio = '$0,00';
            let tasa = '0';
            
            // Funciones auxiliares para encontrar los valores correctamente
            function getTextContent(selector, fallback) {
                // Intenta múltiples estrategias para encontrar el elemento
                const element = 
                    document.getElementById(selector) || 
                    document.querySelector('#' + selector) ||
                    document.querySelector('h2:contains("' + selector + '")') ||
                    document.querySelector('div:contains("' + selector + '")');
                
                return element ? element.textContent.trim() : fallback;
            }
            
            // Buscar los valores usando varias estrategias
            // 1. Intenta encontrar los elementos por su ID exacto
            console.log("Buscando elementos por ID...");
            const ventasElement = document.getElementById('dailySales');
            if (ventasElement) ventas = ventasElement.textContent.trim();
            
            const pctElement = document.querySelector('#percentageChange');
            if (pctElement) porcentaje = pctElement.textContent.trim();
            
            const opsElement = document.getElementById('totalOperations');
            if (opsElement) operaciones = opsElement.textContent.trim();
            
            const avgElement = document.getElementById('averageOperation');
            if (avgElement) promedio = avgElement.textContent.trim();
            
            const rateElement = document.getElementById('averageRate');
            if (rateElement) tasa = rateElement.textContent.trim();
            
            // 2. Si no funcionó, intenta buscar por las tarjetas con los títulos
            console.log("Buscando elementos por tarjetas...");
            if (ventas === '$0,00') {
                const ventasCards = Array.from(document.querySelectorAll('.card, .card-body'));
                for (const card of ventasCards) {
                    if (card.textContent.includes('Ventas del Período')) {
                        // Buscar elementos que parezcan valores monetarios
                        const moneyElements = Array.from(card.querySelectorAll('h2, .card-text, p, span'))
                            .filter(el => el.textContent.trim().match(/^\$[\d\.,]+/));
                        if (moneyElements.length > 0) {
                            ventas = moneyElements[0].textContent.trim();
                            break;
                        }
                    }
                }
            }
            
            if (operaciones === '0') {
                const opsCards = Array.from(document.querySelectorAll('.card, .card-body'));
                for (const card of opsCards) {
                    if (card.textContent.includes('Operaciones') && !card.textContent.includes('Promedio')) {
                        // Buscar números grandes que parezcan conteos
                        const numElements = Array.from(card.querySelectorAll('h2, .card-text, p, span'))
                            .filter(el => el.textContent.trim().match(/^\d+$/));
                        if (numElements.length > 0) {
                            operaciones = numElements[0].textContent.trim();
                            break;
                        }
                    }
                }
            }
            
            if (promedio === '$0,00') {
                const avgCards = Array.from(document.querySelectorAll('.card, .card-body'));
                for (const card of avgCards) {
                    if (card.textContent.includes('Promedio por Operación')) {
                        // Buscar elementos que parezcan valores monetarios
                        const moneyElements = Array.from(card.querySelectorAll('h2, .card-text, p, span'))
                            .filter(el => el.textContent.trim().match(/^\$[\d\.,]+/));
                        if (moneyElements.length > 0) {
                            promedio = moneyElements[0].textContent.trim();
                            break;
                        }
                    }
                }
            }
            
            if (tasa === '0') {
                const rateCards = Array.from(document.querySelectorAll('.card, .card-body'));
                for (const card of rateCards) {
                    if (card.textContent.includes('Tasa Promedio')) {
                        // Buscar números grandes que parezcan tasas
                        const numElements = Array.from(card.querySelectorAll('h2, .card-text, p, span'))
                            .filter(el => el.textContent.trim().match(/^[\d\.,]+$/));
                        if (numElements.length > 0) {
                            tasa = numElements[0].textContent.trim();
                            break;
                        }
                    }
                }
            }
            
            // 3. Último recurso: examinar directamente cada tarjeta de estadísticas
            console.log("Examinando todas las tarjetas...");
            
            // Obtener todas las tarjetas de estadísticas (las primeras 4 tarjetas)
            const statCards = Array.from(document.querySelectorAll('.card')).slice(0, 4);
            console.log(`Encontradas ${statCards.length} tarjetas de estadísticas`);
            
            if (statCards.length >= 4) {
                // Extraer los valores de estas tarjetas directamente
                const cardValues = statCards.map(card => {
                    // Encontrar el elemento con el valor principal (generalmente un h2 o elemento con clase card-text)
                    const valueElement = card.querySelector('h2, .card-text');
                    return valueElement ? valueElement.textContent.trim() : '';
                });
                
                console.log("Valores extraídos de las tarjetas:", cardValues);
                
                // Asignar valores si todavía son los predeterminados
                if (ventas === '$0,00' && cardValues[0]) ventas = cardValues[0];
                if (operaciones === '0' && cardValues[1]) operaciones = cardValues[1];
                if (promedio === '$0,00' && cardValues[2]) promedio = cardValues[2];
                if (tasa === '0' && cardValues[3]) tasa = cardValues[3];
            }
            
            // 4. Método directo: capturar mediante selectores específicos
            console.log("Intentando captura directa de métricas...");
            
            // Identificar las métricas por su ubicación específica en el DOM
            // Añadir una opción más directa: capturar datos directamente de los elementos visuales
            try {
                // Obtener todas las tarjetas numéricas del dashboard
                document.querySelectorAll('.col-md-4, .col-lg-4, .col-xl-4, .col').forEach(col => {
                    if (col.textContent.includes('Ventas del Período')) {
                        const numElement = col.querySelector('h2, .h2, .display-4, .card-text, .fs-2, [class*="h"]');
                        if (numElement && ventas === '$0,00') {
                            ventas = numElement.textContent.trim();
                            console.log("Ventas capturadas de la interfaz:", ventas);
                        }
                    }
                    
                    if (col.textContent.includes('Operaciones') && !col.textContent.includes('Promedio')) {
                        const numElement = col.querySelector('h2, .h2, .display-4, .card-text, .fs-2, [class*="h"]');
                        if (numElement && operaciones === '0') {
                            operaciones = numElement.textContent.trim();
                            console.log("Operaciones capturadas de la interfaz:", operaciones);
                        }
                    }
                    
                    if (col.textContent.includes('Promedio por Operación')) {
                        const numElement = col.querySelector('h2, .h2, .display-4, .card-text, .fs-2, [class*="h"]');
                        if (numElement && promedio === '$0,00') {
                            promedio = numElement.textContent.trim();
                            console.log("Promedio capturado de la interfaz:", promedio);
                        }
                    }
                    
                    if (col.textContent.includes('Tasa Promedio')) {
                        const numElement = col.querySelector('h2, .h2, .display-4, .card-text, .fs-2, [class*="h"]');
                        if (numElement && tasa === '0') {
                            tasa = numElement.textContent.trim();
                            console.log("Tasa capturada de la interfaz:", tasa);
                        }
                    }
                });
            } catch (error) {
                console.error("Error en la búsqueda directa en la interfaz:", error);
            }
            
            // Como último recurso, extraer datos numéricos de la página
            if (ventas === '$0,00' || operaciones === '0' || promedio === '$0,00' || tasa === '0') {
                console.log("Realizando búsqueda general en la página...");
                
                // Buscar todos los elementos que parecen contener valores monetarios o numéricos
                const moneyElements = Array.from(document.querySelectorAll('*')).filter(el => {
                    const text = el.textContent.trim();
                    return text.match(/^\$[\d\.,]+$/) || text.match(/^[\d\.]+$/);
                });
                
                console.log(`Encontrados ${moneyElements.length} posibles valores numéricos en la página`);
                
                // Intentar identificar los valores por su formato y contexto
                moneyElements.forEach(el => {
                    const text = el.textContent.trim();
                    const parentText = el.parentElement?.textContent || '';
                    
                    if (text.startsWith('$') && ventas === '$0,00' && !parentText.includes('Promedio')) {
                        ventas = text;
                        console.log("Posible valor de ventas encontrado:", ventas);
                    }
                    
                    if (text.match(/^\d+$/) && operaciones === '0' && (
                        parentText.includes('operaciones') || 
                        el.nextElementSibling?.textContent.includes('operaciones')
                    )) {
                        operaciones = text;
                        console.log("Posible valor de operaciones encontrado:", operaciones);
                    }
                    
                    if (text.startsWith('$') && promedio === '$0,00' && (
                        parentText.includes('promedio') || 
                        parentText.includes('Promedio') || 
                        el.nextElementSibling?.textContent.includes('operación')
                    )) {
                        promedio = text;
                        console.log("Posible valor de promedio encontrado:", promedio);
                    }
                    
                    if (text.match(/^[\d\.]+$/) && tasa === '0' && (
                        parentText.includes('tasa') || 
                        parentText.includes('Tasa') || 
                        el.nextElementSibling?.textContent.includes('tasa')
                    )) {
                        tasa = text;
                        console.log("Posible valor de tasa encontrado:", tasa);
                    }
                });
            }
            
            console.log("Valores finales capturados:", { ventas, porcentaje, operaciones, promedio, tasa });
            
            // Determinar color para el porcentaje de cambio
            const pctText = porcentaje.replace('%', '').trim();
            const pctValue = parseFloat(pctText) || 0;
            const pctColor = pctValue >= 0 ? '#28a745' : '#dc3545';
            
            metricsSection.innerHTML = `
                <h2 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #333;">Métricas Clave</h2>
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; margin-top: 15px;">
                    <div style="width: 48%; margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        <h3 style="margin-top: 0; color: #333; font-size: 16px;">Ventas del Período</h3>
                        <p style="font-size: 22px; font-weight: bold; margin: 10px 0;">${ventas}</p>
                        <p style="color: ${pctColor}; margin: 0;">
                            ${porcentaje} vs período anterior
                        </p>
                    </div>
                    
                    <div style="width: 48%; margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        <h3 style="margin-top: 0; color: #333; font-size: 16px;">Operaciones</h3>
                        <p style="font-size: 22px; font-weight: bold; margin: 10px 0;">${operaciones}</p>
                        <p style="color: #666; margin: 0;">operaciones en el período</p>
                    </div>
                    
                    <div style="width: 48%; margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        <h3 style="margin-top: 0; color: #333; font-size: 16px;">Promedio por Operación</h3>
                        <p style="font-size: 22px; font-weight: bold; margin: 10px 0;">${promedio}</p>
                        <p style="color: #666; margin: 0;">por operación</p>
                    </div>
                    
                    <div style="width: 48%; margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        <h3 style="margin-top: 0; color: #333; font-size: 16px;">Tasa Promedio</h3>
                        <p style="font-size: 22px; font-weight: bold; margin: 10px 0;">${tasa}</p>
                        <p style="color: #666; margin: 0;">tasa del período</p>
                    </div>
                </div>
            `;
            element.appendChild(metricsSection);
            
            // === GANANCIAS Y DISTRIBUCIÓN ===
            const profitsSection = document.createElement('div');
            profitsSection.style.marginBottom = '25px';
            
            // Intenta obtener datos de ganancias y distribución
            let gananciasData = {
                total: '$0,00',
                clientes: '$0,00',
                comisiones: '$0,00',
                oficinaPZO: '$0,00',
                oficinaCCS: '$0,00'
            };
            
            // Intenta encontrar datos de ganancias en el dashboard
            console.log("Buscando datos de ganancias...");
            try {
                // Buscar gráficos o tablas que contengan datos de distribución
                const gananciasChart = document.querySelector('.chart-container canvas');
                if (gananciasChart) {
                    // Podemos intentar obtener datos del gráfico, pero es difícil...
                    console.log("Encontrado gráfico de ganancias");
                }
                
                // Buscar directamente en la API del dashboard si está accesible
                if (window.dashboardData && window.dashboardData.stats) {
                    const stats = window.dashboardData.stats;
                    // Formatear los valores
                    const formatValue = val => '$' + parseFloat(val || 0).toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    
                    gananciasData = {
                        total: formatValue(stats.totalProfit),
                        clientes: formatValue(stats.clientProfit),
                        comisiones: formatValue(stats.totalCommissions),
                        oficinaPZO: formatValue(stats.officePZOTotal),
                        oficinaCCS: formatValue(stats.officeCCSTotal)
                    };
                    
                    console.log("Datos de ganancias obtenidos de window.dashboardData:", gananciasData);
                }
            } catch (error) {
                console.error("Error al obtener datos de ganancias:", error);
            }
            
            // Calcular porcentajes (o usar valores por defecto)
            const calcPercent = (value, total) => {
                try {
                    const v = parseFloat(value.replace(/[$,]/g, '')) || 0;
                    const t = parseFloat(total.replace(/[$,]/g, '')) || 1; // evitar división por cero
                    return ((v / t) * 100).toFixed(2) + '%';
                } catch (e) {
                    return '0%';
                }
            };
            
            const percents = {
                clientes: calcPercent(gananciasData.clientes, gananciasData.total),
                comisiones: calcPercent(gananciasData.comisiones, gananciasData.total),
                oficinaPZO: calcPercent(gananciasData.oficinaPZO, gananciasData.total),
                oficinaCCS: calcPercent(gananciasData.oficinaCCS, gananciasData.total)
            };
            
            // Generar HTML para la sección de ganancias
            profitsSection.innerHTML = `
                <h2 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #333;">Ganancias y Distribución</h2>
                
                <div style="margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Concepto</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Monto (USD)</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Porcentaje</th>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">Ganancia Total</td>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${gananciasData.total}</td>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">100%</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">Clientes</td>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${gananciasData.clientes}</td>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${percents.clientes}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">Comisiones</td>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${gananciasData.comisiones}</td>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${percents.comisiones}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">Oficina Puerto Ordaz</td>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${gananciasData.oficinaPZO}</td>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${percents.oficinaPZO}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">Oficina Caracas</td>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${gananciasData.oficinaCCS}</td>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${percents.oficinaCCS}</td>
                        </tr>
                    </table>
                </div>
            `;
            
            element.appendChild(profitsSection);
            
            // === GRÁFICOS ===
            const chartsSection = document.createElement('div');
            chartsSection.style.marginBottom = '25px';
            chartsSection.innerHTML = `<h2 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #333;">Gráficos</h2>`;
            
            // Capturar y añadir imágenes de los gráficos
            const chartElements = document.querySelectorAll('canvas');
            if (chartElements.length > 0) {
                const chartImagesDiv = document.createElement('div');
                chartImagesDiv.style.marginTop = '15px';
                
                // Función para convertir canvas a imagen
                async function addChartImage(canvas, title) {
                    try {
                        // Intentar obtener la imagen del canvas
                        const imageUrl = canvas.toDataURL('image/png');
                        
                        const chartContainer = document.createElement('div');
                        chartContainer.style.marginBottom = '20px';
                        chartContainer.innerHTML = `
                            <h3 style="margin: 10px 0; color: #555; font-size: 16px;">${title}</h3>
                            <img src="${imageUrl}" alt="${title}" style="width: 100%; border: 1px solid #eee; border-radius: 5px;">
                        `;
                        chartImagesDiv.appendChild(chartContainer);
                    } catch (error) {
                        console.error('Error al convertir gráfico a imagen:', error);
                    }
                }
                
                // Títulos para los gráficos (siguiendo el orden del dashboard)
                const chartTitles = [
                    'Operaciones por Período',
                    'Distribución de Operaciones',
                    'Ganancias por Tipo de Operación',
                    'Comisión Acumulada por Oficina',
                    'Rendimiento por Tipo de Operación',
                    'Rendimiento por Operador'
                ];
                
                // Añadir cada gráfico
                for (let i = 0; i < chartElements.length; i++) {
                    const title = i < chartTitles.length ? chartTitles[i] : `Gráfico ${i+1}`;
                    await addChartImage(chartElements[i], title);
                }
                
                chartsSection.appendChild(chartImagesDiv);
            } else {
                chartsSection.innerHTML += `<p style="color: #777;">No se encontraron gráficos para incluir en el informe.</p>`;
            }
            
            element.appendChild(chartsSection);
            
            // === RENDIMIENTO POR OPERADOR ===
            const operatorsTable = document.querySelector('#operatorsTable');
            if (operatorsTable) {
                const operatorsSection = document.createElement('div');
                operatorsSection.style.marginBottom = '25px';
                
                operatorsSection.innerHTML = `
                    <h2 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #333;">Rendimiento por Operador</h2>
                    ${operatorsTable.outerHTML}
                `;
                
                // Aplicar estilos a la tabla
                const tableStyles = `
                    <style>
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th { background-color: #f8f9fa; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
                        td { padding: 8px; border-bottom: 1px solid #eee; }
                    </style>
                `;
                operatorsSection.innerHTML = tableStyles + operatorsSection.innerHTML;
                
                element.appendChild(operatorsSection);
            }
            
            // === PIE DE PÁGINA ===
            const footer = document.createElement('div');
            footer.style.marginTop = '40px';
            footer.style.paddingTop = '10px';
            footer.style.borderTop = '1px solid #ddd';
            footer.style.textAlign = 'center';
            footer.style.color = '#888';
            footer.innerHTML = `
                <p>© ${new Date().getFullYear()} InterUnido Exchange. Todos los derechos reservados.</p>
            `;
            element.appendChild(footer);
            
            // Agregar al documento para capturar
            document.body.appendChild(element);
            
            // Configurar opciones del PDF
            const options = {
                margin: [10, 10, 10, 10],
                filename: `InterUnido_Informe_${periodoTexto.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            // Generar PDF
            try {
                await html2pdf().set(options).from(element).save();
                console.log('PDF generado correctamente');
            } finally {
                // Eliminar el elemento temporal
                document.body.removeChild(element);
            }
            
        } catch (error) {
            console.error('Error al generar el PDF completo:', error);
            alert('Error al generar el PDF: ' + error.message);
        }
    }
}); 