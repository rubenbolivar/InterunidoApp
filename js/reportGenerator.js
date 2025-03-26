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
    
    // Variables para totales
    let totalClientProfit = 0;
    let totalArbitraryCommissions = 0;
    let totalExecutive = 0;
    let totalOfficePZO = 0;
    let totalOfficeCCS = 0;
    let totalSaleBs = 0;
    
    // Generar HTML para cada transacción con detalles completos
    let transactionsDetailedHTML = '';
    
    // Si hay transacciones, generar información detallada de cada una
    if (details?.transactions && Array.isArray(details.transactions)) {
      details.transactions.forEach((transaction, index) => {
        const distribution = transaction.distribution || {};
        
        // Acumular totales
        totalClientProfit += distribution.clientProfit || 0;
        totalArbitraryCommissions += transaction.arbitraryCommissions?.total || 0;
        totalExecutive += distribution.executive || 0;
        totalOfficePZO += distribution.officePZO || 0;
        totalOfficeCCS += distribution.officeCCS || 0;
        totalSaleBs += transaction.totalSaleBs || 0;
        
        // Generar HTML para las comisiones arbitrarias
        let arbitraryCommissionsHTML = '';
        if (transaction.arbitraryCommissions && Object.keys(transaction.arbitraryCommissions).length > 0) {
          for (const [key, value] of Object.entries(transaction.arbitraryCommissions)) {
            if (key !== 'total') {
              arbitraryCommissionsHTML += `
                <tr>
                  <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${key} (${transaction.arbitraryCommissionsPercentages?.[key] || 0}%)</td>
                  <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${currencySymbol}${this.formatVES(value)}</td>
                </tr>
              `;
            }
          }
        }
        
        transactionsDetailedHTML += `
          <div class="transaction-details" style="margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #333;">Transacción ${index + 1} - ${transaction.operatorName || 'Sin operador'}</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <tr>
                <td style="padding: 4px 8px; font-weight: bold; width: 250px; border-bottom: 1px solid #eee;">Monto en ${currency}</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${currencySymbol}${this.formatVES(transaction.amountForeign || 0)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: bold; border-bottom: 1px solid #eee;">Tasa de Venta (Bs)</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${this.formatVES(transaction.sellingRate || 0)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: bold; border-bottom: 1px solid #eee;">Total de la Venta (Bs)</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${this.formatVES(transaction.totalSaleBs || 0)}</td>
              </tr>
              ${transaction.difference ? `
              <tr>
                <td style="padding: 4px 8px; font-weight: bold; border-bottom: 1px solid #eee;">Diferencia (Bs)</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${this.formatVES(transaction.difference || 0)}</td>
              </tr>
              ` : ''}
            </table>
            
            ${arbitraryCommissionsHTML ? `
            <h4 style="margin-top: 15px; margin-bottom: 10px; color: #444;">Comisiones Arbitrarias</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              ${arbitraryCommissionsHTML}
            </table>
            ` : ''}
            
            <h4 style="margin-top: 15px; margin-bottom: 10px; color: #444;">Distribución</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 8px; font-weight: bold; width: 250px; border-bottom: 1px solid #eee;">Monto a Repartir (después de comisiones)</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${currencySymbol}${this.formatVES(transaction.amountToDistributeForeign || 0)}</td>
              </tr>
              ${distribution.officePZO ? `
              <tr>
                <td style="padding: 4px 8px; font-weight: bold; border-bottom: 1px solid #eee;">Oficina PZO</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${currencySymbol}${this.formatVES(distribution.officePZO || 0)}</td>
              </tr>
              ` : ''}
              ${distribution.officeCCS ? `
              <tr>
                <td style="padding: 4px 8px; font-weight: bold; border-bottom: 1px solid #eee;">Oficina CCS</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${currencySymbol}${this.formatVES(distribution.officeCCS || 0)}</td>
              </tr>
              ` : ''}
              ${distribution.executive ? `
              <tr>
                <td style="padding: 4px 8px; font-weight: bold; border-bottom: 1px solid #eee;">Ejecutivo</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${currencySymbol}${this.formatVES(distribution.executive || 0)}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 4px 8px; font-weight: bold; border-bottom: 1px solid #eee;">Ganancia en Cliente</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${currencySymbol}${this.formatVES(distribution.clientProfit || 0)}</td>
              </tr>
            </table>
          </div>
        `;
      });
    }
    
    // Tabla resumen de transacciones (versión simplificada para la parte superior)
    let transactionsHTML = '';
    if (details?.transactions && Array.isArray(details.transactions)) {
      details.transactions.forEach(transaction => {
        transactionsHTML += `
          <tr>
            <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${transaction.operatorName || 'Sin operador'}</td>
            <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${currencySymbol}${this.formatVES(transaction.amountForeign || 0)}</td>
            <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${this.formatVES(transaction.sellingRate || 0)} Bs</td>
            <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${this.formatVES(transaction.totalSaleBs || 0)} Bs</td>
          </tr>
        `;
      });
    }
    
    // Información adicional para el resumen de la operación
    const pendingAmount = details?.summary?.montoPendiente || details?.summary?.montoRestante || 0;
    const totalAmount = amount || 0;
    const soldAmount = totalAmount - pendingAmount;
    
    // Crear el HTML completo del reporte
    return `
      <div class="report-container" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div class="report-header" style="margin-bottom: 30px; text-align: center;">
          <h1 style="color: #333; margin-bottom: 5px; letter-spacing: normal;">InterUnido - Reporte de Operación</h1>
          <p style="font-size: 14px; color: #666; letter-spacing: normal;">Fecha de generación: ${this.formatDate(new Date())}</p>
        </div>
        
        <div class="report-operation-info" style="margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="margin-top: 0; color: #333; letter-spacing: normal;">Información de la Operación</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 150px; letter-spacing: normal;">ID de Operación:</td>
              <td style="padding: 8px; letter-spacing: normal;">${_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Cliente:</td>
              <td style="padding: 8px; letter-spacing: normal;">${client}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Fecha:</td>
              <td style="padding: 8px; letter-spacing: normal;">${this.formatDate(createdAt)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Tipo:</td>
              <td style="padding: 8px; letter-spacing: normal;">Venta</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Divisa:</td>
              <td style="padding: 8px; letter-spacing: normal;">${currency}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Monto Total:</td>
              <td style="padding: 8px; letter-spacing: normal;">${currencySymbol}${this.formatVES(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Estado:</td>
              <td style="padding: 8px; letter-spacing: normal;">${estado === 'completa' ? 'Completada' : 'Incompleta'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Operador:</td>
              <td style="padding: 8px; letter-spacing: normal;">${operator?.username || 'No registrado'}</td>
            </tr>
          </table>
        </div>
        
        <div class="report-transactions-summary" style="margin-bottom: 30px;">
          <h2 style="color: #333; letter-spacing: normal;">Resumen de Transacciones</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd; letter-spacing: normal;">Operador</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd; letter-spacing: normal;">Monto (${currency})</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd; letter-spacing: normal;">Tasa</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd; letter-spacing: normal;">Total (Bs)</th>
              </tr>
            </thead>
            <tbody>
              ${transactionsHTML}
            </tbody>
          </table>
        </div>
        
        <div class="report-transactions-detailed">
          <h2 style="color: #333; letter-spacing: normal;">Transacciones Detalladas</h2>
          ${transactionsDetailedHTML}
        </div>
        
        <div class="report-summary" style="margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
          <h2 style="margin-top: 0; color: #333; letter-spacing: normal;">Totales de la Operación</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 250px; letter-spacing: normal;">Total Venta (Bs):</td>
              <td style="padding: 8px; letter-spacing: normal;">${this.formatVES(totalSaleBs)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Total Comisiones Arbitrarias:</td>
              <td style="padding: 8px; letter-spacing: normal;">${currencySymbol}${this.formatVES(totalArbitraryCommissions)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Total Ganancia en Cliente:</td>
              <td style="padding: 8px; letter-spacing: normal;">${currencySymbol}${this.formatVES(totalClientProfit)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Total Ejecutivo:</td>
              <td style="padding: 8px; letter-spacing: normal;">${currencySymbol}${this.formatVES(totalExecutive)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Total Oficina PZO:</td>
              <td style="padding: 8px; letter-spacing: normal;">${currencySymbol}${this.formatVES(totalOfficePZO)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Total Oficina CCS:</td>
              <td style="padding: 8px; letter-spacing: normal;">${currencySymbol}${this.formatVES(totalOfficeCCS)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Monto Total Operación:</td>
              <td style="padding: 8px; letter-spacing: normal;">${currencySymbol}${this.formatVES(totalAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Monto Vendido:</td>
              <td style="padding: 8px; letter-spacing: normal;">${currencySymbol}${this.formatVES(soldAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; letter-spacing: normal;">Monto Restante:</td>
              <td style="padding: 8px; letter-spacing: normal;">${currencySymbol}${this.formatVES(pendingAmount)}</td>
            </tr>
          </table>
        </div>
        
        <div class="report-footer" style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
          <p style="letter-spacing: normal;">Este es un documento generado automáticamente por el sistema de InterUnido.</p>
          <p style="letter-spacing: normal;">&copy; ${new Date().getFullYear()} InterUnido - Todos los derechos reservados</p>
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

          ${details?.tipo === 'interno' && details?.distribucion ? `
          <h3 style="margin-top: 20px; color: #333;">Distribución (Interno)</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 250px;">Sede (70%):</td>
              <td style="padding: 8px;">${this.formatVES(details.distribucion.sede || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Ejecutivo (30%):</td>
              <td style="padding: 8px;">${this.formatVES(details.distribucion.ejecutivo || 0)}</td>
            </tr>
          </table>
          ` : ''}
        </div>
        
        <div class="report-footer" style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
          <p>Este es un documento generado automáticamente por el sistema de InterUnido.</p>
          <p>&copy; ${new Date().getFullYear()} InterUnido - Todos los derechos reservados</p>
        </div>
      </div>
    `;
  }
  
  // Generate PDF report for a specific transaction
  async generatePDF(transactionId) {
    try {
      // Get auth token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        alert('Debe iniciar sesión para generar reportes');
        return false;
      }
      
      // Fetch detailed transaction data from the server
      const response = await fetch(`/api/transactions/${transactionId}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos de la operación: ${response.status}`);
      }
      
      const operationData = await response.json();
      
      // Generate HTML based on transaction type
      let reportHTML;
      if (operationData.type === 'venta') {
        reportHTML = this.generateSaleReportHTML(operationData);
      } else if (operationData.type === 'canje') {
        reportHTML = this.generateExchangeReportHTML(operationData);
      } else {
        throw new Error(`Tipo de operación no soportado: ${operationData.type}`);
      }
      
      // Create PDF using html2pdf
      const element = document.createElement('div');
      element.innerHTML = reportHTML;
      document.body.appendChild(element);
      
      const opt = {
        margin: 10,
        filename: `Reporte_${operationData.type}_${operationData._id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().from(element).set(opt).save();
      
      // Clean up
      document.body.removeChild(element);
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Error al generar el PDF: ${error.message}`);
      return false;
    }
  }
}

/**
 * Clase especializada para generar reportes desde el Dashboard
 * Extiende la clase general ReportGenerator
 */
class DashboardReportGenerator extends ReportGenerator {
  constructor() {
    super();
  }
  
  /**
   * Genera un informe general desde el dashboard basado en los datos filtrados
   * @param {Object} dashboardData - Datos del dashboard ya procesados
   * @param {Object} dateInfo - Información sobre el periodo seleccionado
   * @param {Array<Object>} chartImages - Array de objetos {id, image} con las imágenes de los gráficos
   */
  async generateDashboardReport(dashboardData, dateInfo, chartImages) {
    // Verificar que tenemos la librería html2pdf
    if (typeof html2pdf === 'undefined') {
      await this.loadLibrary();
    }
    
    // Formatear fecha actual
    const currentDate = new Date();
    const formattedCurrentDate = this.formatDate(currentDate);
    
    // Crear contenedor temporal para el reporte
    const reportContainer = document.createElement('div');
    reportContainer.style.width = '210mm'; // Ancho A4
    reportContainer.style.padding = '15mm';
    reportContainer.style.backgroundColor = '#fff';
    reportContainer.style.color = '#000';
    reportContainer.style.fontFamily = 'Arial, sans-serif';
    
    // Título y encabezado
    const header = `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="assets/logo.jpg" alt="InterUnido" style="width: 150px; height: auto;">
        <h1 style="margin-top: 10px; color: #333;">Informe General</h1>
        <p style="margin-top: 5px; color: #666;">
          Período: ${dateInfo.label}<br>
          ${dateInfo.start && dateInfo.end ? `Del ${this.formatDate(dateInfo.start)} al ${this.formatDate(dateInfo.end)}` : ''}
        </p>
        <p style="color: #888;">Generado el: ${formattedCurrentDate}</p>
      </div>
    `;
    reportContainer.innerHTML = header;
    
    // Sección de métricas clave
    const { stats } = dashboardData;
    const metricsSection = document.createElement('div');
    metricsSection.innerHTML = `
      <h2 style="margin-top: 30px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Métricas Clave</h2>
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; margin: 20px 0;">
        <div style="width: 48%; margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #333; font-size: 18px;">Ventas del Período</h3>
          <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">$${this.formatVES(stats.totalSales || 0)}</p>
          <p style="color: ${stats.salesPercentageChange >= 0 ? '#28a745' : '#dc3545'};">
            ${stats.salesPercentageChange >= 0 ? '↑' : '↓'} ${Math.abs(stats.salesPercentageChange || 0).toFixed(2)}% vs período anterior
          </p>
        </div>
        
        <div style="width: 48%; margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #333; font-size: 18px;">Operaciones</h3>
          <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${stats.totalOperations || 0}</p>
          <p style="color: #666;">operaciones en el período</p>
        </div>
        
        <div style="width: 48%; margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #333; font-size: 18px;">Promedio por Operación</h3>
          <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">$${this.formatVES(stats.averageOperation || 0)}</p>
          <p style="color: #666;">por operación</p>
        </div>
        
        <div style="width: 48%; margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #333; font-size: 18px;">Tasa Promedio</h3>
          <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${this.formatVES(stats.exchangeRate?.average || 0)}</p>
          <p style="color: #666;">tasa del período</p>
        </div>
      </div>
    `;
    reportContainer.appendChild(metricsSection);
    
    // Sección de ganancias y distribución
    const profitsSection = document.createElement('div');
    profitsSection.innerHTML = `
      <h2 style="margin-top: 30px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Ganancias y Distribución</h2>
      
      <div style="margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Concepto</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Monto (USD)</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Porcentaje</th>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">Ganancia Total</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">$${this.formatVES(stats.totalProfit || 0)}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">100%</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">Clientes</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">$${this.formatVES(stats.clientProfit || 0)}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${stats.totalProfit ? ((stats.clientProfit || 0) / stats.totalProfit * 100).toFixed(2) : 0}%</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">Comisiones</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">$${this.formatVES(stats.totalCommissions || 0)}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${stats.totalProfit ? ((stats.totalCommissions || 0) / stats.totalProfit * 100).toFixed(2) : 0}%</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">Oficina Puerto Ordaz</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">$${this.formatVES(stats.officePZOTotal || 0)}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${stats.totalProfit ? ((stats.officePZOTotal || 0) / stats.totalProfit * 100).toFixed(2) : 0}%</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">Oficina Caracas</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">$${this.formatVES(stats.officeCCSTotal || 0)}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${stats.totalProfit ? ((stats.officeCCSTotal || 0) / stats.totalProfit * 100).toFixed(2) : 0}%</td>
          </tr>
        </table>
      </div>
    `;
    reportContainer.appendChild(profitsSection);
    
    // Sección de operaciones por tipo
    if (dashboardData.operationsByType) {
      const operationsSection = document.createElement('div');
      operationsSection.innerHTML = `
        <h2 style="margin-top: 30px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Distribución de Operaciones</h2>
        
        <div style="margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Tipo</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Cantidad</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Porcentaje</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Monto Total (USD)</th>
            </tr>
            ${Object.entries(dashboardData.operationsByType).map(([type, data]) => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${type.charAt(0).toUpperCase() + type.slice(1)}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${data.count || 0}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${(data.percentage || 0).toFixed(2)}%</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">$${this.formatVES(data.amount || 0)}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
      reportContainer.appendChild(operationsSection);
    }
    
    // Sección de rendimiento por operadores (si hay datos)
    if (dashboardData.operatorsPerformance && dashboardData.operatorsPerformance.length > 0) {
      const operatorsSection = document.createElement('div');
      operatorsSection.innerHTML = `
        <h2 style="margin-top: 30px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Rendimiento por Operador</h2>
        
        <div style="margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Operador</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Operaciones</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Ventas (USD)</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Canjes (USD)</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total (USD)</th>
            </tr>
            ${dashboardData.operatorsPerformance.map(op => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${op.name || 'Sin nombre'}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${op.totalOperations || 0}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">$${this.formatVES(op.salesAmount || 0)}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">$${this.formatVES(op.exchangeAmount || 0)}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">$${this.formatVES(op.totalAmount || 0)}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
      reportContainer.appendChild(operatorsSection);
    }
    
    // Sección de gráficos si se proporcionan imágenes
    if (chartImages && chartImages.length > 0) {
      const chartsSection = document.createElement('div');
      chartsSection.innerHTML = `
        <h2 style="margin-top: 30px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Gráficos</h2>
        
        <div style="margin: 20px 0; display: flex; flex-wrap: wrap; justify-content: space-between;">
          ${chartImages.map((chart, index) => `
            <div style="width: ${index < 2 ? '48%' : '100%'}; margin-bottom: 20px;">
              <img src="${chart.image}" alt="Gráfico ${index + 1}" style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 5px;">
            </div>
          `).join('')}
        </div>
      `;
      reportContainer.appendChild(chartsSection);
    }
    
    // Pie de página
    const footer = document.createElement('div');
    footer.innerHTML = `
      <div style="margin-top: 40px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center; color: #888;">
        <p>© ${new Date().getFullYear()} InterUnido Exchange. Todos los derechos reservados.</p>
      </div>
    `;
    reportContainer.appendChild(footer);
    
    // Configurar opciones del PDF
    const opt = {
      margin: [0, 0, 0, 0],
      filename: `InterUnido_Informe_${dateInfo.range}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generar PDF
    document.body.appendChild(reportContainer);
    try {
      await html2pdf().set(opt).from(reportContainer).save();
      console.log('Informe generado correctamente');
    } catch (error) {
      console.error('Error al generar el informe:', error);
    } finally {
      document.body.removeChild(reportContainer);
    }
  }
}

// Exportar la clase
window.ReportGenerator = ReportGenerator;
window.DashboardReportGenerator = DashboardReportGenerator;
