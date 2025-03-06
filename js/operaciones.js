document.addEventListener('DOMContentLoaded', function() {
  // Variables globales para paginación
  let currentPage = 1;
  const itemsPerPage = 20;
  let totalItems = 0;
  let totalPages = 0;
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
    
    // Asegurar que los parámetros de paginación estén incluidos
    if (!queryParams.includes('page=')) {
      queryParams += (queryParams ? '&' : '?') + `page=${currentPage}&limit=${itemsPerPage}`;
    }
    
    console.log('Fetching operations with:', queryParams);
    
    fetch('/api/transactions' + queryParams, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(response => response.json())
    .then(data => {
      // Verificar si la data viene con el nuevo formato (con paginación)
      if (data.transactions && data.pagination) {
        // Actualizar variables de paginación
        totalItems = data.pagination.total;
        totalPages = data.pagination.pages;
        currentPage = data.pagination.page;
        
        // Renderizar la tabla con las transacciones
        renderOperationsTable(data.transactions);
        
        // Renderizar controles de paginación
        renderPagination();
      } else {
        // Si aún no se ha actualizado el backend, usar el formato antiguo
        renderOperationsTable(data);
      }
    })
    .catch(error => {
      console.error('Error al obtener operaciones:', error);
    });
  }

  // Renderiza la tabla con encabezados y filas
  function renderOperationsTable(operations) {
    const listContainer = document.getElementById('operationsList');
    listContainer.innerHTML = ''; // Limpiar contenido previo

    // Añadir estilos para mejorar la visualización en dispositivos móviles
    const responsiveStyles = document.createElement('style');
    responsiveStyles.textContent = `
      @media (max-width: 767.98px) {
        .table-responsive-stack {
          width: 100%;
        }
        .table-responsive-stack thead {
          display: none;
        }
        .table-responsive-stack tr {
          display: block;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 15px;
          padding: 8px;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .table-responsive-stack td {
          display: block;
          text-align: left;
          position: relative;
          padding-left: 45%;
          min-height: 40px;
          margin-bottom: 8px;
          border-top: none !important;
        }
        .table-responsive-stack td:before {
          content: attr(data-label);
          position: absolute;
          left: 10px;
          width: 40%;
          padding-right: 10px;
          font-weight: bold;
          text-align: left;
          color: #666;
        }
        .table-responsive-stack td.action-cell {
          padding-left: 10px;
          margin-top: 15px;
          text-align: center;
        }
        .table-responsive-stack td.action-cell button {
          width: 100%;
          padding: 8px;
        }
        /* Colores alternados para las filas en vista móvil */
        .table-responsive-stack tr:nth-child(odd) {
          background-color: #f9f9f9;
        }
      }
    `;
    document.head.appendChild(responsiveStyles);

    // Crear tabla con nueva clase para hacerla responsive
    const table = document.createElement('table');
    table.className = 'table table-striped table-sm table-responsive-stack';

    // Thead (se ocultará en móviles pero es necesario mantenerlo para desktop)
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
    // Ya no limitamos a 10 porque tenemos paginación
    const opsToShow = operations;

    opsToShow.forEach(op => {
      // Determinar la divisa para formatear
      let currencySymbol = '';
      if (op.details && op.details.currency) {
        currencySymbol = getCurrencySymbol(op.details.currency);
      }

      // 1) Cliente y fecha
      const clienteFecha = `
        <td data-label="Cliente/Fecha">
          <strong>${op.client}</strong><br />
          <small>${new Date(op.createdAt).toLocaleDateString()}</small>
        </td>
      `;

      // 2) Total
      //   Se asume que op.amount es el total en la divisa
      const totalHTML = `
        <td data-label="Total">
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
            <td data-label="Pendiente">
              ${currencySymbol}${formatVES(pendingValue)}
            </td>
          `;
        } else {
          // Para completadas, podría ser vacío o 0
          pendienteHTML = `<td data-label="Pendiente">-</td>`;
        }
      } else {
        pendienteHTML = `<td data-label="Pendiente">-</td>`;
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
        <td data-label="Ganancia">
          ${op.type === 'canje' ? '' : currencySymbol}${formatVES(ganancia)}
        </td>
      `;

      // 5) Tipo (venta o canje)
      const tipoTexto = op.type === 'venta' ? 'Venta' : 
                        (op.type === 'canje' ? `Canje ${op.details?.tipo || ''}` : op.type);
      const tipoHTML = `
        <td data-label="Tipo">${tipoTexto}</td>
      `;

      // 6) Estado
      const estadoLabel = (op.estado === 'completa') ? 'Completada' : 'Incompleta';
      const estadoBadgeClass = (op.estado === 'completa') ? 'bg-success' : 'bg-warning';
      const estadoHTML = `
        <td data-label="Estado">
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
          <td data-label="Acciones" class="action-cell">
            <button class="btn btn-primary btn-sm"
                    data-id="${op._id}">
              Completar
            </button>
          </td>
        `;
      } else {
        accionesHTML = `
          <td data-label="Acciones" class="action-cell">
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

  // Nueva función para renderizar controles de paginación
  function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    
    if (!paginationContainer) {
      console.error('No se encontró el contenedor de paginación');
      return;
    }
    
    // Limpiar contenido previo
    paginationContainer.innerHTML = '';
    
    // No mostrar paginación si solo hay una página
    if (totalPages <= 1) {
      paginationContainer.innerHTML = `<div class="text-center text-muted small mt-2">Mostrando ${totalItems} operaciones</div>`;
      return;
    }
    
    // Crear controles de paginación con Bootstrap
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Navegación de páginas');
    nav.className = 'pagination-container';
    
    const ul = document.createElement('ul');
    ul.className = 'pagination pagination-sm justify-content-center flex-wrap';
    
    // Botón Anterior
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    
    const prevA = document.createElement('a');
    prevA.className = 'page-link';
    prevA.href = '#';
    prevA.setAttribute('aria-label', 'Anterior');
    
    // Usar icono para pantallas pequeñas
    const prevIcon = document.createElement('span');
    prevIcon.setAttribute('aria-hidden', 'true');
    prevIcon.innerHTML = '&laquo;';
    prevA.appendChild(prevIcon);
    
    prevA.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        applyFilters();
      }
    });
    
    prevLi.appendChild(prevA);
    ul.appendChild(prevLi);
    
    // Números de página (limitado a 5 para evitar sobrecarga visual)
    const maxVisible = window.innerWidth < 768 ? 3 : 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    // Ajustar startPage si estamos cerca del final
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    // Si hay muchas páginas y no estamos al inicio, mostrar botón para la primera página
    if (startPage > 1) {
      const firstLi = document.createElement('li');
      firstLi.className = 'page-item';
      
      const firstA = document.createElement('a');
      firstA.className = 'page-link';
      firstA.href = '#';
      firstA.textContent = '1';
      
      firstA.addEventListener('click', (e) => {
        e.preventDefault();
        currentPage = 1;
        applyFilters();
      });
      
      firstLi.appendChild(firstA);
      ul.appendChild(firstLi);
      
      // Mostrar puntos suspensivos si no empezamos en la página 2
      if (startPage > 2) {
        const ellipsisLi = document.createElement('li');
        ellipsisLi.className = 'page-item disabled';
        
        const ellipsisSpan = document.createElement('span');
        ellipsisSpan.className = 'page-link';
        ellipsisSpan.innerHTML = '&hellip;';
        
        ellipsisLi.appendChild(ellipsisSpan);
        ul.appendChild(ellipsisLi);
      }
    }
    
    // Botones de páginas numéricas
    for (let i = startPage; i <= endPage; i++) {
      const pageLi = document.createElement('li');
      pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
      
      const pageA = document.createElement('a');
      pageA.className = 'page-link';
      pageA.href = '#';
      pageA.textContent = i;
      pageA.setAttribute('aria-label', `Página ${i}`);
      
      if (i === currentPage) {
        pageA.setAttribute('aria-current', 'page');
      }
      
      pageA.addEventListener('click', (e) => {
        e.preventDefault();
        currentPage = i;
        applyFilters();
      });
      
      pageLi.appendChild(pageA);
      ul.appendChild(pageLi);
    }
    
    // Si hay muchas páginas y no estamos al final, mostrar botón para la última página
    if (endPage < totalPages) {
      // Mostrar puntos suspensivos si no terminamos en la penúltima página
      if (endPage < totalPages - 1) {
        const ellipsisLi = document.createElement('li');
        ellipsisLi.className = 'page-item disabled';
        
        const ellipsisSpan = document.createElement('span');
        ellipsisSpan.className = 'page-link';
        ellipsisSpan.innerHTML = '&hellip;';
        
        ellipsisLi.appendChild(ellipsisSpan);
        ul.appendChild(ellipsisLi);
      }
      
      const lastLi = document.createElement('li');
      lastLi.className = 'page-item';
      
      const lastA = document.createElement('a');
      lastA.className = 'page-link';
      lastA.href = '#';
      lastA.textContent = totalPages;
      
      lastA.addEventListener('click', (e) => {
        e.preventDefault();
        currentPage = totalPages;
        applyFilters();
      });
      
      lastLi.appendChild(lastA);
      ul.appendChild(lastLi);
    }
    
    // Botón Siguiente
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    
    const nextA = document.createElement('a');
    nextA.className = 'page-link';
    nextA.href = '#';
    nextA.setAttribute('aria-label', 'Siguiente');
    
    // Usar icono para pantallas pequeñas
    const nextIcon = document.createElement('span');
    nextIcon.setAttribute('aria-hidden', 'true');
    nextIcon.innerHTML = '&raquo;';
    nextA.appendChild(nextIcon);
    
    nextA.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage < totalPages) {
        currentPage++;
        applyFilters();
      }
    });
    
    nextLi.appendChild(nextA);
    ul.appendChild(nextLi);
    
    nav.appendChild(ul);
    paginationContainer.appendChild(nav);
    
    // Añadir información sobre total de elementos
    const info = document.createElement('div');
    info.className = 'text-center text-muted small mt-2';
    info.textContent = `Mostrando ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, totalItems)} de ${totalItems} operaciones`;
    paginationContainer.appendChild(info);
    
    // Agregar estilos responsivos
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 576px) {
        .pagination .page-link {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
        }
        .pagination-container {
          overflow-x: auto;
          padding-bottom: 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Función para aplicar filtros con paginación
  function applyFilters() {
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
    
    // Añadir parámetros de paginación
    query += `page=${currentPage}&limit=${itemsPerPage}`;
    
    fetchOperations(query);
  }
  
  // Listener para el formulario de filtros
  const filterForm = document.getElementById('filterForm');
  filterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    // Reiniciar a la primera página cuando se aplican nuevos filtros
    currentPage = 1;
    applyFilters();
  });
  
  // Manejar eventos de redimensionamiento para UI responsiva
  window.addEventListener('resize', function() {
    if (totalPages > 1) {
      renderPagination();
    }
  });

  // Carga inicial de operaciones
  fetchOperations();
});
