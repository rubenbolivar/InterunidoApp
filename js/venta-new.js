/**
 * venta-new.js
 * Maneja la lógica de una operación de Venta de Divisas.
 */
const COMMISSION_FACTORS = {
    '100.0000': 1.0000,
    '100.1000': 1.0010,
    '100.2500': 1.0025,
    '100.3000': 1.0030
  };
  
  const DISTRIBUTION_FACTORS = {
    OFFICE: 0.30,
    EXECUTIVE: 0.40,
    CLIENT: 0.30
  };
  
  const NumberUtils = {
    round: (val, decimals = 2) => {
      return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
    },
    parseAmount: (val) => {
      const p = parseFloat(val);
      return isNaN(p) ? 0 : p;
    }
  };
  
  function mapCurrencyType(userSelection) {
    const val = userSelection.toLowerCase();
    if (val.includes('euro')) {
      return 'EUR';
    } else if (val.includes('usdt')) {
      return 'USDT';
    } else {
      return 'USD';
    }
  }
  
  class TransactionManager {
    constructor() {
      this.transactions = [];
      this.previousTransactions = []; // Transacciones previas en operaciones incompletas
      this.originalTotalAmount = 0;   // Monto original total de la operación
      this.totalAmount = 0;           // Monto total en la divisa para esta sesión
      this.remainingAmount = 0;       // Monto pendiente en la divisa
      this.clientRate = 0;
      this.selectedCurrency = '';
      this.clientName = '';
      this.existingOperationId = null; // Si estamos completando una operación existente
  
      // Enlazar métodos
      this.processTransaction = this.processTransaction.bind(this);
      this.calculateTransaction = this.calculateTransaction.bind(this);
      this.updateGlobalSummary = this.updateGlobalSummary.bind(this);
      this.calculateCommission = this.calculateCommission.bind(this);
      this.submitOperation = this.submitOperation.bind(this);
    }
  
    /**
     * Si NO hay id en la URL, es una operación nueva.
     * Si SÍ hay id, hacemos fetch y precargamos tanto los datos básicos como
     * las transacciones previas.
     */
    async loadOperationIfNeeded() {
      const urlParams = new URLSearchParams(window.location.search);
      const operationId = urlParams.get('id');
      if (!operationId) {
        // Operación nueva
        return;
      }
      this.existingOperationId = operationId;
  
      // Hacer fetch de la operación
      const token = localStorage.getItem('auth_token');
      try {
        const resp = await fetch(`/api/transactions/${operationId}`, {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });
        
        if (!resp.ok) {
          throw new Error(`Error HTTP: ${resp.status}`);
        }
        
        const op = await resp.json();
        console.log('Operación cargada:', op);
    
        // Guardar las transacciones previas
        this.previousTransactions = op.details?.transactions || [];
        console.log('Transacciones previas cargadas:', this.previousTransactions);
        
        // Calcular el monto total original de la operación
        this.originalTotalAmount = op.amount || 0;
        
        // Calcular el monto ya procesado
        const processedAmount = this.previousTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
        
        // Monto pendiente
        const pending = this.originalTotalAmount - processedAmount;
        if (pending < 0) {
          console.warn('El monto pendiente es negativo. Revisa tus datos.');
        }
    
        // Precargar en Stage 1
        this.clientName = op.client;
        this.selectedCurrency = op.details?.currency || 'USD';
        this.clientRate = op.details?.clientRate || 0;
    
        // Configurar el monto pendiente para esta sesión
        this.setTotalAmount(pending);
    
        // Llenar los inputs
        document.getElementById('clientName').value = this.clientName;
        document.getElementById('amountToSell').value = pending;
    
        // Con base en la divisa
        let currencyOption = '';
        switch (this.selectedCurrency) {
          case 'EUR':
            currencyOption = 'Euros en efectivo';
            break;
          case 'USDT':
            currencyOption = 'Binance USDT';
            break;
          default:
            currencyOption = 'Dólares en efectivo';
            break;
        }
        document.getElementById('currencyType').value = currencyOption;
        document.getElementById('clientRate').value = this.clientRate;
    
        // Forzar el cálculo para "Monto que debe recibir el cliente"
        const amountClientReceivesInput = document.getElementById('amountClientReceives');
        const totalBs = pending * this.clientRate;
        amountClientReceivesInput.value = new Intl.NumberFormat('es-VE', {
          style: 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          useGrouping: true
        }).format(totalBs);
        
        // Renderizar las transacciones previas en la UI
        this.renderPreviousTransactions();
        
        // Mostrar un mensaje con el monto restante
        if (pending > 0) {
          const message = `Se ha cargado la operación con ID: ${operationId}. Monto pendiente: ${this.formatForeign(pending)}`;
          this.showNotification(message, 'info');
        } else if (pending === 0) {
          const message = `Esta operación ya está completada. Por favor, cree una nueva operación.`;
          this.showNotification(message, 'warning');
        }
      } catch (error) {
        console.error('Error al cargar la operación:', error);
        this.showNotification('No se pudo cargar la operación. Por favor, intente nuevamente.', 'error');
      }
    }
    
    /**
     * Renderiza las transacciones previas en la UI
     * para que sean visibles en el Stage 3
     */
    renderPreviousTransactions() {
      if (!this.previousTransactions || this.previousTransactions.length === 0) {
        return;
      }
      
      // Mostrar el Stage 3 para que sea visible
      document.getElementById('stage3').style.display = 'block';
      
      // Actualizar el contenido del resultado
      const resultContainer = document.getElementById('resultadoOperacion');
      if (!resultContainer) return;
      
      // Crear HTML para las transacciones previas
      let html = '<div class="previous-transactions mb-4"><h5>Transacciones Previas</h5>';
      this.previousTransactions.forEach((t, index) => {
        html += `
          <div class="transaction-item card mb-2 previous-transaction">
            <div class="card-body">
              <h6 class="card-title">Transacción Previa ${index + 1} - ${t.operatorName || 'Sin operador'}</h6>
              <table class="table table-sm">
                <tr>
                  <td>Monto en ${this.selectedCurrency}</td>
                  <td class="text-end">${this.formatForeign(t.amount || t.amountForeign || 0)}</td>
                </tr>
                <tr>
                  <td>Tasa de Venta (Bs)</td>
                  <td class="text-end">${t.sellingRate || 0}</td>
                </tr>
                <tr>
                  <td>Total de la Venta (Bs)</td>
                  <td class="text-end">${this.formatBs(t.totalSaleBs || 0)}</td>
                </tr>
              </table>
            </div>
          </div>
        `;
      });
      html += '</div>';
      
      // Añadir al contenedor de resultado
      resultContainer.innerHTML = html + resultContainer.innerHTML;
    }
    
    showNotification(message, type = 'info') {
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
  
    setTotalAmount(amount) {
      this.totalAmount = amount;
      this.remainingAmount = amount;
      const transactionsContainer = document.getElementById('transactionsContainer');
      if (transactionsContainer) {
        transactionsContainer.innerHTML = '';
        const firstForm = this.createTransactionForm();
        transactionsContainer.appendChild(firstForm);
      }
      this.updateUI();
    }
  
    createTransactionForm() {
      const form = document.createElement('div');
      form.className = 'transaction-form mb-4';
      form.innerHTML = `
        <div class="mb-3">
          <label class="form-label">Nombre del Operador:</label>
          <input type="text" class="form-control" name="operador" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Monto (${this.selectedCurrency}):</label>
          <input type="number" class="form-control text-end" name="montoTransaccion" step="0.01" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Tasa de Venta (Bs / ${this.selectedCurrency}):</label>
          <input type="number" class="form-control text-end" name="tasaVenta" step="0.0001" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Tasa Oficina (Bs / ${this.selectedCurrency}):</label>
          <input type="number" class="form-control text-end" name="tasaOficina" step="0.0001">
        </div>
        <div class="mb-3">
          <label class="form-label">Selección de Oficinas:</label>
          <div>
            <div class="form-check form-check-inline">
              <input type="checkbox" class="form-check-input" name="oficinaPZO" value="PZO">
              <label class="form-check-label">Oficina PZO</label>
            </div>
            <div class="form-check form-check-inline">
              <input type="checkbox" class="form-check-input" name="oficinaCCS" value="CCS">
              <label class="form-check-label">Oficina CCS</label>
            </div>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Comisión Bancaria:</label>
          <select class="form-select" name="bankCommission">
            <option value="100.0000">100.0000%</option>
            <option value="100.1000">100.1000%</option>
            <option value="100.2500">100.2500%</option>
            <option value="100.3000">100.3000%</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Comisión:</label>
          <input type="text" class="form-control text-end" name="commission" readonly>
        </div>
        <div class="mb-3">
          <label class="form-label">Comisiones Arbitrarias:</label>
          <div class="arbitrary-commissions-container"></div>
          <button type="button" class="btn btn-sm btn-outline-secondary mt-2 add-arbitrary-commission">
            <i class="fas fa-plus"></i> Agregar Comisión
          </button>
        </div>
        <button type="button" class="btn btn-primary w-100 calculate-transaction">
          Calcular Transacción
        </button>
        <button type="button" class="btn btn-secondary w-100 edit-transaction" style="display:none; margin-top: 5px;">
          Editar Transacción
        </button>
        <button type="button" class="btn btn-danger w-100 delete-transaction" style="display:none; margin-top: 5px;">
          Eliminar Transacción
        </button>
      `;
      this.setupFormEventListeners(form);
      return form;
    }
  
    addTransactionForm() {
      const container = document.getElementById('transactionsContainer');
      if (container) {
        container.appendChild(this.createTransactionForm());
      }
    }
  
    setupFormEventListeners(form) {
      const calculateBtn = form.querySelector('.calculate-transaction');
      if (calculateBtn) {
        calculateBtn.addEventListener('click', () => {
          this.processTransaction(form);
        });
      }
      const addCommissionBtn = form.querySelector('.add-arbitrary-commission');
      if (addCommissionBtn) {
        addCommissionBtn.addEventListener('click', () => {
          this.addArbitraryCommissionFields(form);
        });
      }
    }
  
    addArbitraryCommissionFields(form) {
      const container = form.querySelector('.arbitrary-commissions-container');
      if (!container) return;
      const idx = container.children.length;
      const row = document.createElement('div');
      row.className = 'commission-item mb-2 d-flex gap-2';
      row.innerHTML = `
        <input type="text" class="form-control" name="commissionName${idx}" placeholder="Nombre">
        <input type="number" class="form-control" name="commissionPercentage${idx}" placeholder="%" step="0.01">
        <button type="button" class="btn btn-outline-danger remove-commission">
          <i class="fas fa-times"></i>
        </button>
      `;
      container.appendChild(row);
      row.querySelector('.remove-commission').addEventListener('click', () => {
        row.remove();
      });
    }
  
    collectFormData(form) {
      const data = {
        operatorName: form.querySelector('[name="operador"]').value.trim(),
        amount: NumberUtils.parseAmount(form.querySelector('[name="montoTransaccion"]').value),
        sellingRate: NumberUtils.parseAmount(form.querySelector('[name="tasaVenta"]').value),
        officeRate: NumberUtils.parseAmount(form.querySelector('[name="tasaOficina"]').value),
        bankCommission: form.querySelector('[name="bankCommission"]').value,
        selectedOffices: [],
        arbitraryCommissions: []
      };
      if (form.querySelector('[name="oficinaPZO"]')?.checked) data.selectedOffices.push('PZO');
      if (form.querySelector('[name="oficinaCCS"]')?.checked) data.selectedOffices.push('CCS');
  
      // Comisiones arbitrarias
      form.querySelectorAll('.commission-item').forEach(item => {
        const nameInput = item.querySelector('input[type="text"]');
        const percInput = item.querySelector('input[type="number"]');
        if (nameInput && percInput) {
          const nameVal = nameInput.value.trim();
          const percVal = parseFloat(percInput.value) || 0;
          if (nameVal && percVal > 0) {
            data.arbitraryCommissions.push({ name: nameVal, percentage: percVal });
          }
        }
      });
      return data;
    }
  
    processTransaction(form) {
      try {
        const transactionData = this.collectFormData(form);
        if (transactionData.amount > this.remainingAmount) {
          alert(`El monto excede el disponible (${this.remainingAmount} ${this.selectedCurrency})`);
          return;
        }
        const calculation = this.calculateTransaction(transactionData);
        const transaction = {
          id: Date.now(),
          ...transactionData,
          ...calculation,
          totalSaleBs: NumberUtils.round(transactionData.amount * transactionData.sellingRate, 2),
          totalOfficeBs: NumberUtils.round(transactionData.amount * (transactionData.officeRate || 0), 2),
          amountForeign: transactionData.amount
        };
        this.transactions.push(transaction);
  
        form.querySelectorAll('input, select, button:not(.add-arbitrary-commission)').forEach(el => {
          el.disabled = true;
        });
        form.querySelector('.calculate-transaction').style.display = 'none';
        const editBtn = form.querySelector('.edit-transaction');
        const deleteBtn = form.querySelector('.delete-transaction');
        if (editBtn) editBtn.style.display = 'block';
        if (deleteBtn) deleteBtn.style.display = 'block';
  
        this.remainingAmount -= transactionData.amount;
        this.updateUI();
        document.getElementById('stage3').style.display = 'block';
      } catch (error) {
        console.error('Error al procesar la transacción:', error);
        alert(error.message);
      }
    }
  
    calculateTransaction(data) {
      const totalSaleBs = NumberUtils.round(data.amount * data.sellingRate, 2);
      const bankFactor = COMMISSION_FACTORS[data.bankCommission] || 1.0;
      const effectiveRate = (data.officeRate && data.officeRate > 0) ? data.officeRate : this.clientRate;
      const commission = NumberUtils.round(effectiveRate * bankFactor, 4);
      const baseCostBs = NumberUtils.round(data.amount * commission, 2);
      const differenceBs = NumberUtils.round(totalSaleBs - baseCostBs, 2);
  
      let totalArbitraryBs = 0;
      const arbitraryCommissions = data.arbitraryCommissions.map(comm => {
        const commBs = NumberUtils.round(differenceBs * (comm.percentage / 100), 2);
        // IMPORTANTE: Para las comisiones arbitrarias, usamos la tasa de venta (sellingRate)
        // para convertir de bolívares a divisas, NO la tasa de comisión
        const commForeign = NumberUtils.round(commBs / data.sellingRate, 2);
        totalArbitraryBs += commBs;
        return { ...comm, amountBs: commBs, amountForeign: commForeign };
      });
      const differenceAfterCommsBs = NumberUtils.round(differenceBs - totalArbitraryBs, 2);
      
      // Para el monto a distribuir, usamos la tasa de comisión
      const amountToDistributeForeign = (commission > 0)
        ? NumberUtils.round(differenceAfterCommsBs / commission, 2)
        : 0;
  
      const distribution = this.calculateDistribution(data, amountToDistributeForeign);
      return {
        totalSaleBs,
        baseCostBs,
        differenceBs,
        differenceAfterCommsBs,
        amountToDistributeForeign,
        arbitraryCommissions,
        distribution
      };
    }
  
    calculateDistribution(data, amountToDistributeForeign) {
      const distribution = { PZO: 0, CCS: 0, executive: 0, clientProfit: 0 };
      const officeCount = data.selectedOffices.length;
      
      // Si no hay tasa de oficina y no hay oficinas seleccionadas,
      // toda la ganancia va al cliente (como en la transacción sin tasa de oficina)
      if (!data.officeRate && officeCount === 0) {
        distribution.clientProfit = amountToDistributeForeign;
        return distribution;
      }
      
      const officeFactor = (officeCount === 2) ? 0.5 : 1;
      if (officeCount > 0 && amountToDistributeForeign > 0) {
        const officesTotal = NumberUtils.round(amountToDistributeForeign * DISTRIBUTION_FACTORS.OFFICE, 2);
        if (data.selectedOffices.includes('PZO')) {
          distribution.PZO = NumberUtils.round(officesTotal * officeFactor, 2);
        }
        if (data.selectedOffices.includes('CCS')) {
          distribution.CCS = NumberUtils.round(officesTotal * officeFactor, 2);
        }
      }
      
      distribution.executive = NumberUtils.round(amountToDistributeForeign * DISTRIBUTION_FACTORS.EXECUTIVE, 2);
      distribution.clientProfit = NumberUtils.round(amountToDistributeForeign * DISTRIBUTION_FACTORS.CLIENT, 2);
      
      return distribution;
    }
  
    updateUI() {
      this.updateGlobalSummary();
    }
  
    updateGlobalSummary() {
      const resultContainer = document.getElementById('resultadoOperacion');
      if (!resultContainer) return;
      let html = this.renderTransactionsList();
      html += this.renderGlobalSummary();
      resultContainer.innerHTML = html;
    }
  
    renderTransactionsList() {
      if (this.transactions.length === 0) return '';
      let html = '<div class="transactions-list mb-4"><h5>Transacciones</h5>';
      this.transactions.forEach((t, index) => {
        html += `
          <div class="transaction-item card mb-2">
            <div class="card-body">
              <h6 class="card-title">Transacción ${index + 1} - ${t.operatorName}</h6>
              <table class="table table-sm">
                <tr>
                  <td>Monto en ${this.selectedCurrency}</td>
                  <td class="text-end">${this.formatForeign(t.amount)}</td>
                </tr>
                <tr>
                  <td>Tasa de Venta (Bs)</td>
                  <td class="text-end">${t.sellingRate}</td>
                </tr>
                <tr>
                  <td>Total de la Venta (Bs)</td>
                  <td class="text-end">${this.formatBs(t.totalSaleBs)}</td>
                </tr>
                <tr>
                  <td>Diferencia (Bs)</td>
                  <td class="text-end">${this.formatBs(t.differenceBs)}</td>
                </tr>
                ${this.renderArbitraryCommissionsRows(t.arbitraryCommissions)}
                <tr>
                  <td>Monto a Repartir (después de comisiones)</td>
                  <td class="text-end">${this.formatForeign(t.amountToDistributeForeign)}</td>
                </tr>
                ${this.renderDistributionRows(t.distribution)}
              </table>
            </div>
          </div>
        `;
      });
      return html + '</div>';
    }
  
    renderArbitraryCommissionsRows(arbitraryCommissions) {
      if (!arbitraryCommissions || arbitraryCommissions.length === 0) return '';
      let html = `
        <tr><td colspan="2" class="commission-header">Comisiones Arbitrarias</td></tr>
      `;
      arbitraryCommissions.forEach(comm => {
        html += `
          <tr>
            <td>${comm.name} (${comm.percentage}%)</td>
            <td class="text-end">${this.formatForeign(comm.amountForeign)}</td>
          </tr>
        `;
      });
      return html;
    }
  
    renderDistributionRows(distribution) {
      let html = '';
      if (distribution.PZO) {
        html += `
          <tr>
            <td>Oficina PZO</td>
            <td class="text-end">${this.formatForeign(distribution.PZO)}</td>
          </tr>
        `;
      }
      if (distribution.CCS) {
        html += `
          <tr>
            <td>Oficina CCS</td>
            <td class="text-end">${this.formatForeign(distribution.CCS)}</td>
          </tr>
        `;
      }
      html += `
        <tr>
          <td>Ejecutivo</td>
          <td class="text-end">${this.formatForeign(distribution.executive)}</td>
        </tr>
        <tr>
          <td>Ganancia en Cliente</td>
          <td class="text-end">${this.formatForeign(distribution.clientProfit)}</td>
        </tr>
      `;
      return html;
    }
  
    renderGlobalSummary() {
      const totals = this.calculateGlobalTotals();
      return `
        <div class="global-summary mt-4">
          <h5 class="mb-3">Totales de la Operación</h5>
          <table class="table table-sm">
            ${this.renderGlobalTotalsRows(totals)}
          </table>
        </div>
      `;
    }
  
    calculateGlobalTotals() {
      return this.transactions.reduce((acc, t) => {
        const sumArbForeign = t.arbitraryCommissions.reduce((s, c) => s + c.amountForeign, 0);
        return {
          totalAmount: acc.totalAmount + t.amount,
          totalArbitrary: acc.totalArbitrary + sumArbForeign,
          totalClientProfit: acc.totalClientProfit + t.distribution.clientProfit,
          totalExecutive: acc.totalExecutive + t.distribution.executive,
          totalPZO: acc.totalPZO + (t.distribution.PZO || 0),
          totalCCS: acc.totalCCS + (t.distribution.CCS || 0),
          totalSaleBs: acc.totalSaleBs + t.totalSaleBs,
          totalOfficeBs: acc.totalOfficeBs + t.totalOfficeBs
        };
      }, {
        totalAmount: 0,
        totalArbitrary: 0,
        totalClientProfit: 0,
        totalExecutive: 0,
        totalPZO: 0,
        totalCCS: 0,
        totalSaleBs: 0,
        totalOfficeBs: 0
      });
    }
  
    renderGlobalTotalsRows(totals) {
      return `
        <tr>
          <td>Total Venta (Bs)</td>
          <td class="text-end">${this.formatBs(totals.totalSaleBs)}</td>
        </tr>
        <tr>
          <td>Total Comisiones Arbitrarias</td>
          <td class="text-end">${this.formatForeign(totals.totalArbitrary)}</td>
        </tr>
        <tr>
          <td>Total Ganancia en Cliente</td>
          <td class="text-end">${this.formatForeign(totals.totalClientProfit)}</td>
        </tr>
        <tr>
          <td>Total Ejecutivo</td>
          <td class="text-end">${this.formatForeign(totals.totalExecutive)}</td>
        </tr>
        ${totals.totalPZO > 0 ? `
          <tr>
            <td>Total Oficina PZO</td>
            <td class="text-end">${this.formatForeign(totals.totalPZO)}</td>
          </tr>
        ` : ''}
        ${totals.totalCCS > 0 ? `
          <tr>
            <td>Total Oficina CCS</td>
            <td class="text-end">${this.formatForeign(totals.totalCCS)}</td>
          </tr>
        ` : ''}
        <tr>
          <td>Monto Total Operación</td>
          <td class="text-end">${this.formatForeign(this.totalAmount)}</td>
        </tr>
        <tr>
          <td>Monto Vendido</td>
          <td class="text-end">${this.formatForeign(totals.totalAmount)}</td>
        </tr>
        <tr>
          <td>Monto Restante</td>
          <td class="text-end">${this.formatForeign(this.remainingAmount)}</td>
        </tr>
      `;
    }
  
    // Formatear en la divisa
    formatForeign(value) {
      let symbol = '$';
      if (this.selectedCurrency === 'EUR') {
        symbol = '€';
      } else if (this.selectedCurrency === 'USDT') {
        symbol = 'USDT ';
      }
      return symbol + new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
      }).format(value);
    }
  
    // Formatear en Bs
    formatBs(value) {
      return new Intl.NumberFormat('es-VE', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
      }).format(value);
    }
  
    calculateCommission(form) {
      const sellingRate = parseFloat(form.querySelector('[name="tasaVenta"]').value) || 0;
      const officeRate = parseFloat(form.querySelector('[name="tasaOficina"]').value) || 0;
      const bankCommissionStr = form.querySelector('[name="bankCommission"]').value;
      const bankFactor = COMMISSION_FACTORS[bankCommissionStr] || 1.0;
      const effectiveRate = officeRate > 0 ? officeRate : this.clientRate;
      const commissionValue = NumberUtils.round(effectiveRate * bankFactor, 4);
      const commissionField = form.querySelector('[name="commission"]');
      if (commissionField) {
        commissionField.value = commissionValue.toFixed(4);
      }
    }
  
    // Enviar la operación a la API
    submitOperation() {
      // Construir el payload final
      const globalTotals = this.calculateGlobalTotals();
      
      // Determinar qué transacciones enviar al backend
      let allTransactions = [...this.transactions]; // Por defecto, solo las nuevas
      let montoTotal = this.totalAmount;
      let montoPendiente = NumberUtils.round(this.remainingAmount, 2);
      
      // Si es una operación existente que estamos completando,
      // debemos incluir las transacciones previas y recalcular montos
      if (this.existingOperationId && this.previousTransactions.length > 0) {
        console.log('Combinando transacciones previas con las nuevas');
        
        // Combinar transacciones previas con las nuevas
        allTransactions = [...this.previousTransactions, ...this.transactions];
        
        // Calcular el monto total (original + nuevas transacciones)
        montoTotal = this.originalTotalAmount;
        
        // Recalcular el monto pendiente basado en todas las transacciones
        const totalProcesado = allTransactions.reduce((acc, t) => acc + (t.amount || t.amountForeign || 0), 0);
        montoPendiente = NumberUtils.round(montoTotal - totalProcesado, 2);
        
        // Si el monto pendiente es negativo o muy cercano a cero (por errores de redondeo),
        // lo ajustamos a cero
        if (montoPendiente < 0.01) {
          montoPendiente = 0;
        }
        
        console.log('Monto original:', this.originalTotalAmount);
        console.log('Total procesado:', totalProcesado);
        console.log('Monto pendiente recalculado:', montoPendiente);
      }
      
      // ADICIONA el pending para que aparezca en .details.summary
      globalTotals.montoPendiente = montoPendiente;
  
      const payload = {
        type: "venta",
        client: this.clientName,
        amount: montoTotal, // Utilizamos el monto total correcto (original)
        details: {
          clientRate: this.clientRate,
          currency: this.selectedCurrency,
          transactions: allTransactions, // Utilizamos todas las transacciones
          summary: globalTotals
        },
        // Determinar el estado basado en el monto pendiente recalculado
        estado: montoPendiente <= 0 ? "completa" : "incompleta"
      };
  
      const token = localStorage.getItem('auth_token');
      let url = '/api/transactions';
      let method = 'POST';
  
      // Si es una operación existente, usar PUT
      if (this.existingOperationId) {
        url = `/api/transactions/${this.existingOperationId}`;
        method = 'PUT';
      }
      
      console.log('Enviando payload:', payload);
  
      fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) throw new Error('Error al registrar/actualizar la operación');
        return res.json();
      })
      .then(data => {
        alert('Operación registrada/actualizada con éxito');
        console.log('Operación guardada:', data);
        // Redirigir a operaciones.html
        window.location.href = 'operaciones.html';
      })
      .catch(err => {
        console.error(err);
        alert('Error al registrar la operación');
      });
    }
  }
  
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando sistema de ventas...');
    const transactionManager = new TransactionManager();
  
    // Cargar la operación si viene ?id=...
    await transactionManager.loadOperationIfNeeded();
  
    // Stage 1
    const operationForm = document.getElementById('operationForm');
    const clientNameInput = document.getElementById('clientName');
    const amountToSellInput = document.getElementById('amountToSell');
    const clientRateInput = document.getElementById('clientRate');
    const amountClientReceivesInput = document.getElementById('amountClientReceives');
    const currencyTypeSelect = document.getElementById('currencyType');
  
    // Actualiza el monto en Bs en tiempo real
    function updateClientAmount() {
      const amount = parseFloat(amountToSellInput.value) || 0;
      const rate = parseFloat(clientRateInput.value) || 0;
      if (amount > 0 && rate > 0) {
        const totalBs = amount * rate;
        amountClientReceivesInput.value = new Intl.NumberFormat('es-VE', {
          style: 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          useGrouping: true
        }).format(totalBs);
      } else {
        amountClientReceivesInput.value = '';
      }
    }
  
    amountToSellInput.addEventListener('input', updateClientAmount);
    clientRateInput.addEventListener('input', updateClientAmount);
  
    // Al enviar Stage 1
    if (operationForm) {
      operationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const totalAmount = parseFloat(amountToSellInput.value) || 0;
        const rate = parseFloat(clientRateInput.value) || 0;
        const userSelection = currencyTypeSelect.value;
        if (totalAmount > 0 && rate > 0 && userSelection) {
          transactionManager.clientRate = rate;
          transactionManager.selectedCurrency = mapCurrencyType(userSelection);
          transactionManager.clientName = clientNameInput.value.trim();
          transactionManager.setTotalAmount(totalAmount);
  
          const stage2 = document.getElementById('stage2');
          if (stage2) {
            stage2.style.display = 'block';
          }
        } else {
          alert('Por favor, ingresa un monto, tasa y tipo de divisa válidos.');
        }
      });
    }
  
    // Botón para agregar transacciones
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
      addTransactionBtn.addEventListener('click', () => {
        transactionManager.addTransactionForm();
      });
    }
  
    // Botón para registrar la operación
    const submitOperationBtn = document.getElementById('submitOperationBtn');
    if (submitOperationBtn) {
      submitOperationBtn.addEventListener('click', () => {
        transactionManager.submitOperation();
      });
    }
  });
  