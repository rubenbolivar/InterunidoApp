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
            
            // Obtener los valores de las métricas
            const ventas = document.getElementById('dailySales')?.textContent || '$0';
            const porcentaje = document.querySelector('#percentageChange')?.textContent || '0%';
            const operaciones = document.getElementById('totalOperations')?.textContent || '0';
            const promedio = document.getElementById('averageOperation')?.textContent || '$0';
            const tasa = document.getElementById('averageRate')?.textContent || '0';
            
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