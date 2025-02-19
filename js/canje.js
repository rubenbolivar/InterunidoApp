/**
 * canje.js
 * Manejo de Canje de Divisas con 3 Stages:
 *  - Stage 1: Cliente, Tipo de Canje, Monto (total)
 *  - Stage 2: Varias transacciones, cada una con:
 *      Nombre Operador, Monto (parcial), Comisión Costo (%), Comisión Venta (%), Diferencia
 *  - Stage 3: Resumen final. Si es Externo, se hace la distribución 5% nómina + (30%,30%,40%).
 */

document.addEventListener('DOMContentLoaded', function() {
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
  
    // Datos globales de la operación
    let operationData = {
      cliente: '',
      tipo: '',
      montoTotal: 0,      // tomado del Stage 1
      transacciones: []   // array de transacciones parciales
    };
  
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
      resultadoOperacionDiv.innerHTML = '<p>Aún no hay transacciones de canje.</p>';
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
      if (operationData.transacciones.length === 0) {
        resultadoOperacionDiv.innerHTML = '<p>Aún no hay transacciones de canje.</p>';
        return;
      }
  
      // Calcular totales
      let totalDiferencia = 0;
      let totalParcial = 0;
      operationData.transacciones.forEach(t => {
        totalParcial += t.monto;
        totalDiferencia += t.diferencia;
      });
  
      // Distribución si es Externo
      let distribucionHTML = '';
      if (operationData.tipo === 'externo') {
        // 5% nómina
        const nomina = totalDiferencia * 0.05;
        const gananciaTotal = totalDiferencia - nomina;
        const oficinaPZO = gananciaTotal * 0.30;
        const oficinaCCS = gananciaTotal * 0.30;
        const ejecutivo = gananciaTotal * 0.40;
  
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
      }
  
      // Construir HTML final
      const summaryHTML = `
        <h5>Resumen de la Operación</h5>
        <p>Cliente: <strong>${operationData.cliente}</strong></p>
        <p>Tipo de Canje: <strong>${operationData.tipo}</strong></p>
        <p>Monto Total (Stage 1): <strong>${operationData.montoTotal.toFixed(2)}</strong></p>
        <p>Suma Monto (Transacciones): <strong>${totalParcial.toFixed(2)}</strong></p>
        <p>Total Diferencia (Suma de transacciones): <strong>${totalDiferencia.toFixed(2)}</strong></p>
        ${distribucionHTML}
      `;
  
      resultadoOperacionDiv.innerHTML = summaryHTML;
    }
  
  });
  