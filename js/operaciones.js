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
    } else {
      // Si ya existe page= en la URL, asegurarse de que tenga el valor correcto
      const pageRegex = /page=(\d+)/;
      if (pageRegex.test(queryParams)) {
        queryParams = queryParams.replace(pageRegex, `page=${currentPage}`);
      }
    }
    
    console.log('Fetching operations with:', queryParams);
    
    fetch('/api/transactions' + queryParams, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      // Verificar si la data viene con el nuevo formato (con paginación)
      if (data.transactions && data.pagination) {
        // Actualizar variables de paginación
        totalItems = data.pagination.total;
        totalPages = data.pagination.pages;
        currentPage = data.pagination.page;
        
        console.log('Datos de paginación recibidos:', {
          total: totalItems,
          pages: totalPages,
          currentPage: currentPage
        });
        
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
      // Mostrar mensaje de error al usuario
      const listContainer = document.getElementById('operationsList');
      if (listContainer) {
        listContainer.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Error al cargar las operaciones. Por favor, intente nuevamente.
          </div>
        `;
      }
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
      if (op.details) {
        // Añadir logs para depuración
        if (op.type === 'canje') {
          console.log(`Operación de canje ${op._id}:`, op);
          console.log(`Estructura de details:`, op.details);
          console.log(`Monto pendiente en details:`, op.details.montoPendiente);
          console.log(`Monto pendiente en details.summary:`, op.details.summary?.montoPendiente);
        }
        
        // Lógica específica según el tipo de operación
        if (op.type === 'venta') {
          // Para operaciones de venta, el monto pendiente está en details.summary
          if (op.details.summary) {
            if (typeof op.details.summary.montoPendiente !== 'undefined') {
              pendingValue = op.details.summary.montoPendiente;
            } else if (typeof op.details.summary.montoRestante !== 'undefined') {
              pendingValue = op.details.summary.montoRestante;
            }
          }
        } else if (op.type === 'canje') {
          // Para operaciones de canje, primero intentamos obtener el monto pendiente directamente de details
          if (typeof op.details.montoPendiente !== 'undefined') {
            pendingValue = op.details.montoPendiente;
            console.log(`Monto pendiente asignado desde details.montoPendiente:`, pendingValue);
          } 
          // Si no está en details, intentamos obtenerlo de details.summary (para compatibilidad con nuevas operaciones)
          else if (op.details.summary && typeof op.details.summary.montoPendiente !== 'undefined') {
            pendingValue = op.details.summary.montoPendiente;
            console.log(`Monto pendiente asignado desde details.summary.montoPendiente:`, pendingValue);
          }
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
            // Redirigir según el tipo de operación
            if (op.type === 'canje') {
              console.log(`Redirigiendo a canje.html para completar operación ${operationId}`);
              // Usar replace para evitar problemas con el historial del navegador
              window.location.replace(`canje.html?id=${operationId}`);
              return; // Detener la ejecución para evitar redirecciones adicionales
            } else {
              console.log(`Redirigiendo a venta.html para completar operación ${operationId}`);
              window.location.href = `venta.html?id=${operationId}`;
            }
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
        // Redirigir según el tipo de operación
        if (op.type === 'canje') {
          console.log(`Redirigiendo a canje.html para completar operación ${op._id}`);
          // Usar replace para evitar problemas con el historial del navegador
          window.location.replace(`canje.html?id=${op._id}`);
          return; // Detener la ejecución para evitar redirecciones adicionales
        } else {
          console.log(`Redirigiendo a venta.html para completar operación ${op._id}`);
          window.location.href = `venta.html?id=${op._id}`;
        }
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
    
    console.log(`Renderizando paginación: Página ${currentPage} de ${totalPages}, Total: ${totalItems}`);
    
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
    
    prevA.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        applyFilters(false); // No resetear la página
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
      
      firstA.addEventListener('click', function(e) {
        e.preventDefault();
        currentPage = 1;
        applyFilters(false); // No resetear la página
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
      
      pageA.addEventListener('click', function(e) {
        e.preventDefault();
        currentPage = i;
        applyFilters(false); // No resetear la página
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
      
      lastA.addEventListener('click', function(e) {
        e.preventDefault();
        currentPage = totalPages;
        applyFilters(false); // No resetear la página
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
    
    nextA.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentPage < totalPages) {
        currentPage++;
        applyFilters(false); // No resetear la página
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
  
  // Variable para controlar el tiempo de espera en la búsqueda dinámica
  let clientSearchTimeout = null;
  
  // Función para aplicar filtros con paginación
  function applyFilters(resetPage = true) {
    // Si resetPage es true, volver a la primera página (comportamiento predeterminado)
    if (resetPage) {
      currentPage = 1;
    }
    
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
    
    // Añadir parámetros de paginación explícitamente
    query += `page=${currentPage}&limit=${itemsPerPage}`;
    
    console.log(`Aplicando filtros: Página ${currentPage} de ${totalPages}, Límite: ${itemsPerPage}`);
    
    // Mostrar indicador de carga
    const listContainer = document.getElementById('operationsList');
    if (listContainer) {
      // Solo mostrar el indicador de carga si no hay contenido previo o en la búsqueda inicial
      if (listContainer.innerHTML === '' || resetPage) {
        listContainer.innerHTML = `
          <div class="text-center p-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Buscando operaciones...</p>
          </div>
        `;
      }
    }
    
    fetchOperations(query);
  }
  
  // Listener para el formulario de filtros
  const filterForm = document.getElementById('filterForm');
  filterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    applyFilters(true); // Reiniciar a la primera página cuando se aplican nuevos filtros
  });
  
  // Listener para búsqueda dinámica en el campo de cliente
  const filterClient = document.getElementById('filterClient');
  filterClient.addEventListener('input', function(e) {
    // Cancelar cualquier búsqueda pendiente
    if (clientSearchTimeout) {
      clearTimeout(clientSearchTimeout);
    }
    
    // Establecer un tiempo de espera para evitar muchas solicitudes seguidas
    clientSearchTimeout = setTimeout(() => {
      applyFilters(true); // Reiniciar a la primera página en cada búsqueda
    }, 300); // Esperar 300ms después de que el usuario deje de escribir
  });
  
  // Agregar un indicador visual para mostrar al usuario que la búsqueda es dinámica
  filterClient.setAttribute('placeholder', 'Escriba para buscar...');
  
  // Mejorar la posición del icono de búsqueda
  const searchIcon = document.createElement('i');
  searchIcon.className = 'fas fa-search search-icon';
  
  // Asegurar que el contenedor tenga la posición correcta
  const filterClientContainer = filterClient.parentNode;
  filterClientContainer.classList.add('position-relative');
  filterClientContainer.appendChild(searchIcon);
  
  // Asegurarnos que Bootstrap no interfiera con el posicionamiento
  setTimeout(() => {
    // A veces Bootstrap sobreescribe los estilos, por lo que aplicamos esto después
    filterClientContainer.style.position = 'relative';
  }, 100);
  
  // Estilos para el icono de búsqueda
  const searchIconStyle = document.createElement('style');
  searchIconStyle.textContent = `
    .search-icon {
      position: absolute;
      right: 10px;
      top: 38px; /* Posición alineada con el centro del input */
      transform: translateY(-50%);
      color: #6c757d;
      pointer-events: none;
      z-index: 5;
    }
    #filterClient {
      padding-right: 30px; /* Espacio para el icono */
    }
    /* Ajuste para asegurarnos que el contenedor tenga la posición correcta */
    .position-relative {
      position: relative !important;
    }
  `;
  document.head.appendChild(searchIconStyle);
  
  // Manejar eventos de redimensionamiento para UI responsiva
  window.addEventListener('resize', function() {
    if (totalPages > 1) {
      renderPagination();
    }
  });

  // Carga inicial de operaciones
  applyFilters();
  
  // Añadir un mensaje en la parte superior del formulario de filtros
  const filterFormHeader = document.querySelector('.card-header h5');
  if (filterFormHeader) {
    filterFormHeader.innerHTML = 'Filtrar Operaciones <small class="text-muted">(El campo cliente actualiza en tiempo real)</small>';
  }
});
