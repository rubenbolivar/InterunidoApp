/**
 * canje.js
 * Manejo de Canje de Divisas con 3 Stages:
 *  - Stage 1: Cliente, Tipo de Canje, Monto (total)
 *  - Stage 2: Varias transacciones, cada una con:
 *      Nombre Operador, Monto (parcial), Comisión Costo (%), Comisión Venta (%), Diferencia
 *  - Stage 3: Resumen final. Si es Externo, se hace la distribución 5% nómina + (30%,30%,40%).
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Referencias Stage 1
    const operationForm = document.getElementById('operationForm');
    const clientNameInput = document.getElementById('clientName');
    const swapTypeSelect = document.getElementById('swapType');
    const totalAmountInput = document.getElementById('totalAmount');
  
    // Stage 2
    const stage2 = document.getElementById('stage2');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const transactionsContainer = document.getElementById('transactionsContainer');
  
    // Stage 3
    const stage3 = document.getElementById('stage3');
    const resultadoOperacionDiv = document.getElementById('resultadoOperacion');
    const saveOperationBtn = document.getElementById('saveOperationBtn');
  
    // Datos globales de la operación
    let operationData = {
      cliente: '',
      tipo: '',
      montoTotal: 0,      // tomado del Stage 1
      transacciones: [],   // array de transacciones parciales
      transaccionesPrevias: [], // transacciones de operación existente
      operacionExistenteId: null, // ID de operación existente si estamos completando
      totalParcial: 0,
      totalDiferencia: 0
    };

    // Cargar operación existente si hay un ID en la URL
    await loadExistingOperation();

    // Función para cargar una operación existente
    async function loadExistingOperation() {
      const urlParams = new URLSearchParams(window.location.search);
      const operationId = urlParams.get('id');
      
      if (!operationId) {
        // No hay operación para cargar
        return;
      }
      
      operationData.operacionExistenteId = operationId;
      
      try {
        // Obtener el token de autenticación
        const token = localStorage.getItem('auth_token');
        if (!token) {
          alert('No hay sesión activa. Por favor, inicie sesión.');
          window.location.href = 'login.html';
          return;
        }
        
        // Hacer fetch de la operación
        const response = await fetch(`/api/transactions/${operationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error al cargar la operación: ${response.status}`);
        }
        
        const operation = await response.json();
        console.log('Operación cargada:', operation);
        
        // Verificar que sea una operación de canje
        if (operation.type !== 'canje') {
          alert('La operación cargada no es de tipo canje.');
          window.location.href = 'operaciones.html';
          return;
        }
        
        // Guardar las transacciones previas
        operationData.transaccionesPrevias = operation.details?.transacciones || [];
        console.log('Transacciones previas:', operationData.transaccionesPrevias);
        
        // Cargar datos de la operación
        operationData.cliente = operation.client;
        operationData.tipo = operation.details?.tipo || '';
        operationData.montoTotal = operation.amount;
        
        // Calcular el monto ya procesado
        const montoYaProcesado = operationData.transaccionesPrevias.reduce(
          (total, t) => total + (t.monto || 0), 0
        );
        
        // Calcular monto pendiente
        const montoPendiente = Math.max(0, operationData.montoTotal - montoYaProcesado);
        
        // Precargar los campos del formulario
        clientNameInput.value = operationData.cliente;
        swapTypeSelect.value = operationData.tipo;
        totalAmountInput.value = montoPendiente;
        
        // Mostrar mensaje informativo
        showNotification(`Operación de canje cargada. Monto pendiente: ${montoPendiente.toFixed(2)}`, 'info');
        
        // Renderizar las transacciones previas
        renderPreviousTransactions();
        
      } catch (error) {
        console.error('Error al cargar la operación:', error);
        alert(`Error al cargar la operación: ${error.message}`);
      }
    }
    
    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
      const alertDiv = document.createElement('div');
      alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
      alertDiv.role = 'alert';
      alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      
      // Insertar la alerta al principio del contenido principal
      const mainContent = document.querySelector('main');
      if (mainContent && mainContent.firstChild) {
        mainContent.insertBefore(alertDiv, mainContent.firstChild);
      }
      
      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
      }, 5000);
    }
    
    // Renderizar transacciones previas
    function renderPreviousTransactions() {
      if (!operationData.transaccionesPrevias || operationData.transaccionesPrevias.length === 0) {
        return;
      }
      
      // Mostrar Stage 2 y Stage 3
      stage2.style.display = 'block';
      stage3.style.display = 'block';
      
      // Mostrar el botón de guardar operación
      saveOperationBtn.style.display = 'block';
      
      // Crear HTML para las transacciones previas
      let html = '<div class="previous-transactions mb-4"><h5>Transacciones Previas</h5>';
      
      operationData.transaccionesPrevias.forEach((t, index) => {
        html += `
          <div class="transaction-item card mb-2 previous-transaction">
            <div class="card-body">
              <h6 class="card-title">Transacción Previa ${index + 1} - ${t.operatorName || 'Sin operador'}</h6>
              <table class="table table-sm">
                <tr>
                  <td>Operador</td>
                  <td class="text-end">${t.operatorName}</td>
                </tr>
                <tr>
                  <td>Monto</td>
                  <td class="text-end">${t.monto.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Comisión Costo (%)</td>
                  <td class="text-end">${t.comisionCosto.toFixed(2)}%</td>
                </tr>
                <tr>
                  <td>Comisión Venta (%)</td>
                  <td class="text-end">${t.comisionVenta.toFixed(2)}%</td>
                </tr>
                <tr>
                  <td>Diferencia</td>
                  <td class="text-end">${t.diferencia.toFixed(2)}</td>
                </tr>
              </table>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      
      // Añadir al contenedor de resultado
      resultadoOperacionDiv.innerHTML = html;
    }
  
    // Escuchar submit del Stage 1
    operationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Capturar datos
      const cliente = clientNameInput.value.trim();
      const tipo = swapTypeSelect.value;
      const montoTotal = parseFloat(totalAmountInput.value) || 0;
  
      if (!cliente || !tipo || montoTotal <= 0) {
        alert('Por favor, complete todos los campos y asegúrese de que el monto sea > 0');
        return;
      }
  
      // Guardar en operationData
      operationData.cliente = cliente;
      operationData.tipo = tipo;
      operationData.montoTotal = montoTotal;
  
      // Mostrar Stage 2 y Stage 3
      stage2.style.display = 'block';
      stage3.style.display = 'block';
  
      // Limpiar transacciones anteriores, por si acaso
      operationData.transacciones = [];
      transactionsContainer.innerHTML = '';
      
      // Si no hay transacciones previas, mostrar mensaje inicial
      if (!operationData.transaccionesPrevias || operationData.transaccionesPrevias.length === 0) {
        resultadoOperacionDiv.innerHTML = '<p>Aún no hay transacciones de canje.</p>';
      }
    });
  
    // Botón "Agregar Transacción" en Stage 2
    addTransactionBtn.addEventListener('click', () => {
      addTransactionForm();
    });
  
    // Función para crear un formulario de transacción (Stage 2)
    function addTransactionForm() {
      const transId = Date.now(); // ID único
  
      // Estructura del formulario de transacción
      const formDiv = document.createElement('div');
      formDiv.className = 'transaction-form mb-3';
      formDiv.dataset.transId = transId;
  
      formDiv.innerHTML = `
        <h6 class="mb-3">Transacción</h6>
        <div class="mb-3">
          <label class="form-label">Nombre del Operador</label>
          <input type="text" class="form-control operatorName" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Monto (parcial)</label>
          <input type="number" class="form-control monto" step="0.01" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Comisión de Costo (%)</label>
          <input type="number" class="form-control costCommission" step="0.01" placeholder="Ej: 1.20">
        </div>
        <div class="mb-3">
          <label class="form-label">Comisión de Venta (%)</label>
          <input type="number" class="form-control saleCommission" step="0.01" placeholder="Ej: 2.00">
        </div>
        <div class="mb-3">
          <label class="form-label">Diferencia</label>
          <input type="number" class="form-control difference" readonly>
        </div>
        <button type="button" class="btn btn-primary w-100 calculateTransactionBtn">
          Calcular Transacción
        </button>
      `;
  
      transactionsContainer.appendChild(formDiv);
  
      // Event listener para "Calcular Transacción"
      formDiv.querySelector('.calculateTransactionBtn').addEventListener('click', () => {
        calculateTransaction(formDiv);
      });
    }
  
    // Cálculo de una transacción
    function calculateTransaction(formDiv) {
      const operatorName = formDiv.querySelector('.operatorName').value.trim();
      const monto = parseFloat(formDiv.querySelector('.monto').value) || 0;
      const costCommission = parseFloat(formDiv.querySelector('.costCommission').value) || 0;
      const saleCommission = parseFloat(formDiv.querySelector('.saleCommission').value) || 0;
  
      if (!operatorName) {
        alert('Por favor, ingrese el nombre del operador.');
        return;
      }
      if (monto <= 0) {
        alert('El monto parcial debe ser mayor a 0.');
        return;
      }
  
      // Fórmula: diferencia = monto * (comisionVenta - comisionCosto)
      const costDec = costCommission / 100;
      const saleDec = saleCommission / 100;
      const difference = monto * (saleDec - costDec);
  
      // Mostrar en el input
      formDiv.querySelector('.difference').value = difference.toFixed(2);
  
      // Guardar en operationData.transacciones
      const transId = formDiv.dataset.transId;
      const existingIndex = operationData.transacciones.findIndex(t => t.id == transId);
  
      const transactionObj = {
        id: transId,
        operatorName,
        monto,
        comisionCosto: costCommission,
        comisionVenta: saleCommission,
        diferencia: difference
      };
  
      if (existingIndex >= 0) {
        // Actualizar
        operationData.transacciones[existingIndex] = transactionObj;
      } else {
        // Agregar
        operationData.transacciones.push(transactionObj);
      }
  
      // Actualizar el resumen global en Stage 3
      renderGlobalSummary();
    }
  
    // Render del resumen global (Stage 3)
    function renderGlobalSummary() {
      if (operationData.transacciones.length === 0 && operationData.transaccionesPrevias.length === 0) {
        resultadoOperacionDiv.innerHTML = '<p>Aún no hay transacciones de canje.</p>';
        document.getElementById('saveOperationBtn').style.display = 'none';
        return;
      }

      // Calcular totales de las transacciones nuevas
      let totalDiferencia = 0;
      let totalParcial = 0;
      operationData.transacciones.forEach(t => {
        totalParcial += t.monto;
        totalDiferencia += t.diferencia;
      });
      
      // Incluir las transacciones previas en los totales
      if (operationData.transaccionesPrevias && operationData.transaccionesPrevias.length > 0) {
        operationData.transaccionesPrevias.forEach(t => {
          totalParcial += t.monto;
          totalDiferencia += t.diferencia;
        });
      }
      
      // Guardar los totales en operationData para usarlos al guardar
      operationData.totalParcial = totalParcial;
      operationData.totalDiferencia = totalDiferencia;

      // Distribución según el tipo de canje
      let distribucionHTML = '';
      let distribucion = null;
      if (operationData.tipo === 'externo') {
        // 5% nómina
        const nomina = totalDiferencia * 0.05;
        const gananciaTotal = totalDiferencia - nomina;
        const oficinaPZO = gananciaTotal * 0.30;
        const oficinaCCS = gananciaTotal * 0.30;
        const ejecutivo = gananciaTotal * 0.40;

        // Guardar distribución para enviar al servidor
        distribucion = {
          nomina,
          gananciaTotal,
          oficinaPZO,
          oficinaCCS,
          ejecutivo
        };

        distribucionHTML = `
          <h6>Distribución (Externo)</h6>
          <ul>
            <li>Nómina (5%): ${nomina.toFixed(2)}</li>
            <li>Ganancia Total: ${gananciaTotal.toFixed(2)}</li>
            <li>Oficina PZO (30%): ${oficinaPZO.toFixed(2)}</li>
            <li>Oficina CCS (30%): ${oficinaCCS.toFixed(2)}</li>
            <li>Ejecutivo (40%): ${ejecutivo.toFixed(2)}</li>
          </ul>
        `;
      } else if (operationData.tipo === 'interno') {
        // Nueva distribución para canjes internos (70% Sede, 30% Ejecutivo)
        const sede = totalDiferencia * 0.70;
        const ejecutivo = totalDiferencia * 0.30;

        // Guardar distribución para enviar al servidor
        distribucion = {
          sede,
          ejecutivo
        };

        distribucionHTML = `
          <h6>Distribución (Interno)</h6>
          <ul>
            <li>Sede (70%): ${sede.toFixed(2)}</li>
            <li>Ejecutivo (30%): ${ejecutivo.toFixed(2)}</li>
          </ul>
        `;
      }

      // Determinar si los montos coinciden (para mostrar advertencia)
      const montosCoinciden = Math.abs(operationData.montoTotal - totalParcial) < 0.01;
      let advertenciaHTML = '';
      
      if (!montosCoinciden) {
        const montoPendiente = Math.max(0, operationData.montoTotal - totalParcial);
        advertenciaHTML = `
          <div class="alert alert-warning">
            <strong>¡Advertencia!</strong> El monto total (${operationData.montoTotal.toFixed(2)}) 
            no coincide con la suma de las transacciones (${totalParcial.toFixed(2)}).
            <br>Monto pendiente: <strong>${montoPendiente.toFixed(2)}</strong>
          </div>
        `;
      }

      // Información sobre transacciones previas si existen
      let prevTransHTML = '';
      if (operationData.transaccionesPrevias && operationData.transaccionesPrevias.length > 0) {
        const totalPrevio = operationData.transaccionesPrevias.reduce((sum, t) => sum + t.monto, 0);
        const totalNuevo = operationData.transacciones.reduce((sum, t) => sum + t.monto, 0);
        
        prevTransHTML = `
          <div class="mt-3 mb-3">
            <h6>Desglose de Transacciones</h6>
            <ul class="list-group">
              <li class="list-group-item d-flex justify-content-between align-items-center">
                Transacciones previas (${operationData.transaccionesPrevias.length})
                <span class="badge bg-secondary rounded-pill">${totalPrevio.toFixed(2)}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                Nuevas transacciones (${operationData.transacciones.length})
                <span class="badge bg-primary rounded-pill">${totalNuevo.toFixed(2)}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                Total
                <span class="badge bg-success rounded-pill">${totalParcial.toFixed(2)}</span>
              </li>
            </ul>
          </div>
        `;
      }

      // Construir HTML final
      const summaryHTML = `
        <h5>Resumen de la Operación</h5>
        <p>Cliente: <strong>${operationData.cliente}</strong></p>
        <p>Tipo de Canje: <strong>${operationData.tipo}</strong></p>
        <p>Monto Total: <strong>${operationData.montoTotal.toFixed(2)}</strong></p>
        <p>Suma Monto (Transacciones): <strong>${totalParcial.toFixed(2)}</strong></p>
        <p>Total Diferencia: <strong>${totalDiferencia.toFixed(2)}</strong></p>
        ${prevTransHTML}
        ${distribucionHTML}
        ${advertenciaHTML}
      `;

      resultadoOperacionDiv.innerHTML = summaryHTML;
      
      // Mostrar el botón para guardar la operación
      document.getElementById('saveOperationBtn').style.display = 'block';
      
      // Actualizar datos globales con los totales calculados
      if (distribucion) {
        operationData.distribucion = distribucion;
      }
    }

    // Función para guardar la operación en el servidor
    async function saveOperation() {
      // Verificar que haya transacciones
      if (operationData.transacciones.length === 0) {
        alert('No hay transacciones para guardar');
        return;
      }

      // Verificar si los montos coinciden y pedir confirmación si no
      const diferencia = Math.abs(operationData.montoTotal - operationData.totalParcial);
      if (diferencia > 0.01) {
        const confirmar = confirm(`¡Advertencia! El monto total (${operationData.montoTotal.toFixed(2)}) 
        no coincide con la suma de las transacciones (${operationData.totalParcial.toFixed(2)}). 
        ¿Desea guardar la operación de todas formas?`);
        
        if (!confirmar) return;
      }

      try {
        // Combinar transacciones previas y nuevas si estamos completando una operación
        let todasLasTransacciones = [...operationData.transacciones];
        let montoTotalOperacion = operationData.montoTotal;
        
        if (operationData.operacionExistenteId && operationData.transaccionesPrevias.length > 0) {
          todasLasTransacciones = [...operationData.transaccionesPrevias, ...operationData.transacciones];
          
          // Si estamos completando una operación, el monto total es el de la operación original
          // que ya está en operationData.montoTotal desde loadExistingOperation
        }
        
        // Calcular el monto total de todas las transacciones
        const montoTotalTransacciones = todasLasTransacciones.reduce(
          (total, t) => total + (t.monto || 0), 0
        );
        
        // Calcular el monto pendiente
        const montoPendiente = Math.max(0, montoTotalOperacion - montoTotalTransacciones);
        
        // Determinar si la operación está completa
        const operacionCompleta = Math.abs(montoPendiente) < 0.01;
        
        // Preparar los datos a enviar
        const operationToSave = {
          type: 'canje',
          client: operationData.cliente,
          amount: montoTotalOperacion,
          details: {
            tipo: operationData.tipo,
            transacciones: todasLasTransacciones,
            totalDiferencia: operationData.totalDiferencia,
            montoPendiente: montoPendiente,
            summary: {
              montoPendiente: montoPendiente
            }
          },
          estado: operacionCompleta ? 'completa' : 'incompleta'
        };

        // Añadir distribucion si existe (para tipo externo)
        if (operationData.distribucion) {
          operationToSave.details.distribucion = operationData.distribucion;
        }

        // Obtener el token de autenticación
        const token = localStorage.getItem('auth_token');
        if (!token) {
          alert('No hay sesión activa. Por favor, inicie sesión.');
          window.location.href = 'login.html';
          return;
        }

        // Determinar si es una operación nueva o una actualización
        let url = '/api/transactions';
        let method = 'POST';
        
        if (operationData.operacionExistenteId) {
          url = `/api/transactions/${operationData.operacionExistenteId}`;
          method = 'PUT';
        }
        
        console.log(`Enviando ${method} a ${url}`, operationToSave);

        // Enviar al servidor
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(operationToSave)
        });

        if (!response.ok) {
          throw new Error(`Error al guardar: ${response.status}`);
        }

        const savedOperation = await response.json();
        
        // Mostrar mensaje de éxito y redireccionar a operaciones
        alert('Operación guardada correctamente');
        window.location.href = 'operaciones.html';
        
      } catch (error) {
        console.error('Error al guardar la operación:', error);
        alert(`Error al guardar la operación: ${error.message}`);
      }
    }

    // Event listener para el botón de guardar operación
    saveOperationBtn.addEventListener('click', saveOperation);
  });