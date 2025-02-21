document.addEventListener('DOMContentLoaded', function() {
  // Función para formatear montos en formato local (VES, en tu caso)
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
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'USDT':
        return 'USDT ';
      default:
        return ''; // Ajusta si deseas algún símbolo por defecto
    }
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

    // Ordenar por fecha descendente
    operations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Mostrar solo las últimas 10 operaciones
    const opsToShow = operations.slice(0, 10);

    opsToShow.forEach(op => {
      // Intentar leer la moneda desde op.details.currency
      let currencySymbol = '';
      if (op.details && op.details.currency) {
        currencySymbol = getCurrencySymbol(op.details.currency);
      }

      // Crear elemento de la lista
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-start flex-column mb-2';

      // Cabecera e info principal
      // Muestra el nombre del cliente, la fecha y el estado
      let estadoLabel = (op.estado === 'completa') ? 'Completada' : 'Incompleta';
      let estadoBadgeClass = (op.estado === 'completa') ? 'bg-success' : 'bg-warning';

      // Construye HTML interno
      item.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">${op.client}</h5>
            <small>${new Date(op.createdAt).toLocaleDateString()}</small>
          </div>
          <div class="text-end">
            <!-- Monto en la divisa -->
            <p class="mb-0">
              <strong>
                ${currencySymbol}${formatVES(op.amount)} 
              </strong>
            </p>
            <!-- Badge de estado -->
            <span class="badge ${estadoBadgeClass}">${estadoLabel}</span>
          </div>
        </div>
      `;

      // Si la operación está incompleta, agregamos un botón "Completar Operación"
      // que lleve a venta.html?id=ID_DE_LA_OPERACION
      if (op.estado === 'incompleta') {
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-primary btn-sm mt-2';
        completeBtn.textContent = 'Completar Operación';
        completeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          // Redirige a la página de venta con el ID de la operación
          window.location.href = 'venta.html?id=' + op._id;
        });
        item.appendChild(completeBtn);
      }

      // Si la operación está completa, podrías poner un botón "Ver Detalle" o algo similar
      else {
        const detailBtn = document.createElement('button');
        detailBtn.className = 'btn btn-secondary btn-sm mt-2';
        detailBtn.textContent = 'Ver Detalle';
        detailBtn.addEventListener('click', (e) => {
          e.preventDefault();
          // Podrías abrir un modal, o redirigir a una página de detalle
          // Por ahora, simplemente cierras o no haces nada
          alert('Operación ya está completa');
        });
        item.appendChild(detailBtn);
      }

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
