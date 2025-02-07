// PARTE 1: Inicialización y Variables
document.addEventListener('DOMContentLoaded', () => {
    // 1. DECLARACIÓN DE VARIABLES Y ELEMENTOS DOM - GENERAL
    const operationSelector = document.getElementById('operationSelector');
    const exchangeContainer = document.getElementById('exchangeContainer');
    const swapContainer = document.getElementById('swapContainer');
    const themeToggle = document.getElementById('themeToggle');
    
    // Variables para venta
    const operationForm = document.getElementById('operationForm');
    const clientNameInput = document.getElementById('clientName');
    const amountToSellInput = document.getElementById('amountToSell');
    const currencyTypeSelect = document.getElementById('currencyType');
    const clientRateInput = document.getElementById('clientRate');
    const amountClientReceivesInput = document.getElementById('amountClientReceives');
    const proceedToStage2Btn = document.getElementById('proceedToStage2');
    const stage2 = document.getElementById('stage2');
    const addTransactionBtn = document.getElementById('addTransaction');
    const transactionsDiv = document.getElementById('transactions');
    const stage3 = document.getElementById('stage3');
    const resultsDiv = document.getElementById('results');
    const backToSelector = document.getElementById('backToSelector');
 
    // Variables para canje
    const swapForm = document.getElementById('swapForm');
    const swapTypeSelect = document.getElementById('swapType');
    const swapAmountInput = document.getElementById('swapAmount');
 
    // 2. VARIABLES DE ESTADO
    let totalMonto = 0;
    let transactionCount = 0;
    let transactions = [];
    let montoQueDeseaVender = 0;
    let tasaCliente = 0;
    let selectedCurrency = '';
    let currencySymbol = '';
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
 
    // Fórmulas para canje
    // En PARTE 1, reemplazar el const canjeFormulas por:
    // En PARTE 1, actualizar canjeFormulas:
const canjeFormulas = {
    interno: {
        calcularDiferencia: (monto, comisionVenta, comisionCosto) => 
            (monto * comisionVenta) - (monto * comisionCosto)
    },
    externo: {
        calcularGanancias: (diferencia) => {
            const nomina = diferencia * 0.05;
            const gananciaTotal = diferencia - nomina;
            const oficina1 = gananciaTotal * 0.30;
            const oficina2 = gananciaTotal * 0.30;
            const ejecutivo = gananciaTotal * 0.40;

            return {
                nomina,
                gananciaTotal,
                oficina1,
                oficina2,
                ejecutivo
            };
        }
    }
};

    // PARTE 2: Configuración del tema
   function updateThemeIcon(isDark) {
    themeToggle.innerHTML = isDark 
        ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', isDarkMode);
    updateThemeIcon(isDarkMode);
}

if (isDarkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcon(true);
}

themeToggle.addEventListener('click', toggleTheme);

// Selector de operaciones
const operationCards = document.querySelectorAll('.operation-card');
console.log('Cards encontradas:', operationCards.length);

operationCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
        console.log('Card clickeada:', card.dataset.operation);
        operationSelector.style.display = 'none';
        
        if (card.dataset.operation === 'venta') {
            exchangeContainer.style.display = 'block';
            swapContainer.style.display = 'none';
        } else if (card.dataset.operation === 'canje') {
            exchangeContainer.style.display = 'none';
            swapContainer.style.display = 'block';
        }
    });
});

backToSelector.addEventListener('click', () => {
    operationSelector.style.display = 'block';
    exchangeContainer.style.display = 'none';
    swapContainer.style.display = 'none';
});

