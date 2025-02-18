/**
 * Constantes y configuración global
 */
const COMMISSION_FACTORS = {
    '100.0000': 1.0000,
    '100.1000': 1.0010,
    '100.2500': 1.0025,
    '100.3000': 1.0030
};

const DISTRIBUTION_FACTORS = {
    OFFICE: 0.30,    // 30% para oficinas
    EXECUTIVE: 0.40, // 40% para ejecutivo
    CLIENT: 0.30     // 30% para cliente
};

const PRECISION = {
    DECIMALS: 4,
    DISPLAY_DECIMALS: 2,
    RATE_DECIMALS: 4
};

const VALIDATION_MESSAGES = {
    INVALID_AMOUNT: 'El monto debe ser un número válido mayor que cero',
    INVALID_RATE: 'La tasa debe ser un número válido mayor que cero',
    INVALID_COMMISSION: 'La comisión debe ser un número válido',
    INSUFFICIENT_AMOUNT: 'El monto excede el disponible',
    CALCULATION_ERROR: 'Error en el cálculo de la transacción'
};

// Utilidades para manejo de números
const NumberUtils = {
    round: (val, decimals = 2) => {
        return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
    },
    
    isValidNumber: (number) => {
        return typeof number === 'number' && !isNaN(number) && isFinite(number);
    },
    
    parseAmount: (val) => {
        const p = parseFloat(val);
        return isNaN(p) ? 0 : p;
    }
};

/**
 * Clase TransactionManager
 * Maneja toda la lógica de transacciones de venta de divisas
 */
class TransactionManager {
    constructor() {
        this.transactions = [];      
        this.totalAmount = 0;        // Monto total (ej. 20.000 USD)
        this.remainingAmount = 0;    // Monto restante (ej. 20.000 USD)
        this.clientRate = 0;         // Tasa en Bs/Divisa
        this.selectedCurrency = '';  // "USD", "EUR", "USDT"
        
        // Bind de métodos
        this.processTransaction = this.processTransaction.bind(this);
        this.calculateTransaction = this.calculateTransaction.bind(this);
        this.updateGlobalSummary = this.updateGlobalSummary.bind(this);
        this.calculateCommission = this.calculateCommission.bind(this);

        console.log('TransactionManager inicializado');
    }

    // -------------------------------------------------------------------------
    // Stage 1: Configuración inicial
    // -------------------------------------------------------------------------
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
        
