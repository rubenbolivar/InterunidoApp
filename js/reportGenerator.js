/**
 * reportGenerator.js
 * Herramienta para generar reportes PDF de operaciones
 */

class ReportGenerator {
  constructor() {
    // Cargar librería html2pdf si no está ya cargada
    if (typeof html2pdf === 'undefined') {
      console.error('La librería html2pdf no está cargada');
      this.loadLibrary();
    }
  }
  
  // Cargar la librería dinámicamente si es necesario
  loadLibrary() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  // Formatear montos en formato local
  formatVES(amount) {
    return new Intl.NumberFormat('es-VE', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(amount);
  }
  
  // Formatear fecha
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Obtener el símbolo según la divisa
  getCurrencySymbol(currency) {
    switch (currency) {
      case 'USD':  return '$';
      case 'EUR':  return '€';
      case 'USDT': return 'USDT ';
      default:     return ''; 
    }
  }
  
  // Generar el contenido HTML del reporte para una operación de venta
  generateSaleReportHTML(operationData) {
    const {
      _id,
      client,
      amount,
      details,
      createdAt,
      estado,
      operator
    } = operationData;
    
    const currency = details?.currency || 'USD';
    const currencySymbol = this.getCurrencySymbol(currency);
    
    // Elaborar HTML con los detalles de la operación
    let transactionsHTML = '';
    let totalClientProfit = 0;
    
    // Si hay transacciones, generar tabla de transacciones
    if (details?.transactions && Array.isArray(details.transactions)) {
      details.transactions.forEach(transaction => {
        const distribution = transaction.distribution || {};
        totalClientProfit += distribution.clientProfit || 0;
        
        transactionsHTML += `
          <tr>
            <td>${transaction.operatorName || 'Sin operador'}</td>
            <td>${currencySymbol}${this.formatVES(transaction.amountForeign || 0)}</td>
            <td>${this.formatVES(transaction.sellingRate || 0)} Bs</td>
            <td>${this.formatVES(transaction.totalSaleBs || 0)} Bs</td>
            <td>${currencySymbol}${this.formatVES(transaction.amountToDistributeForeign || 0)}</td>
          </tr>
        `;
      });
    }
    
    // Crear el HTML completo del reporte
    return `
      <div class="report-container" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div class="report-header" style="margin-bottom: 30px; text-align: center;">
          <h1 style="color: #333; margin-bottom: 5px;">InterUnido - Reporte de Operación</h1>
          <p style="font-size: 14px; color: #666;">Fecha de generación: ${this.formatDate(new Date())}</p>
        </div>
        
        <div class="report-operation-info" style="margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="margin-top: 0; color: #333;">Información de la Operación</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 150px;">ID de Operación:</td>
              <td style="padding: 8px;">${_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Cliente:</td>
              <td style="padding: 8px;">${client}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Fecha:</td>
              <td style="padding: 8px;">${this.formatDate(createdAt)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Tipo:</td>
              <td style="padding: 8px;">Venta</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Divisa:</td>
              <td style="padding: 8px;">${currency}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Monto Total:</td>
              <td style="padding: 8px;">${currencySymbol}${this.formatVES(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Estado:</td>
              <td style="padding: 8px;">${estado === 'completa' ? 'Completada' : 'Incompleta'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Operador:</td>
              <td style="padding: 8px;">${operator?.username || 'No registrado'}</td>
            </tr>
          </table>
        </div>
        
        <div class="report-transactions" style="margin-bottom: 30px;">
          <h2 style="color: #333;">Transacciones</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Operador</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Monto (${currency})</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Tasa</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Total (Bs)</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Distribución (${currency})</th>
              </tr>
            </thead>
            <tbody>
              ${transactionsHTML}
            </tbody>
          </table>
        </div>
        
        <div class="report-summary" style="margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
          <h2 style="margin-top: 0; color: #333;">Resumen</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 250px;">Monto Total:</td>
              <td style="padding: 8px;">${currencySymbol}${this.formatVES(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Ganancia Total Cliente:</td>
              <td style="padding: 8px;">${currencySymbol}${this.formatVES(totalClientProfit)}</td>
            </tr>
            ${details?.summary?.montoPendiente ? `
            <tr>
              <td style="padding: 8px; font-weight: bold;">Monto Pendiente:</td>
              <td style="padding: 8px;">${currencySymbol}${this.formatVES(details.summary.montoPendiente)}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div class="report-footer" style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
          <p>Este es un documento generado automáticamente por el sistema de InterUnido.</p>
          <p>© ${new Date().getFullYear()} InterUnido - Todos los derechos reservados</p>
        </div>
      </div>
    `;
  }
  
  // Generar el contenido HTML del reporte para una operación de canje
  generateExchangeReportHTML(operationData) {
    const {
      _id,
      client,
      amount,
      details,
      createdAt,
      estado,
      operator
    } = operationData;
    
    // Información básica de la operación
    let transactionsHTML = '';
    
    // Si hay transacciones, generar tabla de transacciones
    if (details?.transacciones && Array.isArray(details.transacciones)) {
      details.transacciones.forEach(transaction => {
        transactionsHTML += `
          <tr>
            <td>${transaction.operatorName || 'Sin operador'}</td>
            <td>${this.formatVES(transaction.monto || 0)}</td>
            <td>${this.formatVES(transaction.comisionCosto || 0)}%</td>
            <td>${this.formatVES(transaction.comisionVenta || 0)}%</td>
            <td>${this.formatVES(transaction.diferencia || 0)}</td>
          </tr>
        `;
      });
    }
    
    // Crear el HTML completo del reporte
    return `
      <div class="report-container" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div class="report-header" style="margin-bottom: 30px; text-align: center;">
          <h1 style="color: #333; margin-bottom: 5px;">InterUnido - Reporte de Operación de Canje</h1>
          <p style="font-size: 14px; color: #666;">Fecha de generación: ${this.formatDate(new Date())}</p>
        </div>
        
        <div class="report-operation-info" style="margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="margin-top: 0; color: #333;">Información de la Operación</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 150px;">ID de Operación:</td>
              <td style="padding: 8px;">${_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Cliente:</td>
              <td style="padding: 8px;">${client}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Fecha:</td>
              <td style="padding: 8px;">${this.formatDate(createdAt)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Tipo:</td>
              <td style="padding: 8px;">Canje ${details?.tipo || ''}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Monto Total:</td>
              <td style="padding: 8px;">${this.formatVES(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Estado:</td>
              <td style="padding: 8px;">${estado === 'completa' ? 'Completada' : 'Incompleta'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Operador:</td>
              <td style="padding: 8px;">${operator?.username || 'No registrado'}</td>
            </tr>
          </table>
        </div>
        
        <div class="report-transactions" style="margin-bottom: 30px;">
          <h2 style="color: #333;">Transacciones de Canje</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Operador</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Monto</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Comisión Costo</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Comisión Venta</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              ${transactionsHTML}
            </tbody>
          </table>
        </div>
        
        <div class="report-summary" style="margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
          <h2 style="margin-top: 0; color: #333;">Resumen</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 250px;">Monto Total:</td>
              <td style="padding: 8px;">${this.formatVES(amount)}</td>
            </tr>
            ${details?.totalDiferencia ? `
            <tr>
              <td style="padding: 8px; font-weight: bold;">Total Diferencia:</td>
              <td style="padding: 8px;">${this.formatVES(details.totalDiferencia)}</td>
            </tr>
            ` : ''}
          </table>
          
          ${details?.tipo === 'externo' && details?.distribucion ? `
          <h3 style="margin-top: 20px; color: #333;">Distribución (Externo)</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 250px;">Nómina (5%):</td>
              <td style="padding: 8px;">${this.formatVES(details.distribucion.nomina || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Oficina PZO (30%):</td>
              <td style="padding: 8px;">${this.formatVES(details.distribucion.oficinaPZO || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Oficina CCS (30%):</td>
              <td style="padding: 8px;">${this.formatVES(details.distribucion.oficinaCCS || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Ejecutivo (40%):</td>
              <td style="padding: 8px;">${this.formatVES(details.distribucion.ejecutivo || 0)}</td>
            </tr>
          </table>
          ` : ''}
        </div>
        
        <div class="report-footer" style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
          <p>Este es un documento generado automáticamente por el sistema de InterUnido.</p>
          <p>© ${new Date().getFullYear()} InterUnido - Todos los derechos reservados</p>
        </div>
      </div>
    `;
  }
  
  // Método principal para generar y descargar el PDF
  async generatePDF(operationId) {
    try {
      // Asegurarse de que html2pdf esté cargado
      if (typeof html2pdf === 'undefined') {
        await this.loadLibrary();
      }
      
      // Obtener los datos de la operación desde el API
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/transactions/${operationId}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos: ${response.status}`);
      }
      
      const operationData = await response.json();
      
      // Crear el contenido HTML según el tipo de operación
      let reportHTML;
      if (operationData.type === 'venta') {
        reportHTML = this.generateSaleReportHTML(operationData);
      } else if (operationData.type === 'canje') {
        reportHTML = this.generateExchangeReportHTML(operationData);
      } else {
        reportHTML = '<div>Tipo de operación no soportado para reporte.</div>';
      }
      
      // Crear un elemento temporal para el HTML
      const element = document.createElement('div');
      element.innerHTML = reportHTML;
      document.body.appendChild(element);
      
      // Configuración de html2pdf
      const opt = {
        margin: 10,
        filename: `InterUnido_Operacion_${operationId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Generar el PDF
      await html2pdf().from(element).set(opt).save();
      
      // Limpiar
      document.body.removeChild(element);
      
      return true;
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Error al generar el PDF: ' + error.message);
      return false;
    }
  }
}

// Exportar la clase
window.ReportGenerator = ReportGenerator;