// PARTE 3: Funciones de utilidad y validación
function formatNumber(num, isBs = false) {
    if (typeof num !== 'number') return num;
    const formattedNum = num.toLocaleString('de-DE', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
    return isBs ? `Bs. ${formattedNum}` : `${currencySymbol} ${formattedNum}`;
}

function getCurrencySymbol(currencyType) {
    switch(currencyType) {
        case 'EUR_CASH':
        case 'EUR_TRANSFER':
            return '€';
        case 'USD_CASH':
        case 'USD_ZELLE':
        case 'USD_INTL':
            return '$';
        case 'USDT':
            return 'USDT';
        default:
            return '';
    }
}

function validateFields(...fields) {
    return fields.every(field => field && field.trim() !== '');
}

function validateAmount(amount, limit) {
    return amount > 0 && amount <= limit;
}

function validateRate(rate) {
    return rate > 0;
}

// Funciones para canje

// En PARTE 3, actualizar la función updateCanjeFields:
function updateCanjeFields() {
    const tipoSeleccionado = swapTypeSelect.value;
    const monto = parseFloat(swapAmountInput.value) || 0;
    const externalFields = document.getElementById('externalFields');
    
    if (!tipoSeleccionado) {
        resetCanjeFields();
        return;
    }

    const costCommission = document.getElementById('costCommission');
    const saleCommission = document.getElementById('saleCommission');
    const difference = document.getElementById('difference');

    // Asegurar que los campos sean editables
    costCommission.readOnly = false;
    saleCommission.readOnly = false;

    // Establecer valores por defecto si están vacíos
    if (!costCommission.value) costCommission.value = '0.00';
    if (!saleCommission.value) saleCommission.value = '1.20';

    const comisionVenta = parseFloat(saleCommission.value) / 100;
    const comisionCosto = parseFloat(costCommission.value) / 100;

    if (tipoSeleccionado === 'interno') {
        const diferencia = canjeFormulas.interno.calcularDiferencia(monto, comisionVenta, comisionCosto);
        difference.value = diferencia.toFixed(2);
    } else if (tipoSeleccionado === 'externo') {
        const diferencia = monto * (comisionVenta - comisionCosto);
        difference.value = diferencia.toFixed(2);

        if (monto > 0) {
            externalFields.style.display = 'block';
            const ganancias = canjeFormulas.externo.calcularGanancias(diferencia);
            updateDistributionFields(ganancias);
        }
    }

    externalFields.style.display = tipoSeleccionado === 'externo' ? 'block' : 'none';
}
// PARTE 4: Funciones adicionales de canje
function resetCanjeFields() {
    document.getElementById('costCommission').value = '';
    document.getElementById('saleCommission').value = '';
    document.getElementById('difference').value = '';
    document.getElementById('externalFields').style.display = 'none';
}

function updateDistributionFields(ganancias) {
    document.getElementById('payroll').value = ganancias.nomina.toFixed(2);
    document.getElementById('profit').value = ganancias.gananciaTotal.toFixed(2);
    document.getElementById('office1').value = ganancias.oficina1.toFixed(2);
    document.getElementById('office2').value = ganancias.oficina2.toFixed(2);
    document.getElementById('executive').value = ganancias.ejecutivo.toFixed(2);
}

// Event Listeners para Canje
// En PARTE 4, modificar los event listeners de canje por:
// Event Listeners para Canje
swapTypeSelect.addEventListener('change', updateCanjeFields);
swapAmountInput.addEventListener('input', updateCanjeFields);

// Agregar listeners para los campos de comisión
// Event Listeners para campos de comisión
document.getElementById('costCommission').addEventListener('input', updateCanjeFields);
document.getElementById('saleCommission').addEventListener('input', updateCanjeFields);

swapForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!swapTypeSelect.value || !swapAmountInput.value) {
        alert('Por favor complete todos los campos');
        return;
    }

    const monto = parseFloat(swapAmountInput.value);
    const tipo = swapTypeSelect.value;
    const diferencia = parseFloat(document.getElementById('difference').value);
    const comisionCosto = parseFloat(document.getElementById('costCommission').value);
    const comisionVenta = parseFloat(document.getElementById('saleCommission').value);

    let mensaje = `Canje ${tipo.toUpperCase()}\n\n`;
    mensaje += `Monto: $${monto.toFixed(2)}\n`;
    mensaje += `Comisión Costo: ${comisionCosto.toFixed(2)}%\n`;
    mensaje += `Comisión Venta: ${comisionVenta.toFixed(2)}%\n`;
    mensaje += `Diferencia: $${diferencia.toFixed(2)}\n`;

    if (tipo === 'externo') {
        mensaje += `\nDistribución:\n`;
        mensaje += `Nómina: $${document.getElementById('payroll').value}\n`;
        mensaje += `Ganancia: $${document.getElementById('profit').value}\n`;
        mensaje += `Oficina 1: $${document.getElementById('office1').value}\n`;
        mensaje += `Oficina 2: $${document.getElementById('office2').value}\n`;
        mensaje += `Ejecutivo: $${document.getElementById('executive').value}`;
    }

    alert(mensaje);
    swapForm.reset();
    resetCanjeFields();
});


swapForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!swapTypeSelect.value || !swapAmountInput.value) {
        alert('Por favor complete todos los campos');
        return;
    }

    const monto = parseFloat(swapAmountInput.value);
    const tipo = swapTypeSelect.value;
    const diferencia = parseFloat(document.getElementById('difference').value);

    let mensaje = `Canje ${tipo.toUpperCase()}\n\n`;
    mensaje += `Monto: $${monto.toFixed(2)}\n`;
    mensaje += `Diferencia: $${diferencia.toFixed(2)}\n`;

    if (tipo === 'externo') {
        mensaje += `\nDistribución:\n`;
        mensaje += `Nómina: $${document.getElementById('payroll').value}\n`;
        mensaje += `Ganancia: $${document.getElementById('profit').value}\n`;
        mensaje += `Oficina 1: $${document.getElementById('office1').value}\n`;
        mensaje += `Oficina 2: $${document.getElementById('office2').value}\n`;
        mensaje += `Ejecutivo: $${document.getElementById('executive').value}`;
    }

    alert(mensaje);
    swapForm.reset();
    resetCanjeFields();
});

// PARTE 5: Funciones y eventos de venta
function calculateMontoClienteReceives() {
    const amountToSell = parseFloat(amountToSellInput.value) || 0;
    const clientRate = parseFloat(clientRateInput.value) || 0;
    const result = amountToSell * clientRate;
    amountClientReceivesInput.value = formatNumber(result, true);
}

amountToSellInput.addEventListener('input', calculateMontoClienteReceives);
clientRateInput.addEventListener('input', calculateMontoClienteReceives);

operationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateFields(
        clientNameInput.value,
        amountToSellInput.value,
        currencyTypeSelect.value,
        clientRateInput.value
    )) {
        alert('Por favor, complete todos los campos requeridos.');
        return;
    }

    montoQueDeseaVender = parseFloat(amountToSellInput.value);
    tasaCliente = parseFloat(clientRateInput.value);
    selectedCurrency = currencyTypeSelect.value;
    currencySymbol = getCurrencySymbol(selectedCurrency);

    stage2.style.display = 'block';
    stage3.style.display = 'block';
    proceedToStage2Btn.disabled = true;
    updateResults();
});

function createArbitraryCommissionField(transactionId, commissionId) {
    const commissionField = document.createElement('div');
    commissionField.classList.add('arbitrary-commission-field');
    commissionField.innerHTML = `
        <div class="commission-inputs">
            <input type="text" 
                   id="arbitraryCommissionName${transactionId}_${commissionId}" 
                   placeholder="Nombre de la comisión"
                   class="commission-name">
            <input type="number" 
                   id="arbitraryCommissionValue${transactionId}_${commissionId}" 
                   placeholder="Porcentaje" 
                   min="0" 
                   max="100"
                   step="0.01"
                   class="commission-value">
            <span class="percentage-symbol">%</span>
            <button type="button" class="btn-icon remove-commission">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>
        </div>
    `;

    commissionField.querySelector('.remove-commission').addEventListener('click', () => {
        commissionField.remove();
    });

    return commissionField;
}