        console.log('Montos iniciales establecidos:', {
            remainingAmount: this.remainingAmount,
            totalAmount: this.totalAmount
        });
    }

    // -------------------------------------------------------------------------
    // Crear y configurar formulario de transacción
    // -------------------------------------------------------------------------
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
        // Botón Calcular
        const calculateBtn = form.querySelector('.calculate-transaction');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => {
                this.processTransaction(form);
            });
        }

        // Botón Agregar Comisión Arbitraria
        const addCommissionBtn = form.querySelector('.add-arbitrary-commission');
        if (addCommissionBtn) {
            addCommissionBtn.addEventListener('click', () => {
                this.addArbitraryCommissionFields(form);
            });
        }

        // Checkboxes
        form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                console.log(`Oficina ${e.target.value} ${e.target.checked ? 'seleccionada' : 'deseleccionada'}`);
            });
        });

        // Editar / Eliminar
        const editBtn = form.querySelector('.edit-transaction');
        const deleteBtn = form.querySelector('.delete-transaction');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editTransaction(form);
            });
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteTransaction(form);
            });
        }

        // Recalcular comisión bancaria
        const tasaVentaField = form.querySelector('[name="tasaVenta"]');
        const tasaOficinaField = form.querySelector('[name="tasaOficina"]');
        const bankCommissionField = form.querySelector('[name="bankCommission"]');

        if (tasaVentaField) {
            tasaVentaField.addEventListener('input', () => this.calculateCommission(form));
        }
        if (tasaOficinaField) {
            tasaOficinaField.addEventListener('input', () => this.calculateCommission(form));
        }
        if (bankCommissionField) {
            bankCommissionField.addEventListener('change', () => this.calculateCommission(form));
        }
    }

    // -------------------------------------------------------------------------
    // Recopilar datos del formulario
    // -------------------------------------------------------------------------
    collectFormData(form) {
        const data = {
            operatorName: form.querySelector('[name="operador"]').value.trim(),
            amount: NumberUtils.parseAmount(form.querySelector('[name="montoTransaccion"]').value), // Monto en divisa
            sellingRate: NumberUtils.parseAmount(form.querySelector('[name="tasaVenta"]').value),   // Bs/Divisa
            officeRate: NumberUtils.parseAmount(form.querySelector('[name="tasaOficina"]').value),  // Bs/Divisa
            bankCommission: form.querySelector('[name="bankCommission"]').value,
            selectedOffices: [],
            arbitraryCommissions: []
        };

        // Oficinas
        if (form.querySelector('[name="oficinaPZO"]').checked) data.selectedOffices.push('PZO');
        if (form.querySelector('[name="oficinaCCS"]').checked) data.selectedOffices.push('CCS');

        // Comisiones Arbitrarias
        const commissionItems = form.querySelectorAll('.commission-item');
        commissionItems.forEach(item => {
            const name = item.querySelector('[name^="commissionName"]').value;
            const percentage = parseFloat(item.querySelector('[name^="commissionPercentage"]').value);
            if (name && !isNaN(percentage)) {
                data.arbitraryCommissions.push({ name, percentage });
            }
        });

        // Validar
        if (!data.operatorName || !data.amount || !data.sellingRate || 
            !data.officeRate || !data.bankCommission || data.selectedOffices.length === 0) {
            throw new Error('Datos de transacción incompletos');
        }

        console.log('Comisión bancaria seleccionada:', data.bankCommission);
        console.log('Datos recolectados:', data);
        return data;
    }

    // -------------------------------------------------------------------------
    // Procesar Transacción
    // -------------------------------------------------------------------------
    processTransaction(form) {
        const transactionData = this.collectFormData(form);

        if (transactionData.amount > this.remainingAmount) {
            alert(`El monto excede el disponible (${this.formatForeign(this.remainingAmount)})`);
            return;
        }

        const calculation = this.calculateTransaction(transactionData);

        // Crear la transacción final
        const transaction = {
            id: Date.now(),
            ...transactionData,
            ...calculation,
            totalSaleBs: transactionData.amount * transactionData.sellingRate,
            totalOfficeBs: transactionData.amount * transactionData.officeRate,
            amountForeign: transactionData.amount
        };

        this.transactions.push(transaction);
        form.dataset.transactionId = transaction.id;
        this.remainingAmount -= transactionData.amount;

        // Deshabilitar el formulario
        form.querySelectorAll('input, select, button:not(.add-arbitrary-commission)').forEach(el => {
            el.disabled = true;
        });
        form.querySelector('.calculate-transaction').style.display = 'none';
        form.querySelector('.edit-transaction').style.display = 'block';
        form.querySelector('.delete-transaction').style.display = 'block';

        this.updateUI();
        document.getElementById('stage3').style.display = 'block';
    }

    // -------------------------------------------------------------------------
    // Cálculo principal
    // -------------------------------------------------------------------------
    calculateTransaction(data) {
        // 1) Totales en Bs
        const totalSaleBs = NumberUtils.round(data.amount * data.sellingRate, 2);
        const baseCostBs = NumberUtils.round(data.amount * data.officeRate, 2);
        const differenceBs = NumberUtils.round(totalSaleBs - baseCostBs, 2);

        // 2) Comisiones Arbitrarias
        let totalArbitraryBs = 0;
        const arbitraryCommissions = data.arbitraryCommissions.map(comm => {
            const commBs = NumberUtils.round(differenceBs * (comm.percentage / 100), 2);
            const commForeign = NumberUtils.round(commBs / data.sellingRate, 2);
            totalArbitraryBs += commBs;
            return {
                ...comm,
                amountBs: commBs,
                amountForeign: commForeign
            };
        });

        // 3) Diferencia final en Bs y en la divisa
        const differenceAfterCommsBs = NumberUtils.round(differenceBs - totalArbitraryBs, 2);
        const amountToDistributeForeign = NumberUtils.round(differenceAfterCommsBs / data.sellingRate, 2);

        // 4) Distribución en la divisa
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

    // -------------------------------------------------------------------------
    // Distribución en la divisa
    // -------------------------------------------------------------------------
    calculateDistribution(data, amountToDistributeForeign) {
        const distribution = { PZO: 0, CCS: 0, executive: 0, clientProfit: 0 };

        const officeCount = data.selectedOffices.length;
        const officeFactor = (officeCount === 2) ? 0.5 : 1;

        // 30% total a oficinas
        if (officeCount > 0) {
            const officesTotal = NumberUtils.round(amountToDistributeForeign * 0.30, 2);
            if (data.selectedOffices.includes('PZO')) {
                distribution.PZO = NumberUtils.round(officesTotal * officeFactor, 2);
            }
            if (data.selectedOffices.includes('CCS')) {
                distribution.CCS = NumberUtils.round(officesTotal * officeFactor, 2);
            }
        }

        // 40% ejecutivo
        distribution.executive = NumberUtils.round(amountToDistributeForeign * 0.40, 2);

        // 30% cliente
        distribution.clientProfit = NumberUtils.round(amountToDistributeForeign * 0.30, 2);

        return distribution;
    }

    // -------------------------------------------------------------------------
    // Editar / Eliminar
    // -------------------------------------------------------------------------
    editTransaction(form) {
        const transactionId = form.dataset.transactionId;
        if (!transactionId) return;

        const index = this.transactions.findIndex(t => t.id == transactionId);
        if (index === -1) return;

        const transaction = this.transactions[index];
        this.remainingAmount += transaction.amount;
        this.transactions.splice(index, 1);

        // Rehabilitar campos
        form.querySelectorAll('input, select, button').forEach(el => {
            el.disabled = false;
        });

        // Botones
        form.querySelector('.calculate-transaction').style.display = 'block';
        form.querySelector('.edit-transaction').style.display = 'none';
        form.querySelector('.delete-transaction').style.display = 'none';

        this.updateUI();
    }

    deleteTransaction(form) {
        const transactionId = form.dataset.transactionId;
        if (!transactionId) return;

        const index = this.transactions.findIndex(t => t.id == transactionId);
        if (index === -1) return;

        this.remainingAmount += this.transactions[index].amount;
        this.transactions.splice(index, 1);
        form.remove();

        this.updateUI();
    }

    // -------------------------------------------------------------------------
    // Actualizar UI y Stage 3
    // -------------------------------------------------------------------------
    updateUI() {
        this.updateGlobalSummary();
    }

    updateGlobalSummary() {
        const stage3 = document.getElementById('stage3');
        const resultContainer = document.getElementById('resultadoOperacion');
        if (!stage3 || !resultContainer) return;

        let html = this.renderTransactionsList();
        html += this.renderGlobalSummary();
        resultContainer.innerHTML = html;
    }

    // -------------------------------------------------------------------------
    // Render de Transacciones
    // -------------------------------------------------------------------------
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
                                <td class="text-end">${this.formatCurrency(t.amount)}</td>
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
                            <!-- Comisiones Arbitrarias en la divisa -->
                            ${this.renderArbitraryCommissionsRows(t.arbitraryCommissions)}
                            <tr>
                                <td>Monto a Repartir (después de comisiones)</td>
                                <td class="text-end">${this.formatForeign(t.amountToDistributeForeign)}</td>
                            </tr>
                            <!-- Distribución en la divisa -->
                            ${this.renderDistributionRows(t.distribution)}
                        </table>
                    </div>
                </div>
            `;
        });

        return html + '</div>';
    }

    // -------------------------------------------------------------------------
    // Render Comisiones Arbitrarias (ya corregido a t.arbitraryCommissions)
    // -------------------------------------------------------------------------
    renderArbitraryCommissionsRows(arbitraryCommissions) {
        if (!arbitraryCommissions || arbitraryCommissions.length === 0) return '';
        
        let html = '';
        arbitraryCommissions.forEach(commission => {
            html += `
                <tr>
                    <td>${commission.name} (${commission.percentage}%)</td>
                    <td class="text-end">${this.formatForeign(commission.amountForeign)}</td>
                </tr>
            `;
        });
        return html;
    }

    // -------------------------------------------------------------------------
    // Render Distribución
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // Render Global Summary (usa t.arbitraryCommissions)
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // Calcular Totales Globales
    // -------------------------------------------------------------------------
    calculateGlobalTotals() {
        return this.transactions.reduce((acc, t) => {
            // Sumar comisiones arbitrarias en la divisa (amountForeign)
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

    // -------------------------------------------------------------------------
    // Render Filas de Totales
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // Formatear moneda en Bs
    // -------------------------------------------------------------------------
    formatCurrency(value) {
        return new Intl.NumberFormat('es-VE', {
            style: 'currency',
            currency: 'VES'
        }).format(value);
    }

    // -------------------------------------------------------------------------
    // Calcular comisión bancaria en tiempo real
    // -------------------------------------------------------------------------
    calculateCommission(form) {
        const sellingRate = parseFloat(form.querySelector('[name="tasaVenta"]').value) || 0;
        const officeRate = parseFloat(form.querySelector('[name="tasaOficina"]').value) || 0;
        const bankCommissionStr = form.querySelector('[name="bankCommission"]').value;
        
        const bankFactor = COMMISSION_FACTORS[bankCommissionStr] || 1;
        const rateToUse = officeRate > 0 ? officeRate : (this.clientRate || 0);
        const commissionValue = rateToUse * (bankFactor - 1);

        const commissionField = form.querySelector('[name="commission"]');
        if (commissionField) {
            commissionField.value = commissionValue.toFixed(4);
        }
    }

    // -------------------------------------------------------------------------
    // Formatear en la divisa
    // -------------------------------------------------------------------------
    formatForeign(value) {
        let symbol = '$';
        if (this.selectedCurrency === 'EUR') symbol = '€';
        if (this.selectedCurrency === 'USDT') symbol = 'USDT ';

        return symbol + new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: true
        }).format(value);
    }

    // -------------------------------------------------------------------------
    // Formatear en Bs
    // -------------------------------------------------------------------------
    formatBs(value) {
        return new Intl.NumberFormat('es-VE', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: true
        }).format(value);
    }
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando sistema de ventas...');
    const transactionManager = new TransactionManager();

    // Stage 1
    const operationForm = document.getElementById('operationForm');
    const amountToSellInput = document.getElementById('amountToSell');
    const clientRateInput = document.getElementById('clientRate');
    const amountClientReceivesInput = document.getElementById('amountClientReceives');
    const currencyTypeSelect = document.getElementById('currencyType');

    // Función para actualizar dinámicamente el monto en Bs
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

    if (amountToSellInput && clientRateInput) {
        amountToSellInput.addEventListener('input', updateClientAmount);
        clientRateInput.addEventListener('input', updateClientAmount);
        console.log('Event listeners para actualización de monto configurados');
    } else {
        console.error('No se encontraron los elementos de entrada necesarios');
    }

    if (operationForm) {
        operationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const totalAmount = parseFloat(amountToSellInput.value);
            const rate = parseFloat(clientRateInput.value);

            if (totalAmount > 0 && rate > 0 && currencyTypeSelect.value) {
                window.clientRate = rate;
                transactionManager.clientRate = rate;
                transactionManager.selectedCurrency = currencyTypeSelect.value;

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

    // Stage 2: Agregar transacciones
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => {
            transactionManager.addTransactionForm();
        });
    }
});
