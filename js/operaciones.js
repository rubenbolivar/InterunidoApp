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
      // Extraer información adicional desde details.summary (si existe)
      const sold = op.details && op.details.summary ? op.details.summary.totalAmount || 0 : 0;
      const pending = op.amount - sold;
      const gananciaCliente = op.details && op.details.summary ? op.details.summary.totalClientProfit || 0 : 0;
      // Determinar estado: si op.estado existe se usa, sino se calcula
      const status = op.estado || (pending === 0 ? 'completa' : 'pendiente');

      const item = document.createElement('a');
      item.href = "#";
      item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';

      // Diferenciar visualmente según el tipo de operación (venta o canje)
      let iconHTML = '';
      if (op.type === 'venta') {
        item.classList.add('venta-operation');
        iconHTML = `<i class="fas fa-dollar-sign me-2 text-success"></i>`;
      } else if (op.type === 'canje') {
        item.classList.add('canje-operation');
        iconHTML = `<i class="fas fa-exchange-alt me-2 text-primary"></i>`;
      }

      // Construir el contenido del item, mostrando cliente, fecha, monto y estado
      item.innerHTML = iconHTML + `<div>
        <strong>${op.client}</strong><br>
        <small>${new Date(op.createdAt).toLocaleDateString()}</small>
      </div>
      <div>
        <span class="badge bg-secondary me-2">${formatCurrency(op.amount)}</span>
        <span class="badge ${status === 'completa' ? 'bg-success' : 'bg-warning'}">
          ${status}
        </span>
      </div>`;

      // Al hacer clic, se muestra un modal con el detalle de la operación y la opción de completar si está pendiente
      item.addEventListener('click', function(e) {
        e.preventDefault();
        showOperationModal(op, status, pending, gananciaCliente);
      });

      listContainer.appendChild(item);
    });
  }

  // Función para mostrar el modal (usando Bootstrap) con detalles de la operación
  function showOperationModal(operation, status, pending, gananciaCliente) {
    const modalTitle = document.getElementById('operationModalLabel');
    const modalBody = document.getElementById('operationModalBody');
    const modalActionButton = document.getElementById('modalActionButton');

    // Extraer datos básicos
    const totalOperacion = formatCurrency(operation.amount);

    // Verificar si en details.summary existen datos de transacciones
    const sold = operation.details && operation.details.summary ? operation.details.summary.totalAmount || 0 : 0;
    const montoVendido = formatCurrency(sold);
    const montoPendiente = formatCurrency(operation.amount - sold);
    const gananciaCli = formatCurrency(gananciaCliente);

    if (status === 'pendiente' || status === 'incompleta') {
      modalTitle.textContent = 'Completar Operación';
      modalBody.innerHTML = `
        <p>Operación ID <strong>${operation._id}</strong> para <strong>${operation.client}</strong></p>
        <p><strong>Total Operación:</strong> ${totalOperacion}</p>
        <p><strong>Monto Vendido:</strong> ${montoVendido}</p>
        <p><strong>Monto Pendiente:</strong> ${montoPendiente}</p>
        <p><strong>Ganancia en Cliente:</strong> ${gananciaCli}</p>
      `;
      modalActionButton.textContent = 'Completar Operación';
      modalActionButton.onclick = function() {
        // Redirige a venta.html con el id de la operación para completar la venta
        window.location.href = 'venta.html?id=' + operation._id;
      };
    } else {
      modalTitle.textContent = 'Resumen de Operación';
      modalBody.innerHTML = `
        <p>Operación ID <strong>${operation._id}</strong> para <strong>${operation.client}</strong> está completa.</p>
        <p><strong>Total Operación:</strong> ${totalOperacion}</p>
        <p><strong>Monto Vendido:</strong> ${montoVendido}</p>
        <p><strong>Ganancia en Cliente:</strong> ${gananciaCli}</p>
      `;
      modalActionButton.textContent = 'Cerrar';
      modalActionButton.onclick = function() {
        const operationModal = bootstrap.Modal.getInstance(document.getElementById('operationModal'));
        operationModal.hide();
      };
    }

    const operationModal = new bootstrap.Modal(document.getElementById('operationModal'));
    operationModal.show();
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