// PARTE 6: Manejo de transacciones
addTransactionBtn.addEventListener('click', () => {
    transactionCount++;
    const transactionForm = createTransactionForm(transactionCount);
    transactionsDiv.appendChild(transactionForm);
    setupTransactionEventListeners(transactionCount, transactionForm);
});

function createTransactionForm(id) {
    const transactionForm = document.createElement('div');
    transactionForm.classList.add('transaction-form');
    transactionForm.setAttribute('data-id', id);

    transactionForm.innerHTML = `
        <h3>Transacción ${id}</h3>
        <div class="form-group">
            <label for="operatorName${id}">Nombre del Operador:</label>
            <input type="text" id="operatorName${id}" required>
        </div>
        <div class="form-group">
            <label for="monto${id}">Monto:</label>
            <input type="number" id="monto${id}" min="0" step="any" required>
        </div>
        <div class="form-group">
            <label for="tasaVenta${id}">Tasa de Venta:</label>
            <input type="number" id="tasaVenta${id}" min="0" step="any" required>
        </div>
        <div class="form-group">
            <label for="tasaOficina${id}">Tasa Oficina:</label>
            <input type="number" id="tasaOficina${id}" min="0" step="any">
        </div>
        <div class="form-group">
            <label>Selección de Oficinas:</label>
            <div class="checkbox-group">
                <label>
                    <input type="checkbox" id="oficinaPZO${id}" name="oficinas${id}" value="PZO">
                    Oficina PZO
                </label>
                <label>
                    <input type="checkbox" id="oficinaCCS${id}" name="oficinas${id}" value="CCS">
                    Oficina CCS
                </label>
            </div>
        </div>
        <div class="form-group">
            <label for="comisionBancaria${id}">Comisión Bancaria:</label>
            <select id="comisionBancaria${id}">
                <option value="100.0000">100,0000%</option>
                <option value="100.1000">100,1000%</option>
                <option value="100.2500">100,2500%</option>
                <option value="100.3000">100,3000%</option>
                <option value="Otra">Otra</option>
            </select>
            <input type="number" id="otraComision${id}" min="0" step="any" 
                style="display:none;" placeholder="Ingrese otra comisión">
        </div>
        <div class="form-group">
            <label for="comision${id}">Comisión:</label>
            <input type="text" id="comision${id}" readonly>
        </div>
        <div class="form-group" id="arbitraryCommissionsContainer${id}">
            <label class="arbitrary-commission-label">
                Comisiones Arbitrarias
                <button type="button" class="btn-icon add-commission" id="addArbitraryCommission${id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </label>
            <div class="arbitrary-commissions" id="arbitraryCommissions${id}"></div>
        </div>
        <div class="button-group">
            <button type="button" class="btn calculateTransaction" data-id="${id}">
                Calcular Transacción
            </button>
            <button type="button" class="btn btn-secondary editTransaction" 
                data-id="${id}" style="display:none;">Editar</button>
            <button type="button" class="btn btn-secondary deleteTransaction" 
                data-id="${id}" style="display:none;">Eliminar</button>
        </div>
    `;
    return transactionForm;
}

