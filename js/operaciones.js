document.addEventListener('DOMContentLoaded', function() {
  // Función para formatear montos en formato local
  function formatVES(amount) {
    return new Intl.NumberFormat('es-VE', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(amount);
  }

  // Función para obtener el símbolo según la divisa
  function getCurrencySymbol(currency) {
    switch (currency) {
      case 'USD':  return '$';
      case 'EUR':  return '€';
      case 'USDT': return 'USDT ';
      default:     return ''; 
    }
  }

  // Obtener el token
  function getAuthToken() {
    return localStorage.getItem('auth_token');
  }

  // Llamar al backend para traer las operaciones
  function fetchOperations(queryParams = '') {
    const token = getAuthToken();
    fetch('/api/transactions' + queryParams, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(response => response.json())
    .then(data => {
      renderOperationsTable(data);
    })
    .catch(error => {
      console.error('Error al obtener operaciones:', error);
    });
  }

  // Renderiza la tabla con encabezados y filas
  function renderOperationsTable(operations) {
    const listContainer = document.getElementById('operationsList');
    listContainer.innerHTML = ''; // Limpiar contenido previo

    // Crear tabla
    const table = document.createElement('table');
    table.className = 'table table-striped table-sm';

    // Thead
    table.innerHTML = `
      <thead>
        <tr>
          <th>Cliente / Fecha</th>
          <th>Total</th>
          <th>Pendiente</th>
          <th>Ganancia</th>
          <th>Tipo</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    // Ordenar por fecha descendente
    operations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // Tomar solo las 10 primeras
    const opsToShow = operations.slice(0, 10);

    opsToShow.forEach(op => {
      // Determinar la divisa para formatear
      let currencySymbol = '';
      if (op.details && op.details.currency) {
        currencySymbol = getCurrencySymbol(op.details.currency);
      }

      // 1) Cliente y fecha
      const clienteFecha = `
        <td>
          <strong>${op.client}</strong><br />
          <small>${new Date(op.createdAt).toLocaleDateString()}</small>
        </td>
      `;

      // 2) Total
      //   Se asume que op.amount es el total en la divisa
      const totalHTML = `
        <td>
          ${currencySymbol}${formatVES(op.amount)}
        </td>
      `;

      // 3) Pendiente (solo si está incompleta)
      let pendienteHTML = '';
      let pendingValue = 0;
      
      // Verificar si hay detalles y montoPendiente
      if (op.details && op.details.summary) {
        // Corregido: Verificar ambos campos posibles
        if (typeof op.details.summary.montoPendiente !== 'undefined') {
          pendingValue = op.details.summary.montoPendiente;
        } else if (typeof op.details.summary.montoRestante !== 'undefined') {
          pendingValue = op.details.summary.montoRestante;
        }
        
        // Asegurarse de que el estado sea coherente con el monto pendiente
        // Esta es una medida de seguridad por si el estado en la base de datos no está actualizado
        if (pendingValue <= 0 && op.estado !== 'completa') {
          console.warn('Operación con monto pendiente <= 0 pero estado incompleto:', op._id);
          op.estado = 'completa'; // Corregir el estado localmente
        }
        
        if (op.estado === 'incompleta') {
          pendienteHTML = `
            <td>
              ${currencySymbol}${formatVES(pendingValue)}
            </td>
          `;
        } else {
          // Para completadas, podría ser vacío o 0
          pendienteHTML = `<td>-</td>`;
        }
      } else {
        pendienteHTML = `<td>-</td>`;
      }

      // 4) Ganancia
      //   Para ventas: Se usa totalClientProfit
      //   Para canjes: Se usa totalDiferencia
      let ganancia = 0;
      if (op.type === 'venta') {
        // Para ventas usamos la ganancia del cliente guardada en summary
        if (op.details && op.details.summary && op.details.summary.totalClientProfit) {
          ganancia = op.details.summary.totalClientProfit;
        }
      } else if (op.type === 'canje') {
        // Para canjes usamos la diferencia total
        if (op.details && op.details.totalDiferencia) {
          ganancia = op.details.totalDiferencia;
        }
      }
      
      const gananciaHTML = `
        <td>
          ${op.type === 'canje' ? '' : currencySymbol}${formatVES(ganancia)}
        </td>
      `;

      // 5) Tipo (venta o canje)
      const tipoTexto = op.type === 'venta' ? 'Venta' : 
                        (op.type === 'canje' ? `Canje ${op.details?.tipo || ''}` : op.type);
      const tipoHTML = `
        <td>${tipoTexto}</td>
      `;

      // 6) Estado
      const estadoLabel = (op.estado === 'completa') ? 'Completada' : 'Incompleta';
      const estadoBadgeClass = (op.estado === 'completa') ? 'bg-success' : 'bg-warning';
      const estadoHTML = `
        <td>
          <span class="badge ${estadoBadgeClass}">
            ${estadoLabel}
          </span>
        </td>
      `;

      // 7) Acciones
      //    Si incompleta => botón "Completar"
      //    Si completa   => botón "Ver Detalle"
      let accionesHTML = '';
      if (op.estado === 'incompleta') {
        accionesHTML = `
          <td>
            <button class="btn btn-primary btn-sm"
                    data-id="${op._id}">
              Completar
            </button>
          </td>
        `;
      } else {
        accionesHTML = `
          <td>
            <button class="btn btn-secondary btn-sm"
                    data-id="${op._id}">
              Ver Detalle
            </button>
          </td>
        `;
      }

      // Armar la fila
      const row = document.createElement('tr');
      row.innerHTML = clienteFecha + totalHTML + pendienteHTML +
                      gananciaHTML + tipoHTML + estadoHTML + accionesHTML;

      // Agregar listeners a los botones
      const btn = row.querySelector('button');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const operationId = e.target.getAttribute('data-id');
          if (op.estado === 'incompleta') {
            // Redirigir a la venta con ?id=...
            window.location.href = `venta.html?id=${operationId}`;
          } else {
            // Llamar modal con detalles
            showOperationDetailModal(op);
          }
        });
      }

      tbody.appendChild(row);
    });

    listContainer.appendChild(table);
  }

  // Muestra el modal con detalle de la operación
  function showOperationDetailModal(op) {
    const modalTitle = document.getElementById('operationModalLabel');
    const modalBody = document.getElementById('operationModalBody');
    const modalActionButton = document.getElementById('modalActionButton');

    modalTitle.textContent = 'Detalle de Operación';
    
    // Construir HTML con info detallada (puedes ajustarlo a tus necesidades)
    let currencySymbol = '';
    if (op.details && op.details.currency) {
      currencySymbol = getCurrencySymbol(op.details.currency);
    }
    
    // Ejemplo de un mini-resumen
    const total = currencySymbol + formatVES(op.amount);
    const estadoLabel = (op.estado === 'completa') ? 'Completada' : 'Incompleta';

    // Pendiente y ganancia (si existen)
    let pendingValue = 0;
    if (op.estado === 'incompleta') {
      // Corregido: Verificar ambos campos posibles
      if (op.details?.summary?.montoPendiente !== undefined) {
        pendingValue = op.details.summary.montoPendiente;
      } else if (op.details?.summary?.montoRestante !== undefined) {
        pendingValue = op.details.summary.montoRestante;
      }
    }
    const pendingStr = currencySymbol + formatVES(pendingValue);

    let ganancia = 0;
    if (op.type === 'venta') {
      // Para ventas usamos la ganancia del cliente guardada en summary
      if (op.details && op.details.summary && op.details.summary.totalClientProfit) {
        ganancia = op.details.summary.totalClientProfit;
      }
    } else if (op.type === 'canje') {
      // Para canjes usamos la diferencia total
      if (op.details && op.details.totalDiferencia) {
        ganancia = op.details.totalDiferencia;
      }
    }
    const gananciaStr = op.type === 'canje' ? formatVES(ganancia) : currencySymbol + formatVES(ganancia);

    modalBody.innerHTML = `
      <p><strong>Cliente:</strong> ${op.client}</p>
      <p><strong>Fecha:</strong> ${new Date(op.createdAt).toLocaleDateString()}</p>
      <p><strong>Tipo:</strong> ${op.type === 'venta' ? 'Venta' : `Canje ${op.details?.tipo || ''}`}</p>
      <p><strong>Estado:</strong> ${estadoLabel}</p>
      <hr>
      <p><strong>Total:</strong> ${total}</p>
      <p><strong>Pendiente:</strong> ${
        op.estado === 'incompleta' ? pendingStr : '-'
      }</p>
      <p><strong>Ganancia:</strong> ${gananciaStr}</p>
    `;

    // Botón en el modal
    if (op.estado === 'incompleta') {
      modalActionButton.textContent = 'Completar';
      modalActionButton.onclick = function() {
        // Redirigir a la venta con ?id=...
        window.location.href = `venta.html?id=${op._id}`;
      };
    } else {
      modalActionButton.textContent = 'Cerrar';
      modalActionButton.onclick = function() {
        // Simplemente cierra el modal
        const modal = bootstrap.Modal.getInstance(
          document.getElementById('operationModal')
        );
        modal.hide();
      };
    }

    // Mostrar modal
    const operationModal = new bootstrap.Modal(
      document.getElementById('operationModal')
    );
    operationModal.show();
    
    // Configurar el botón de generar PDF
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
      generateReportBtn.onclick = function() {
        // Iniciar la generación del PDF
        const reportGenerator = new ReportGenerator();
        reportGenerator.generatePDF(op._id)
          .then(success => {
            if (success) {
              console.log('PDF generado correctamente');
            }
          })
          .catch(error => {
            console.error('Error al generar PDF:', error);
          });
      };
    }
  }

  // Listener para el formulario de filtros
  const filterForm = document.getElementById('filterForm');
  filterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const filterDate = document.getElementById('filterDate').value;
    const filterClient = document.getElementById('filterClient').value;
    const filterType = document.getElementById('filterType').value;
    let query = '?';
    if (filterDate) {
      query += 'date=' + encodeURIComponent(filterDate) + '&';
    }
    if (filterClient) {
      query += 'client=' + encodeURIComponent(filterClient) + '&';
    }
    if (filterType) {
      query += 'type=' + encodeURIComponent(filterType) + '&';
    }
    fetchOperations(query);
  });

  // Carga inicial de operaciones
  fetchOperations();
});
