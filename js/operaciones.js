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

      // Construir el contenido del item. Se usa op.client, op.amount, op.createdAt y op.estado (si existe)
      item.innerHTML = iconHTML + `<div>
        <strong>${op.client}</strong><br>
        <small>${new Date(op.createdAt).toLocaleDateString()}</small>
      </div>
      <div>
        <span class="badge bg-secondary me-2">${formatCurrency(op.amount)}</span>
        <span class="badge ${op.estado === 'completa' ? 'bg-success' : 'bg-warning'}">
          ${op.estado ? op.estado : 'desconocido'}
        </span>
      </div>`;

      // Al hacer clic, se muestra un modal con el detalle de la operación
      item.addEventListener('click', function(e) {
        e.preventDefault();
        // Se asume que si la operación está marcada como "incompleta", se usará el modo 'add'
        if (op.estado === 'incompleta') {
          showOperationModal(op, 'add');
        } else {
          showOperationModal(op, 'view');
        }
      });

      listContainer.appendChild(item);
    });
  }

  // Función para mostrar el modal (usando Bootstrap) con detalles de la operación
  function showOperationModal(operation, mode) {
    const modalTitle = document.getElementById('operationModalLabel');
    const modalBody = document.getElementById('operationModalBody');
    const modalActionButton = document.getElementById('modalActionButton');

    if (mode === 'add') {
      modalTitle.textContent = 'Agregar Transacción';
      modalBody.innerHTML = `
        <p>La operación con ID ${operation._id} para <strong>${operation.client}</strong> está incompleta.</p>
        <p>Monto: ${formatCurrency(operation.amount)}</p>
        <p>Estado: ${operation.estado}</p>
        <p>Aquí puedes agregar una nueva transacción para completar la operación.</p>
      `;
      modalActionButton.textContent = 'Agregar Transacción';
      modalActionButton.onclick = function() {
        // Redirige a la página para agregar transacción (ej. venta.html)
        window.location.href = 'venta.html';
      };
    } else {
      modalTitle.textContent = 'Resumen de Operación';
      modalBody.innerHTML = `
        <p>La operación con ID ${operation._id} para <strong>${operation.client}</strong> está completa.</p>
        <p>Monto: ${formatCurrency(operation.amount)}</p>
        <p>Estado: ${operation.estado}</p>
      `;
      // Comentamos o reemplazamos el botón "Ver Detalle" para evitar el 404
      modalActionButton.textContent = 'Cerrar';
      modalActionButton.onclick = function() {
        // Simplemente cierra el modal
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