// PARTE 7: Event Listeners de Transacciones
function setupTransactionEventListeners(id, form) {
    const comisionBancariaSelect = document.getElementById(`comisionBancaria${id}`);
    const otraComisionInput = document.getElementById(`otraComision${id}`);
    const calculateTransactionBtn = form.querySelector('.calculateTransaction');
    const editTransactionBtn = form.querySelector('.editTransaction');
    const deleteTransactionBtn = form.querySelector('.deleteTransaction');
    const addArbitraryCommissionBtn = document.getElementById(`addArbitraryCommission${id}`);
    const arbitraryCommissionsContainer = document.getElementById(`arbitraryCommissions${id}`);
    let arbitraryCommissionCount = 0;

    comisionBancariaSelect.addEventListener('change', () => {
        otraComisionInput.style.display = 
            comisionBancariaSelect.value === 'Otra' ? 'block' : 'none';
    });

    calculateTransactionBtn.addEventListener('click', () => {
        if (calculateTransaction(id)) {
            editTransactionBtn.style.display = 'inline-block';
            deleteTransactionBtn.style.display = 'inline-block';
            calculateTransactionBtn.style.display = 'none';
            disableTransactionFields(id, true);
        }
    });

    editTransactionBtn.addEventListener('click', () => {
        disableTransactionFields(id, false);
        calculateTransactionBtn.style.display = 'inline-block';
        editTransactionBtn.style.display = 'none';
        deleteTransactionBtn.style.display = 'none';
        removeTransaction(id);
    });

    deleteTransactionBtn.addEventListener('click', () => {
        removeTransaction(id);
        form.remove();
        updateResults();
    });

    addArbitraryCommissionBtn.addEventListener('click', () => {
        arbitraryCommissionCount++;
        const commissionField = createArbitraryCommissionField(id, arbitraryCommissionCount);
        arbitraryCommissionsContainer.appendChild(commissionField);
    });
}

function disableTransactionFields(id, disable) {
    const fields = [
        `operatorName${id}`, `monto${id}`, `tasaVenta${id}`, `tasaOficina${id}`,
        `oficinaPZO${id}`, `oficinaCCS${id}`, `comisionBancaria${id}`, `otraComision${id}`
    ];
    fields.forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        if (field) field.disabled = disable;
    });

    const arbitraryCommissionsContainer = document.getElementById(`arbitraryCommissions${id}`);
    arbitraryCommissionsContainer.querySelectorAll('input')
        .forEach(field => field.disabled = disable);

    const addCommissionBtn = document.getElementById(`addArbitraryCommission${id}`);
    if (addCommissionBtn) addCommissionBtn.disabled = disable;
}

// PARTE 8: Manejo de Cálculos de Transacciones
function removeTransaction(id) {
    const index = transactions.findIndex((t) => t.id === id);
    if (index !== -1) {
        totalMonto -= transactions[index].monto;
        transactions.splice(index, 1);
    }
}

function calculateTransaction(id) {
    const operatorName = document.getElementById(`operatorName${id}`).value;
    const monto = parseFloat(document.getElementById(`monto${id}`).value) || 0;
    const tasaVenta = parseFloat(document.getElementById(`tasaVenta${id}`).value) || 0;
    const tasaOficina = parseFloat(document.getElementById(`tasaOficina${id}`).value) || null;
    const oficinaPZOSelected = document.getElementById(`oficinaPZO${id}`).checked;
    const oficinaCCSSelected = document.getElementById(`oficinaCCS${id}`).checked;

    let comisionBancariaValue = document.getElementById(`comisionBancaria${id}`).value;
    if (comisionBancariaValue === 'Otra') {
        comisionBancariaValue = parseFloat(document.getElementById(`otraComision${id}`).value) || 0;
    } else {
        comisionBancariaValue = parseFloat(comisionBancariaValue);
    }

    if (!validateFields(operatorName) || !validateRate(tasaVenta) || 
        !validateAmount(monto, montoQueDeseaVender - totalMonto)) {
        alert('Por favor, verifique los campos de la transacción.');
        return false;
    }

    const comisionBancariaFactor = comisionBancariaValue / 100;
    let comision = tasaOficina ? 
        tasaOficina * comisionBancariaFactor : 
        tasaCliente * comisionBancariaFactor;
    
    document.getElementById(`comision${id}`).value = formatNumber(comision);

    const arbitraryCommissions = [];
    document.getElementById(`arbitraryCommissions${id}`)
        .querySelectorAll('.arbitrary-commission-field').forEach((field) => {
            const name = field.querySelector('.commission-name').value.trim();
            const percentage = parseFloat(field.querySelector('.commission-value').value) || 0;
            if (name && percentage > 0) {
                arbitraryCommissions.push({ name, percentage });
            }
        });

        // PARTE 9: Continuación de Cálculos de Transacciones
       const oficinaDistribution = {
        PZO: oficinaPZOSelected ? (oficinaCCSSelected ? 0.5 : 1) : 0,
        CCS: oficinaCCSSelected ? (oficinaPZOSelected ? 0.5 : 1) : 0
    };

    const transaction = {
        id, operatorName, monto, tasaVenta, tasaOficina,
        comisionBancariaFactor, comision, oficinaDistribution,
        arbitraryCommissions
    };

    const existingIndex = transactions.findIndex((t) => t.id === id);
    if (existingIndex !== -1) {
        totalMonto -= transactions[existingIndex].monto;
        transactions[existingIndex] = transaction;
    } else {
        transactions.push(transaction);
    }

    totalMonto += monto;
    updateResults();

    if (totalMonto >= montoQueDeseaVender) {
        addTransactionBtn.disabled = true;
        alert('Se ha alcanzado o superado el monto que desea vender el cliente.');
    } else {
        addTransactionBtn.disabled = false;
    }

    return true;
}

