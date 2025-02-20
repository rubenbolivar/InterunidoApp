document.addEventListener('DOMContentLoaded', function() {
  // Función para formatear montos en VES
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES'
    }).format(amount);
  }

  // Función para obtener el token de autenticación almacenado en localStorage
  function getAuthToken() {
    return localStorage.getItem('auth_token');
  }

  // Función para obtener operaciones desde la API
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

  // Renderiza la lista de operaciones obtenidas de la API
  function renderOperationsList(operations) {
    const listContainer = document.getElementById('operationsList');
    listContainer.innerHTML = '';

    // Ordenar por fecha descendente (se asume que cada operación tiene el campo createdAt)
    operations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Mostrar solo las últimas 10 operaciones
    const opsToShow = operations.slice(0, 10);

    opsToShow.forEach(op => {
      // Calcula datos extra si están en details.summary
      let extraInfoHTML = '';
      if (op.details && op.details.summary) {
        const summary = op.details.summary;
        // Se asume que summary tiene: totalSaleBs, totalAmount (monto vendido) y totalClientProfit.
        // El monto pendiente se calcula como: (operación.total - monto vendido)
        const montoPendiente = op.amount - summary.totalAmount;
        extraInfoHTML = `
          <div class="mt-2 small">
            <div>Total Venta (Bs): ${formatCurrency(summary.totalSaleBs)}</div>
            <div>Monto Vendido: ${formatCurrency(summary.totalAmount)}</div>
            <div>Monto Pendiente: ${formatCurrency(montoPendiente)}</div>
            <div>Ganancia en Cliente: ${formatCurrency(summary.totalClientProfit)}</div>
          </div>
        `;
      }

      const item = document.createElement('a');
      item.href = "#";
      item.className = 'list-group-item list-group-item-action';

      // Icono según el tipo de operación
      let iconHTML = '';
      if (op.type === 'venta') {
        iconHTML = `<i class="fas fa-dollar-sign me-2 text-success"></i>`;
      } else if (op.type === 'canje') {
        iconHTML = `<i class="fas fa-exchange-alt me-2 text-primary"></i>`;
      }

      // Determinar el estado: si no viene definido, podemos asumir "pendiente" para ventas incompletas
      let estado = op.estado ? op.estado : 'pendiente';

      // Construir el contenido del item con datos básicos y extra
      item.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <div>
            ${iconHTML}
            <strong>${op.client}</strong><br>
            <small>${new Date(op.createdAt).toLocaleDateString()}</small>
          </div>
          <div>
            <span class="badge bg-secondary me-2">${formatCurrency(op.amount)}</span>
            <span class="badge ${estado === 'completa' ? 'bg-success' : 'bg-warning'}">
              ${estado}
            </span>
          </div>
        </div>
        ${extraInfoHTML}
      `;

      // Si la operación no está completa, agregar un botón para "Completar Operación"
      if (estado !== 'completa') {
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-sm btn-primary mt-2';
        completeBtn.textContent = 'Completar Operación';
        completeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          // Guardamos la operación en localStorage para que venta.html la cargue y pre-cargue los datos
          localStorage.setItem('ventaPendiente', JSON.stringify(op));
          window.location.href = 'venta.html';
        });
        item.appendChild(completeBtn);
      }

      // En este ejemplo ya no usamos el modal para ver detalles, por lo que
      // podemos dejar el click del item sin acción adicional (o bien agregar alguna otra acción)
      listContainer.appendChild(item);
    });
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

  // Llamada inicial para obtener todas las operaciones
  fetchOperations();
});
