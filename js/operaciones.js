document.addEventListener('DOMContentLoaded', function() {
  // 1) Formatear montos en formato local (ej: VES)
  function formatVES(amount) {
    return new Intl.NumberFormat('es-VE', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(amount);
  }

  // 2) Obtener símbolo según la divisa (ajusta si usas otras)
  function getCurrencySymbol(currency) {
    switch ((currency || '').toUpperCase()) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'USDT':
        return 'USDT ';
      default:
        return ''; 
    }
  }

  // 3) Obtener token de autenticación
  function getAuthToken() {
    return localStorage.getItem('auth_token');
  }

  // 4) Petición a la API para obtener operaciones
  function fetchOperations(queryParams = '') {
    const token = getAuthToken();
    fetch('/api/transactions' + queryParams, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(response => response.json())
    .then(data => {
      renderOperationsList(data);
    })
    .catch(error => {
      console.error('Error al obtener operaciones:', error);
    });
  }

  // 5) Renderizar la lista de operaciones
  function renderOperationsList(operations) {
    const listContainer = document.getElementById('operationsList');
    listContainer.innerHTML = '';

    // Ordenar por fecha descendente
    operations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Mostrar solo las últimas 10
    const opsToShow = operations.slice(0, 10);

    opsToShow.forEach(op => {
      // a) Intentar leer divisa de op.details.currency
      let currencySymbol = '';
      if (op.details && op.details.currency) {
        currencySymbol = getCurrencySymbol(op.details.currency);
      }

      // b) Calcular “monto pendiente” si existiera en op.details o en op.details.summary
      let pendingStr = '-'; // Valor por defecto
      if (op.details && typeof op.details.remaining === 'number') {
        pendingStr = currencySymbol + formatVES(op.details.remaining);
      } 
      else if (op.details && op.details.summary && typeof op.details.summary.remaining === 'number') {
        pendingStr = currencySymbol + formatVES(op.details.summary.remaining);
      }

      // c) Calcular “ganancia” si existiera en op.details.summary
      let gainStr = '-';
      if (op.details && op.details.summary && typeof op.details.summary.totalClientProfit === 'number') {
        gainStr = currencySymbol + formatVES(op.details.summary.totalClientProfit);
      }

      // d) Tipo de operación
      let tipo = (op.type || '').toUpperCase(); 
      // Podrías dejarlo en minúsculas o capitalizarlo.

      // e) Estado y su badge
      let estadoLabel = (op.estado === 'completa') ? 'Completada' : 'Incompleta';
      let estadoBadgeClass = (op.estado === 'completa') ? 'bg-success' : 'bg-warning';

      // f) Crear el contenedor de la operación
      const item = document.createElement('div');
      item.className = 'list-group-item mb-2';

      // g) Construir HTML con las columnas solicitadas
      // Usamos un layout de filas/columnas con Bootstrap (row + col)
      item.innerHTML = `
        <div class="row align-items-center">
          <!-- Col: Cliente y Fecha -->
          <div class="col-12 col-md-3">
            <h6 class="mb-0">${op.client}</h6>
            <small>${new Date(op.createdAt).toLocaleDateString()}</small>
          </div>

          <!-- Col: Monto Total -->
          <div class="col-6 col-md-2 text-end">
            <strong>${currencySymbol}${formatVES(op.amount)}</strong>
          </div>

          <!-- Col: Monto Pendiente -->
          <div class="col-6 col-md-2 text-end">
            <span class="text-muted">${pendingStr}</span>
          </div>

          <!-- Col: Ganancia -->
          <div class="col-6 col-md-2 text-end">
            <span class="text-muted">${gainStr}</span>
          </div>

          <!-- Col: Tipo Operación -->
          <div class="col-6 col-md-1 text-end">
            <span class="badge bg-info">${tipo}</span>
          </div>

          <!-- Col: Estado -->
          <div class="col-6 col-md-1 text-end">
            <span class="badge ${estadoBadgeClass}">${estadoLabel}</span>
          </div>

          <!-- Col: Botón -->
          <div class="col-12 col-md-1 text-end mt-2 mt-md-0" id="operationAction">
          </div>
        </div>
      `;

      // h) Botón de acción según el estado
      const actionCol = item.querySelector('#operationAction');
      if (op.estado === 'incompleta') {
        // Botón "Completar Operación"
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-primary btn-sm';
        completeBtn.textContent = 'Completar';
        completeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          // Redirige a la página de venta o canje con el ID
          // Ajusta la lógica según si op.type === 'venta' o 'canje'
          if (op.type === 'venta') {
            window.location.href = 'venta.html?id=' + op._id;
          } else {
            window.location.href = 'canje.html?id=' + op._id;
          }
        });
        actionCol.appendChild(completeBtn);

      } else {
        // Botón "Ver Detalle"
        const detailBtn = document.createElement('button');
        detailBtn.className = 'btn btn-secondary btn-sm';
        detailBtn.textContent = 'Ver Detalle';
        detailBtn.addEventListener('click', (e) => {
          e.preventDefault();
          // Abre modal con detalle
          showOperationDetailModal(op);
        });
        actionCol.appendChild(detailBtn);
      }

      // i) Agregar el item al contenedor
      listContainer.appendChild(item);
    });
  }

  // 6) Mostrar detalle de la operación en un modal
  function showOperationDetailModal(op) {
    const modalTitle = document.getElementById('operationModalLabel');
    const modalBody = document.getElementById('operationModalBody');
    const modalActionButton = document.getElementById('modalActionButton');

    modalTitle.textContent = 'Detalle de la Operación';

    // Intentar extraer información de op.details
    let currencySymbol = '';
    if (op.details && op.details.currency) {
      currencySymbol = getCurrencySymbol(op.details.currency);
    }

    let html = `
      <p><strong>Cliente:</strong> ${op.client}</p>
      <p><strong>Fecha:</strong> ${new Date(op.createdAt).toLocaleDateString()}</p>
      <p><strong>Tipo de Operación:</strong> ${op.type}</p>
      <p><strong>Monto Total:</strong> ${currencySymbol}${formatVES(op.amount)}</p>
    `;

    // Monto pendiente
    if (op.details && typeof op.details.remaining === 'number') {
      html += `<p><strong>Monto Pendiente:</strong> ${currencySymbol}${formatVES(op.details.remaining)}</p>`;
    }
    else if (op.details && op.details.summary && typeof op.details.summary.remaining === 'number') {
      html += `<p><strong>Monto Pendiente:</strong> ${currencySymbol}${formatVES(op.details.summary.remaining)}</p>`;
    }

    // Ganancia
    if (op.details && op.details.summary && typeof op.details.summary.totalClientProfit === 'number') {
      html += `<p><strong>Ganancia Cliente:</strong> ${currencySymbol}${formatVES(op.details.summary.totalClientProfit)}</p>`;
    }

    // Transacciones (si existiera un array)
    if (op.details && Array.isArray(op.details.transactions)) {
      html += `<h6 class="mt-3">Transacciones Registradas:</h6>`;
      html += `<ul class="list-group">`;
      op.details.transactions.forEach((t, idx) => {
        html += `
          <li class="list-group-item">
            <strong>Transacción ${idx + 1}:</strong><br>
            Monto: ${t.amountForeign || t.monto || 0} ${op.details.currency || ''}<br>
            Tasa: ${t.sellingRate || 'N/A'} Bs<br>
            Oficina: PZO=${t.distribution?.PZO || 0}, CCS=${t.distribution?.CCS || 0}
          </li>
        `;
      });
      html += `</ul>`;
    }

    modalBody.innerHTML = html;

    // El botón final
    modalActionButton.textContent = 'Cerrar';
    modalActionButton.onclick = function() {
      const operationModal = bootstrap.Modal.getInstance(document.getElementById('operationModal'));
      operationModal.hide();
    };

    // Mostrar modal
    const operationModal = new bootstrap.Modal(document.getElementById('operationModal'));
    operationModal.show();
  }

  // 7) Filtros
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

  // 8) Llamada inicial
  fetchOperations();
});