function calculateResults(transaction, diferencia) {
    let aRepartir = diferencia;
    let arbitraryResults = [];

    if (transaction.arbitraryCommissions?.length > 0) {
        transaction.arbitraryCommissions.forEach(commission => {
            const commissionAmount = (diferencia * commission.percentage) / 100;
            arbitraryResults.push({
                name: commission.name,
                percentage: commission.percentage,
                amount: commissionAmount / transaction.tasaVenta
            });
            aRepartir -= commissionAmount;
        });
    }

    aRepartir = aRepartir / transaction.comision;
    return { aRepartir, arbitraryResults };
}

// PARTE 10: Actualización de Resultados
function updateResults() {
    resultsDiv.innerHTML = '';
    let totalVenta = 0;
    let totalDiferencia = 0;
    let totalARepartir = 0;
    let totalOficinaPZO = 0;
    let totalOficinaCCS = 0;
    let totalEjecutivo = 0;
    let totalGananciaCliente = 0;
    let totalArbitraryCommissions = {};

    const detailedResultsDiv = document.createElement('div');

    transactions.forEach((transaction) => {
        const montoComision = transaction.monto * transaction.comision;
        const transactionTotalVenta = transaction.monto * transaction.tasaVenta;
        totalVenta += transactionTotalVenta;

        const diferencia = transactionTotalVenta - montoComision;
        totalDiferencia += diferencia;

        const { aRepartir, arbitraryResults } = calculateResults(transaction, diferencia);

        let oficinaPZO = 0;
        let oficinaCCS = 0;
        let ejecutivo = 0;
        let gananciaCliente = 0;

        if (transaction.tasaOficina) {
            oficinaPZO = aRepartir * 0.30 * transaction.oficinaDistribution.PZO;
            oficinaCCS = aRepartir * 0.30 * transaction.oficinaDistribution.CCS;
            ejecutivo = aRepartir * 0.40;

            totalOficinaPZO += oficinaPZO;
            totalOficinaCCS += oficinaCCS;
            totalEjecutivo += ejecutivo;

            gananciaCliente = oficinaPZO + oficinaCCS;
        } else {
            gananciaCliente = diferencia / tasaCliente;
        }
        totalGananciaCliente += gananciaCliente;

        // PARTE 11: Renderizado de Resultados
        arbitraryResults.forEach(commission => {
            if (!totalArbitraryCommissions[commission.name]) {
                totalArbitraryCommissions[commission.name] = {
                    total: 0,
                    percentage: commission.percentage
                };
            }
            totalArbitraryCommissions[commission.name].total += commission.amount;
        });

        let transactionResultHTML = `
            <div class="transaction-result">
                <h3>Transacción ${transaction.id} - Operador: ${transaction.operatorName}</h3>
                <table class="result-table">
                    <tr>
                        <th>Concepto</th>
                        <th>Valor</th>
                    </tr>
                    <tr>
                        <td>Total de la Venta</td>
                        <td>${formatNumber(transactionTotalVenta, true)}</td>
                    </tr>
                    <tr>
                        <td>Diferencia</td>
                        <td>${formatNumber(diferencia, true)}</td>
                    </tr>
        `;

        if (arbitraryResults.length > 0) {
            transactionResultHTML += `
                <tr>
                    <td colspan="2" class="commission-header">Comisiones Arbitrarias</td>
                </tr>
                ${arbitraryResults.map(commission => `
                    <tr>
                        <td>${commission.name} (${commission.percentage}%)</td>
                        <td>${formatNumber(commission.amount)}</td>
                    </tr>
                `).join('')}
                <tr>
                    <td>Monto a Repartir (después de comisiones)</td>
                    <td>${formatNumber(aRepartir)}</td>
                </tr>
            `;
        }

        // PARTE 12: Continuación de Renderizado de Resultados
        if (transaction.tasaOficina) {
            transactionResultHTML += `
                ${transaction.oficinaDistribution.PZO > 0 ? `
                    <tr>
                        <td>Oficina PZO (${transaction.oficinaDistribution.PZO * 100}%)</td>
                        <td>${formatNumber(oficinaPZO)}</td>
                    </tr>
                ` : ''}
                ${transaction.oficinaDistribution.CCS > 0 ? `
                    <tr>
                        <td>Oficina CCS (${transaction.oficinaDistribution.CCS * 100}%)</td>
                        <td>${formatNumber(oficinaCCS)}</td>
                    </tr>
                ` : ''}
                <tr>
                    <td>Ejecutivo</td>
                    <td>${formatNumber(ejecutivo)}</td>
                </tr>
            `;
        }

        transactionResultHTML += `
                    <tr>
                        <td>Ganancia en Cliente</td>
                        <td>${formatNumber(gananciaCliente)}</td>
                    </tr>
                </table>
            </div>
        `;

        detailedResultsDiv.innerHTML += transactionResultHTML;
    });

    // Generar HTML para los totales
    let totalsHTML = `
        <div class="transaction-result">
            <h3>Totales de la Operación</h3>
            <table class="result-table">
                <tr>
                    <th>Concepto</th>
                    <th>Total</th>
                </tr>
    `;

    // PARTE 13: Finalizando Totales y Cierre
    if (Object.keys(totalArbitraryCommissions).length > 0) {
        totalsHTML += `
            <tr>
                <td colspan="2" class="commission-header">Total Comisiones Arbitrarias</td>
            </tr>
            ${Object.entries(totalArbitraryCommissions).map(([name, data]) => `
                <tr>
                    <td>Total ${name} (${data.percentage}%)</td>
                    <td>${formatNumber(data.total)}</td>
                </tr>
            `).join('')}
        `;
    }

    const montoRestante = Math.max(0, montoQueDeseaVender - totalMonto);

    totalsHTML += `
            ${totalARepartir > 0 ? `
                <tr>
                    <td>Total Oficina PZO</td>
                    <td>${formatNumber(totalOficinaPZO)}</td>
                </tr>
                <tr>
                    <td>Total Oficina CCS</td>
                    <td>${formatNumber(totalOficinaCCS)}</td>
                </tr>
                <tr>
                    <td>Total Ejecutivo</td>
                    <td>${formatNumber(totalEjecutivo)}</td>
                </tr>
            ` : ''}
            <tr>
                <td>Total Ganancia en Cliente</td>
                <td>${formatNumber(totalGananciaCliente)}</td>
            </tr>
            <tr class="highlight-row">
                <td>Monto Vendido</td>
                <td>${formatNumber(totalMonto)}</td>
            </tr>
            <tr class="highlight-row">
                <td>Monto Restante</td>
                <td>${formatNumber(montoRestante)}</td>
            </tr>
        </table>
    </div>
    `;

    resultsDiv.appendChild(detailedResultsDiv);
    resultsDiv.innerHTML += totalsHTML;
}

}); // Fin del DOMContentLoaded