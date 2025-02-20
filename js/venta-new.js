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

// Utilidades para manejo de números
const NumberUtils = {
    round: (val, decimals = 2) => {
        return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
    },
    
    isValidNumber: (num) => {
        return typeof num === 'number' && !isNaN(num) && isFinite(num);
    },
    
    parseAmount: (val) => {
        const p = parseFloat(val);
        return isNaN(p) ? 0 : p;
    }
};

/**
 * Mapea el valor del <select> de la divisa a "USD", "EUR" o "USDT"
 */
function mapCurrencyType(userSelection) {
    const val = userSelection.toLowerCase();
    if (val.includes('euro')) {
        return 'EUR';
    } else if (val.includes('usdt')) {
        return 'USDT';
    } else {
        // Para "Dólares en efectivo", "Dólares Zelle", etc.
        return 'USD';
    }
}

/**
 * Clase TransactionManager
 * Maneja la lógica de transacciones de venta de divisas
 */
class TransactionManager {
    constructor() {
        this.transactions = [];      
        this.totalAmount = 0;        // Monto total (en la divisa)
        this.remainingAmount = 0;    // Monto restante (en la divisa)
        this.clientRate = 0;         // Tasa en Bs/Divisa (Stage 1)
        this.selectedCurrency = '';  // "USD", "EUR", "USDT", etc.
        this.clientName = '';        // Nombre del cliente (Stage 1)

        // Bind de métodos
        this.processTransaction = this.processTransaction.bind(this);
        this.calculateTransaction = this.calculateTransaction.bind(this);
        this.updateGlobalSummary = this.updateGlobalSummary.bind(this);
        this.calculateCommission = this.calculateCommission.bind(this);
        this.submitOperation = this.submitOperation.bind(this);

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
    // Crear y configurar formulario de transacción (Stage 2)
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
                <!-- Este campo se actualiza dinámicamente en calculateCommission() -->
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

    // -------------------------------------------------------------------------
    // Configurar event listeners para el formulario
    // -------------------------------------------------------------------------
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
        // Checkboxes para oficinas
        form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                console.log(`Oficina ${e.target.value} ${e.target.checked ? 'seleccionada' : 'deseleccionada'}`);
            });
        });
        // Botones Editar y Eliminar
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
        // Recalcular comisión en tiempo real
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
    // Agregar campos de comisión arbitraria
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // Recopilar datos del formulario
    // -------------------------------------------------------------------------
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
        const commissionItems = form.querySelectorAll('.commission-item');
        commissionItems.forEach(item => {
            const name = item.querySelector('[name^="commissionName"]').value;
            const percentage = parseFloat(item.querySelector('[name^="commissionPercentage"]').value);
            if (name && !isNaN(percentage)) {
                data.arbitraryCommissions.push({ name, percentage });
            }
        });
        if (!data.operatorName || !data.amount || !data.sellingRate || !data.bankCommission) {
            throw new Error('Datos de transacción incompletos');
        }
        console.log('Comisión bancaria seleccionada:', data.bankCommission);
        console.log('Datos recolectados:', data);
        return data;
    }

    // -------------------------------------------------------------------------
    // Procesar la transacción (Stage 2)
    // -------------------------------------------------------------------------
    processTransaction(form) {
        try {
            const transactionData = this.collectFormData(form);
            if (transactionData.amount > this.remainingAmount) {
                alert(`El monto excede el disponible (${this.formatForeign(this.remainingAmount)})`);
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
            form.dataset.transactionId = transaction.id;
            this.remainingAmount -= transactionData.amount;
            form.querySelectorAll('input, select, button:not(.add-arbitrary-commission)').forEach(el => {
                el.disabled = true;
            });
            form.querySelector('.calculate-transaction').style.display = 'none';
            form.querySelector('.edit-transaction').style.display = 'block';
            form.querySelector('.delete-transaction').style.display = 'block';
            this.updateUI();
            document.getElementById('stage3').style.display = 'block';
        } catch (error) {
            console.error('Error al procesar la transacción:', error);
            alert(error.message);
        }
    }

    // -------------------------------------------------------------------------
    // Cálculo principal de la transacción
    // -------------------------------------------------------------------------
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
            const commForeign = NumberUtils.round(commBs / data.sellingRate, 2);
            totalArbitraryBs += commBs;
            return {
                ...comm,
                amountBs: commBs,
                amountForeign: commForeign
            };
        });
        const differenceAfterCommsBs = NumberUtils.round(differenceBs - totalArbitraryBs, 2);
        const amountToDistributeForeign = (data.sellingRate > 0)
            ? NumberUtils.round(differenceAfterCommsBs / data.sellingRate, 2)
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

    // -------------------------------------------------------------------------
    // Cálculo de la distribución en la divisa
    // -------------------------------------------------------------------------
    calculateDistribution(data, amountToDistributeForeign) {
        const distribution = { PZO: 0, CCS: 0, executive: 0, clientProfit: 0 };
        const officeCount = data.selectedOffices.length;
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

    // -------------------------------------------------------------------------
    // Métodos para editar y eliminar transacciones (Stage 2)
    // -------------------------------------------------------------------------
    editTransaction(form) {
        const transactionId = form.dataset.transactionId;
        if (!transactionId) return;
        const index = this.transactions.findIndex(t => t.id == transactionId);
        if (index === -1) return;
        const transaction = this.transactions[index];
        this.remainingAmount += transaction.amount;
        this.transactions.splice(index, 1);
        form.querySelectorAll('input, select, button').forEach(el => {
            el.disabled = false;
        });
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
    // Actualizar UI (Stage 3)
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
    // Render de transacciones y resumen global (Stage 3)
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

    // -------------------------------------------------------------------------
    // Método para calcular comisión bancaria en tiempo real
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // Métodos de formateo
    // -------------------------------------------------------------------------
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

    formatBs(value) {
        return new Intl.NumberFormat('es-VE', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: true
        }).format(value);
    }

    // -------------------------------------------------------------------------
    // Nuevo método: Enviar la operación completa a la API (Stage Final)
    // -------------------------------------------------------------------------
    submitOperation() {
        const payload = {
            type: "venta",
            client: this.clientName,
            amount: this.totalAmount,
            details: {
                clientRate: this.clientRate,
                currency: this.selectedCurrency,
                transactions: this.transactions,
                summary: this.calculateGlobalTotals()
            }
        };

        fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
            },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if (!res.ok) throw new Error('Error al registrar la operación');
            return res.json();
        })
        .then(data => {
            alert('Operación registrada con éxito');
            console.log('Operación guardada:', data);
            // Aquí se puede reiniciar la UI o redirigir según sea necesario
        })
        .catch(err => {
            console.error(err);
            alert('Error al registrar la operación');
        });
    }
}

// -------------------------------------------------------------------------
// Inicialización cuando el DOM esté listo
// -------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando sistema de ventas...');
    const transactionManager = new TransactionManager();

    // Referencias del Stage 1
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

    if (amountToSellInput && clientRateInput) {
        amountToSellInput.addEventListener('input', updateClientAmount);
        clientRateInput.addEventListener('input', updateClientAmount);
        console.log('Event listeners para actualización de monto configurados');
    } else {
        console.error('No se encontraron los elementos de entrada necesarios');
    }

    // Al enviar Stage 1: Asigna datos y muestra Stage 2
    if (operationForm) {
        operationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const totalAmount = parseFloat(amountToSellInput.value);
            const rate = parseFloat(clientRateInput.value);
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

    // Stage 2: Agregar transacciones
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => {
            transactionManager.addTransactionForm();
        });
    }

    // Stage Final: Registrar Operación
    // Se asume que en venta.html se agrega un botón con id "submitOperationBtn" en Stage 3
    const submitOperationBtn = document.getElementById('submitOperationBtn');
    if (submitOperationBtn) {
        submitOperationBtn.addEventListener('click', () => {
            transactionManager.submitOperation();
        });
    }
});
