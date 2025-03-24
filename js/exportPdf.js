/**
 * exportPdf.js - Script simplificado para la exportación de informes PDF
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de exportación PDF cargado correctamente');
    
    // Obtener el botón de exportación
    const exportBtn = document.getElementById('exportBtn');
    
    // Verificar que el botón existe
    if (!exportBtn) {
        console.error('ERROR: No se encontró el botón de exportación con ID "exportBtn"');
        return;
    }
    
    console.log('Botón de exportación encontrado, configurando evento de clic');
    
    // Configurar el evento de clic
    exportBtn.addEventListener('click', function() {
        console.log('Botón de exportación clickeado');
        alert('Función de exportación PDF en proceso. Esta función generará un informe con los datos del período seleccionado.');
        
        // Verificar si la biblioteca html2pdf está disponible
        if (typeof html2pdf === 'undefined') {
            console.error('ERROR: La biblioteca html2pdf no está cargada');
            alert('Error: No se pudo cargar la biblioteca necesaria para generar PDF. Por favor, actualice la página e intente nuevamente.');
            return;
        }
        
        // Crear contenido de prueba para el PDF
        generateTestPDF();
    });
    
    /**
     * Función para generar un PDF de prueba simple
     */
    async function generateTestPDF() {
        try {
            // Crear elemento contenedor temporal
            const element = document.createElement('div');
            element.style.padding = '15mm';
            element.style.backgroundColor = '#fff';
            element.style.color = '#000';
            element.style.fontFamily = 'Arial, sans-serif';
            
            // Obtener el rango de fecha seleccionado
            let dateRange = 'Hoy';
            const activeFilterBtn = document.querySelector('.date-filter-btn.active');
            if (activeFilterBtn) {
                dateRange = activeFilterBtn.textContent.trim();
            }
            
            // Título y contenido
            element.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="assets/logo.jpg" alt="InterUnido" style="width: 150px; height: auto;">
                    <h1 style="margin-top: 10px; color: #333;">Informe General (PRUEBA)</h1>
                    <p style="margin-top: 5px; color: #666;">
                        Período: ${dateRange}<br>
                        Fecha de generación: ${new Date().toLocaleString()}
                    </p>
                </div>
                
                <div style="margin-top: 20px;">
                    <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Información de Prueba</h2>
                    <p>Este es un informe de prueba para verificar la funcionalidad de exportación PDF.</p>
                    <p>En la versión final, este documento incluirá todas las estadísticas y gráficos del dashboard.</p>
                </div>
            `;
            
            // Agregar al documento para capturar
            document.body.appendChild(element);
            
            // Configurar opciones del PDF
            const options = {
                margin: [10, 10, 10, 10],
                filename: `InterUnido_Informe_Prueba_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            // Generar PDF
            alert('Generando PDF de prueba...');
            await html2pdf().set(options).from(element).save();
            console.log('PDF de prueba generado correctamente');
            
            // Eliminar el elemento temporal
            document.body.removeChild(element);
        } catch (error) {
            console.error('Error al generar el PDF de prueba:', error);
            alert('Error al generar el PDF: ' + error.message);
        }
    }
}); 