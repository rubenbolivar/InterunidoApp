document.addEventListener('DOMContentLoaded', function() {
    // Datos simulados de operaciones (en un futuro, estos se obtendrán desde un API)
    let operations = [
      { id: 1, fecha: '2023-10-05', cliente: 'Juan Pérez', tipo: 'venta', monto: 1000, estado: 'completa' },
      { id: 2, fecha: '2023-10-05', cliente: 'María García', tipo: 'canje', monto: 500, estado: 'incompleta' },
      { id: 3, fecha: '2023-10-04', cliente: 'Carlos López', tipo: 'venta', monto: 750, estado: 'completa' },
      { id: 4, fecha: '2023-10-04', cliente: 'Ana Torres', tipo: 'canje', monto: 1200, estado: 'incompleta' },
      { id: 5, fecha: '2023-10-03', cliente: 'Luis Gómez', tipo: 'venta', monto: 2000, estado: 'completa' },
      { id: 6, fecha: '2023-10-03', cliente: 'Elena Díaz', tipo: 'canje', monto: 800, estado: 'completa' },
      { id: 7, fecha: '2023-10-02', cliente: 'Pedro Ruiz', tipo: 'venta', monto: 600, estado: 'incompleta' },
      { id: 8, fecha: '2023-10-02', cliente: 'Sofía Martínez', tipo: 'canje', monto: 900, estado: 'completa' },
      { id: 9, fecha: '2023-10-01', cliente: 'Miguel Álvarez', tipo: 'venta', monto: 1500, estado: 'completa' },
      { id: 10, fecha: '2023-10-01', cliente: 'Laura Sánchez', tipo: 'canje', monto: 1100, estado: 'incompleta' },
      { id: 11, fecha: '2023-09-30', cliente: 'Jorge Martínez', tipo: 'venta', monto: 950, estado: 'completa' }
    ];
  
    // Función para formatear montos en VES
    function formatCurrency(amount) {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES'
      }).format(amount);
    }
  
    // Renderiza la lista de operaciones filtradas
    function renderOperationsList(filteredOps) {
      const listContainer = document.getElementById('operationsList');
      listContainer.innerHTML = '';
  
      // Ordenar por fecha descendente
      filteredOps.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      // Mostrar solo las últimas 10 operaciones
      const opsToShow = filteredOps.slice(0, 10);
  
      opsToShow.forEach(op => {
        const item = document.createElement('a');
        item.href = "#";
        item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        
        // Diferenciar visualmente según tipo (añadimos una pequeña barra lateral de color)
        let iconHTML = '';
        if (op.tipo === 'venta') {
          item.classList.add('venta-operation');
          iconHTML = `<i class="fas fa-dollar-sign me-2 text-success"></i>`;
        } else if (op.tipo === 'canje') {
          item.classList.add('canje-operation');
          iconHTML = `<i class="fas fa-exchange-alt me-2 text-primary"></i>`;
        }
        
        item.innerHTML = iconHTML + `<div>
          <strong>${op.cliente}</strong><br>
          <small>${op.fecha}</small>
        </div>
        <div>
          <span class="badge bg-secondary me-2">${formatCurrency(op.monto)}</span>
          <span class="badge ${op.estado === 'completa' ? 'bg-success' : 'bg-warning'}">${op.estado}</span>
        </div>`;
  
        // Al hacer clic, abrir modal según el estado de la operación
        item.addEventListener('click', function(e) {
          e.preventDefault();
          if (op.estado === 'incompleta') {
            showOperationModal(op, 'add');
          } else {
            showOperationModal(op, 'view');
          }
        });
  
        listContainer.appendChild(item);
      });
    }
  
    // Función para mostrar el modal (usando Bootstrap)
    function showOperationModal(operation, mode) {
      const modalTitle = document.getElementById('operationModalLabel');
      const modalBody = document.getElementById('operationModalBody');
      const modalActionButton = document.getElementById('modalActionButton');
  
      if (mode === 'add') {
        modalTitle.textContent = 'Agregar Transacción';
        modalBody.innerHTML = `
          <p>La operación con ID ${operation.id} para <strong>${operation.cliente}</strong> está incompleta.</p>
          <p>Monto: ${formatCurrency(operation.monto)}</p>
          <p>Estado: ${operation.estado}</p>
          <p>Aquí puedes agregar una nueva transacción para completar la operación.</p>
        `;
        modalActionButton.textContent = 'Agregar Transacción';
        modalActionButton.onclick = function() {
          // Redirige a la página para agregar una transacción (por ejemplo, venta.html o un modal adicional)
          window.location.href = 'venta.html';
        };
      } else {
        modalTitle.textContent = 'Resumen de Operación';
        modalBody.innerHTML = `
          <p>La operación con ID ${operation.id} para <strong>${operation.cliente}</strong> está completa.</p>
          <p>Monto: ${formatCurrency(operation.monto)}</p>
          <p>Estado: ${operation.estado}</p>
        `;
        modalActionButton.textContent = 'Ver Detalle';
        modalActionButton.onclick = function() {
          // Redirige a una página de detalle de la operación (si existe)
          window.location.href = 'detalleOperacion.html?id=' + operation.id;
        };
      }
      // Mostrar el modal
      const operationModal = new bootstrap.Modal(document.getElementById('operationModal'));
      operationModal.show();
    }
  
    // Filtro: aplicar al enviar el formulario de filtros
    const filterForm = document.getElementById('filterForm');
    filterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const filterDate = document.getElementById('filterDate').value;
      const filterClient = document.getElementById('filterClient').value.toLowerCase();
      const filterType = document.getElementById('filterType').value;
      
      let filteredOps = operations;
      if (filterDate) {
        filteredOps = filteredOps.filter(op => op.fecha === filterDate);
      }
      if (filterClient) {
        filteredOps = filteredOps.filter(op => op.cliente.toLowerCase().includes(filterClient));
      }
      if (filterType) {
        filteredOps = filteredOps.filter(op => op.tipo === filterType);
      }
      renderOperationsList(filteredOps);
    });
  
    // Render inicial: mostrar todas las operaciones (últimas 10)
    renderOperationsList(operations);
  });
  