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

/**
 * Clase TransactionManager
 * Maneja toda la lógica de transacciones de venta de divisas
 */
class TransactionManager {
    /**
     * Constructor de la clase
     * Inicializa las propiedades básicas y realiza los bindings necesarios
     */
    constructor() {
        // Propiedades principales
        this.transactions = [];      // Array para almacenar todas las transacciones
        this.totalAmount = 0;        // Monto total de la operación
        this.remainingAmount = 0;    // Monto restante por procesar
        this.clientRate = 0;         // Tasa del cliente
        
        // Binding de métodos para mantener el contexto
        this.addTransaction = this.addTransaction.bind(this);
        this.calculateTransaction = this.calculateTransaction.bind(this);
        this.processTransaction = this.processTransaction.bind(this);
        this.showFinalSummary = this.showFinalSummary.bind(this);
        this.updateGlobalSummary = this.updateGlobalSummary.bind(this);

        console.log('TransactionManager inicializado:', {
            métodos: Object.getOwnPropertyNames(TransactionManager.prototype)
        });
    }

    /**
     * Métodos de Inicialización y Configuración
     */

    /**
     * Establece el monto total de la operación y crea la primera transacción
     * @param {number} amount - Monto total a procesar
     */
    setTotalAmount(amount) {
        this.totalAmount = amount;
        this.remainingAmount = amount;
        
        // Crear la primera transacción automáticamente
        const transactionsContainer = document.getElementById('transactionsContainer');
        if (transactionsContainer) {
            transactionsContainer.innerHTML = this.createTransactionForm(1);
            this.setupFormEventListeners(transactionsContainer.firstElementChild);
        }
        
        this.updateUI();
    }

    /**
     * Configura los event listeners para un formulario de transacción
     * @param {HTMLElement} form - Formulario de transacción
     */
    setupFormEventListeners(form) {
        // Event listeners para checkboxes de oficinas
        form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                console.log(`Oficina ${e.target.value} ${e.target.checked ? 'seleccionada' : 'deseleccionada'}`);
            });
        });

        // Botón de calcular transacción
        const calculateBtn = form.querySelector('.calculate-transaction');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => {
                this.processTransaction(form);
            });
        }

        // Agregar comisión arbitraria
        const addCommissionBtn = form.querySelector('.add-arbitrary-commission');
        if (addCommissionBtn) {
            addCommissionBtn.addEventListener('click', () => {
                this.addArbitraryCommissionFields(form);
            });
        }
    }

    /**
     * Métodos de Cálculo y Procesamiento
     */

    /**
     * Calcula los resultados de una transacción
     * @param {Object} transactionData - Datos de la transacción
     * @returns {Object} Resultados del cálculo
     */
    calculateTransaction(transactionData) {
        // 1. Cálculos en Bolívares
        const totalSale = transactionData.amount * transactionData.sellingRate;  // Bs.
        const effectiveRate = transactionData.officeRate || this.clientRate;
        
        // Cálculo correcto de la diferencia
        const baseCost = transactionData.amount * (
            transactionData.officeRate ? 
            transactionData.officeRate : 
            this.clientRate
        );  // Bs.
        const difference = totalSale - baseCost;  // Bs.

        console.log('Debug:', {
            totalSale,
            baseCost,
            difference,
            hasOfficeRate: !!transactionData.officeRate
        });

        // 2. Procesar comisiones arbitrarias (convertir a USD)
        const arbitraryCommissions = transactionData.arbitraryCommissions.map(comm => ({
            name: comm.name,
            percentage: comm.percentage,
            amount: (difference / transactionData.sellingRate) * (comm.percentage / 100)  // USD
        }));

        const totalArbitraryUSD = arbitraryCommissions.reduce((sum, comm) => sum + comm.amount, 0);

        // 3. Convertir diferencia a USD y calcular monto a repartir
        const differenceUSD = difference / transactionData.sellingRate;  // USD
        const amountToDistribute = differenceUSD - totalArbitraryUSD;  // USD

        // 4. Calcular distribución
        let distribution;
        if (transactionData.officeRate) {
            // Si hay tasa de oficina, usar distribución normal
            distribution = this.calculateDistribution(amountToDistribute, transactionData.selectedOffices);
        } else {
            // Si no hay tasa de oficina, todo va al cliente
            distribution = {
                PZO: 0,
                CCS: 0,
                executive: 0,
                clientProfit: differenceUSD  // Usar differenceUSD en lugar de amountToDistribute
            };
        }

        return {
            totalSale,
            difference,
            arbitraryCommissions,
            amountToDistribute,
            distribution
        };
    }

    /**
     * Calcula la distribución del monto entre oficinas, ejecutivo y cliente
     * @param {number} amount - Monto a distribuir en USD
     * @param {Array} selectedOffices - Oficinas seleccionadas
     * @returns {Object} Distribución calculada en USD
     */
    calculateDistribution(amount, selectedOffices) {
        const distribution = {
            PZO: 0,
            CCS: 0,
            executive: 0,
            clientProfit: 0
        };

        // Distribución cuando hay oficinas seleccionadas (50% en lugar de 30%)
        const officeCount = selectedOffices.length;
        if (officeCount > 0) {
            const officeShare = amount * 0.30 / officeCount;  // 30% dividido entre las oficinas
            if (selectedOffices.includes('PZO')) distribution.PZO = officeShare;
            if (selectedOffices.includes('CCS')) distribution.CCS = officeShare;
        }

        distribution.executive = amount * 0.40;  // 40% para ejecutivo
        distribution.clientProfit = amount * 0.30;  // 30% para cliente

        return distribution;
    }

    /**
     * Procesa una transacción completa
     * @param {HTMLElement} form - Formulario de la transacción
     */
    processTransaction(form) {
        console.log('Procesando transacción...');
        const transactionData = this.collectFormData(form);
        
        if (!transactionData) {
            console.error('Datos de transacción inválidos');
            return;
        }

        const calculation = this.calculateTransaction(transactionData);
        
        // Agregar la transacción al array
        this.transactions.push({
            ...transactionData,
            ...calculation
        });

        // Actualizar monto restante
        this.remainingAmount -= transactionData.amount;

        // Deshabilitar el formulario procesado
        form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
        
        // Actualizar UI
        this.updateUI();

        console.log('Transacción procesada exitosamente');
    }

    addTransaction(transactionData) {
        if (this.validateTransaction(transactionData)) {
            const calculation = this.calculateTransaction(transactionData);
            const transaction = {
                id: Date.now(),
                ...transactionData,
                ...calculation
            };
            
            this.transactions.push(transaction);
            this.remainingAmount -= transaction.amount;
            this.updateUI();
            return transaction;
        }
        return null;
    }

    validateTransaction(transactionData) {
        const { amount } = transactionData;
        if (!amount || amount <= 0) {
            alert('El monto debe ser mayor que cero');
            return false;
        }
        if (amount > this.remainingAmount) {
            alert('El monto excede el monto restante disponible');
            return false;
        }
        return true;
    }

    updateUI() {
        console.log('Actualizando UI...');
        
        // Actualizar montos mostrados
        const montoTotalElement = document.getElementById('montoTotal');
        const montoRestanteElement = document.getElementById('montoRestante');
        
        if (montoTotalElement) montoTotalElement.textContent = this.totalAmount.toFixed(2);
        if (montoRestanteElement) montoRestanteElement.textContent = this.remainingAmount.toFixed(2);
        
        // Actualizar resumen global si estamos en Stage 3
        this.updateGlobalSummary();
    }

    updateGlobalSummary() {
        const totals = this.transactions.reduce((acc, trans) => ({
            totalAmount: acc.totalAmount + trans.amount,
            totalArbitrary: acc.totalArbitrary + trans.arbitraryCommissions.reduce((sum, comm) => sum + comm.amount, 0),
            totalClientProfit: acc.totalClientProfit + trans.distribution.clientProfit,
            totalExecutive: acc.totalExecutive + trans.distribution.executive,
            totalPZO: acc.totalPZO + (trans.distribution.PZO || 0),
            totalCCS: acc.totalCCS + (trans.distribution.CCS || 0)
        }), {
            totalAmount: 0,
            totalArbitrary: 0,
            totalClientProfit: 0,
            totalExecutive: 0,
            totalPZO: 0,
            totalCCS: 0
        });

        return `
            <div class="global-summary mt-4">
                <h5 class="mb-3">Totales de la Operación</h5>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <tr>
                            <td>Total Viático (2%)</td>
                            <td class="text-end">$ ${totals.totalArbitrary.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Total Ganancia en Cliente</td>
                            <td class="text-end">$ ${totals.totalClientProfit.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Total Ejecutivo</td>
                            <td class="text-end">$ ${totals.totalExecutive.toFixed(2)}</td>
                        </tr>
                        ${totals.totalPZO > 0 ? `
                            <tr>
                                <td>Total Oficina PZO</td>
                                <td class="text-end">$ ${totals.totalPZO.toFixed(2)}</td>
                            </tr>
                        ` : ''}
                        ${totals.totalCCS > 0 ? `
                            <tr>
                                <td>Total Oficina CCS</td>
                                <td class="text-end">$ ${totals.totalCCS.toFixed(2)}</td>
                            </tr>
                        ` : ''}
                        <tr>
                            <td>Monto Vendido</td>
                            <td class="text-end">$ ${totals.totalAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Monto Restante</td>
                            <td class="text-end">$ ${this.remainingAmount.toFixed(2)}</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
    }

    renderTransactionResult(transaction, index) {
        return `
            <div class="transaction-result mb-4">
                <h6 class="text-primary">Transacción ${index + 1} - Operador: ${transaction.operatorName}</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <tr>
                            <td>Total de la Venta</td>
                            <td class="text-end">Bs. ${transaction.totalSale.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Diferencia</td>
                            <td class="text-end">Bs. ${transaction.difference.toFixed(2)}</td>
                        </tr>
                        ${transaction.arbitraryCommissions.map(comm => `
                            <tr>
                                <td>${comm.name} (${comm.percentage}%)</td>
                                <td class="text-end">$ ${comm.amount.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td>Monto a Repartir (después de comisiones)</td>
                            <td class="text-end">$ ${transaction.amountToDistribute.toFixed(2)}</td>
                        </tr>
                        ${transaction.distribution.PZO > 0 ? `
                            <tr>
                                <td>Oficina PZO (50%)</td>
                                <td class="text-end">$ ${transaction.distribution.PZO.toFixed(2)}</td>
                            </tr>
                        ` : ''}
                        ${transaction.distribution.CCS > 0 ? `
                            <tr>
                                <td>Oficina CCS (50%)</td>
                                <td class="text-end">$ ${transaction.distribution.CCS.toFixed(2)}</td>
                            </tr>
                        ` : ''}
                        <tr>
                            <td>Ejecutivo</td>
                            <td class="text-end">$ ${transaction.distribution.executive.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Ganancia en Cliente</td>
                            <td class="text-end">$ ${transaction.distribution.clientProfit.toFixed(2)}</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
    }

    // Agregar método para manejar el botón "Continuar a Resumen"
    showFinalSummary() {
        console.log('Mostrando resumen final...');
        
        if (this.transactions.length === 0) {
            alert('Debe calcular al menos una transacción antes de continuar.');
            return;
        }

        if (this.remainingAmount > 0) {
            alert(`Aún queda un monto restante de $${this.remainingAmount.toFixed(2)} por procesar.`);
            return;
        }

        // Mostrar Stage 3
        document.querySelectorAll('.stage').forEach(stage => {
            stage.style.display = stage.id === 'stage3' ? 'block' : 'none';
        });

        // Renderizar resultados en Stage 3
        const stage3 = document.getElementById('stage3');
        if (stage3) {
            const content = `
                <div class="card h-100">
                    <div class="card-header">
                        <h5 class="mb-0">Resultado de la Operación</h5>
                    </div>
                    <div class="card-body">
                        ${this.renderTransactionResults()}
                        ${this.renderGlobalSummary()}
                    </div>
                </div>
            `;
            stage3.innerHTML = content;
        }
    }

    /**
     * Formatea un número para mostrar separadores de miles y decimales
     * @param {number} number - Número a formatear
     * @param {string} currency - Símbolo de moneda (Bs. o $)
     * @returns {string} Número formateado
     */
    formatCurrency(number, currency = '$') {
        return `${currency} ${new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: true
        }).format(number)}`;
    }

    /**
     * Renderiza los resultados de una transacción con números formateados
     */
    renderTransactionResults() {
        return this.transactions.map((transaction, index) => `
            <div class="transaction-result mb-4">
                <h6 class="text-primary">Transacción ${index + 1} - Operador: ${transaction.operatorName}</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <tr>
                            <td>Total de la Venta</td>
                            <td class="text-end">${this.formatCurrency(transaction.totalSale, 'Bs.')}</td>
                        </tr>
                        <tr>
                            <td>Diferencia</td>
                            <td class="text-end">${this.formatCurrency(transaction.difference, 'Bs.')}</td>
                        </tr>
                        ${this.renderArbitraryCommissions(transaction.arbitraryCommissions)}
                        <tr>
                            <td>Monto a Repartir</td>
                            <td class="text-end">${this.formatCurrency(transaction.amountToDistribute)}</td>
                        </tr>
                        ${this.renderDistribution(transaction.distribution)}
                    </table>
                </div>
            </div>
        `).join('');
    }

    renderGlobalSummary() {
        const totals = this.calculateGlobalTotals();
        
        return `
            <div class="global-summary mt-4">
                <h5 class="mb-3">Totales de la Operación</h5>
                <div class="table-responsive">
                    <table class="table table-sm">
                        ${this.renderGlobalTotalsRows(totals)}
                    </table>
                </div>
            </div>
        `;
    }

    createTransactionForm(transactionNumber) {
        return `
            <div class="transaction-form card shadow-sm mb-4" id="transaction-${transactionNumber}">
                <div class="card-body">
                    <h6 class="text-primary mb-4">Transacción ${transactionNumber}</h6>
                    
                    <div class="mb-3">
                        <label class="form-label">Nombre del Operador:</label>
                        <input type="text" class="form-control" name="operador" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Monto:</label>
                        <input type="number" class="form-control text-end" name="montoTransaccion" step="0.01" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Tasa de Venta:</label>
                        <input type="number" class="form-control text-end" name="tasaVenta" step="0.0001" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Tasa Oficina:</label>
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
                        <select class="form-select" name="comisionBancaria">
                            <option value="100.0000">100.0000%</option>
                            <option value="100.1000">100.1000%</option>
                            <option value="100.2500">100.2500%</option>
                            <option value="100.3000">100.3000%</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Comisiones Arbitrarias:</label>
                        <div class="comisiones-arbitrarias"></div>
                        <button type="button" class="btn btn-sm btn-outline-secondary mt-2 add-arbitrary-commission">
                            <i class="fas fa-plus"></i> Agregar Comisión
                        </button>
                    </div>

                    <button type="button" class="btn btn-primary calculate-transaction">
                        Calcular Transacción
                    </button>
                </div>
            </div>
        `;
    }

    collectFormData(form) {
        // Verificar que form es válido
        if (!form) {
            console.error('Formulario no encontrado');
            return null;
        }

        // Obtener los valores con verificación de null
        const getValue = (selector) => {
            const element = form.querySelector(selector);
            return element ? element.value : null;
        };

        // Obtener los checkboxes marcados
        const selectedOffices = Array.from(form.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        // Recolectar comisiones arbitrarias
        const arbitraryCommissions = Array.from(form.querySelectorAll('.arbitrary-commission-item'))
            .map(item => {
                const nameInput = item.querySelector('input[type="text"]');
                const percentageInput = item.querySelector('input[type="number"]');
                if (nameInput && percentageInput) {
                    return {
                        name: nameInput.value,
                        percentage: parseFloat(percentageInput.value) || 0
                    };
                }
                return null;
            })
            .filter(item => item !== null);

        // Construir objeto de datos
        const data = {
            operatorName: getValue('[name="operador"]'),
            amount: parseFloat(getValue('[name="montoTransaccion"]')) || 0,
            sellingRate: parseFloat(getValue('[name="tasaVenta"]')) || 0,
            officeRate: parseFloat(getValue('[name="tasaOficina"]')) || null,
            bankCommission: getValue('[name="comisionBancaria"]') || '100.0000',
            selectedOffices: selectedOffices,
            arbitraryCommissions: arbitraryCommissions
        };

        // Verificar datos requeridos
        if (!data.operatorName || !data.amount || !data.sellingRate) {
            console.error('Faltan datos requeridos en el formulario');
            return null;
        }

        return data;
    }

    addArbitraryCommissionFields(form) {
        const arbitraryCommissionsDiv = form.querySelector('.comisiones-arbitrarias');
        const commissionHTML = `
            <div class="arbitrary-commission-item mb-2">
                <div class="row">
                    <div class="col">
                        <input type="text" class="form-control form-control-sm" placeholder="Nombre">
                    </div>
                    <div class="col">
                        <input type="number" class="form-control form-control-sm" step="0.01" placeholder="Porcentaje">
                    </div>
                    <div class="col-auto">
                        <button type="button" class="btn btn-sm btn-danger remove-commission">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = commissionHTML;
        const commissionElement = wrapper.firstElementChild;

        commissionElement.querySelector('.remove-commission').addEventListener('click', () => {
            commissionElement.remove();
        });

        arbitraryCommissionsDiv.appendChild(commissionElement);
    }

    /**
     * Métodos Auxiliares de Renderizado y Cálculo
     */

    /**
     * Renderiza las comisiones arbitrarias con números formateados
     */
    renderArbitraryCommissions(commissions) {
        return commissions.map(comm => `
            <tr>
                <td>${comm.name} (${comm.percentage}%)</td>
                <td class="text-end">${this.formatCurrency(comm.amount)}</td>
            </tr>
        `).join('');
    }

    /**
     * Renderiza la distribución con números formateados
     */
    renderDistribution(distribution) {
        let html = '';
        
        if (distribution.PZO > 0) {
            html += `
                <tr>
                    <td>Oficina PZO (${DISTRIBUTION_FACTORS.OFFICE * 100 / 2}%)</td>
                    <td class="text-end">${this.formatCurrency(distribution.PZO)}</td>
                </tr>
            `;
        }
        
        if (distribution.CCS > 0) {
            html += `
                <tr>
                    <td>Oficina CCS (${DISTRIBUTION_FACTORS.OFFICE * 100 / 2}%)</td>
                    <td class="text-end">${this.formatCurrency(distribution.CCS)}</td>
                </tr>
            `;
        }
        
        html += `
            <tr>
                <td>Ejecutivo (${DISTRIBUTION_FACTORS.EXECUTIVE * 100}%)</td>
                <td class="text-end">${this.formatCurrency(distribution.executive)}</td>
            </tr>
            <tr>
                <td>Ganancia en Cliente (${DISTRIBUTION_FACTORS.CLIENT * 100}%)</td>
                <td class="text-end">${this.formatCurrency(distribution.clientProfit)}</td>
            </tr>
        `;
        
        return html;
    }

    /**
     * Calcula los totales globales de todas las transacciones
     * @returns {Object} Objeto con los totales calculados
     */
    calculateGlobalTotals() {
        return this.transactions.reduce((acc, trans) => ({
            totalAmount: acc.totalAmount + trans.amount,
            totalArbitrary: acc.totalArbitrary + trans.arbitraryCommissions.reduce((sum, comm) => sum + comm.amount, 0),
            totalClientProfit: acc.totalClientProfit + trans.distribution.clientProfit,
            totalExecutive: acc.totalExecutive + trans.distribution.executive,
            totalPZO: acc.totalPZO + (trans.distribution.PZO || 0),
            totalCCS: acc.totalCCS + (trans.distribution.CCS || 0)
        }), {
            totalAmount: 0,
            totalArbitrary: 0,
            totalClientProfit: 0,
            totalExecutive: 0,
            totalPZO: 0,
            totalCCS: 0
        });
    }

    /**
     * Renderiza las filas de totales globales con números formateados
     */
    renderGlobalTotalsRows(totals) {
        return `
            <tr>
                <td>Total Viático</td>
                <td class="text-end">${this.formatCurrency(totals.totalArbitrary)}</td>
            </tr>
            <tr>
                <td>Total Ganancia en Cliente</td>
                <td class="text-end">${this.formatCurrency(totals.totalClientProfit)}</td>
            </tr>
            <tr>
                <td>Total Ejecutivo</td>
                <td class="text-end">${this.formatCurrency(totals.totalExecutive)}</td>
            </tr>
            ${totals.totalPZO > 0 ? `
                <tr>
                    <td>Total Oficina PZO</td>
                    <td class="text-end">${this.formatCurrency(totals.totalPZO)}</td>
                </tr>
            ` : ''}
            ${totals.totalCCS > 0 ? `
                <tr>
                    <td>Total Oficina CCS</td>
                    <td class="text-end">${this.formatCurrency(totals.totalCCS)}</td>
                </tr>
            ` : ''}
            <tr>
                <td>Monto Total Operación</td>
                <td class="text-end">${this.formatCurrency(this.totalAmount)}</td>
            </tr>
            <tr>
                <td>Monto Vendido</td>
                <td class="text-end">${this.formatCurrency(totals.totalAmount)}</td>
            </tr>
            <tr>
                <td>Monto Restante</td>
                <td class="text-end">${this.formatCurrency(this.remainingAmount)}</td>
            </tr>
        `;
    }
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando sistema de ventas...');

    // Instanciar el TransactionManager
    const transactionManager = new TransactionManager();

    /**
     * Event Listeners para el Stage 1
     */
    const amountToSell = document.getElementById('amountToSell');
    const clientRate = document.getElementById('clientRate');
    const amountClientReceives = document.getElementById('amountClientReceives');

    // Función para actualizar el monto que recibe el cliente
    function updateClientAmount() {
        const amount = parseFloat(amountToSell.value) || 0;
        const rate = parseFloat(clientRate.value) || 0;
        
        if (amount > 0 && rate > 0) {
            const total = amount * rate;
            amountClientReceives.value = new Intl.NumberFormat('es-VE', {
                style: 'currency',
                currency: 'VES'
            }).format(total);
        } else {
            amountClientReceives.value = '';
        }
    }

    // Event listeners para actualización en tiempo real
    amountToSell.addEventListener('input', updateClientAmount);
    clientRate.addEventListener('input', updateClientAmount);

    /**
     * Event Listener para el formulario principal
     */
    const operationForm = document.getElementById('operationForm');
    if (operationForm) {
        operationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const totalAmount = parseFloat(amountToSell.value);
            const rate = parseFloat(clientRate.value);
            
            if (totalAmount > 0 && rate > 0) {
                window.clientRate = rate;
                transactionManager.setTotalAmount(totalAmount);
            }
        });
    }

    // Event listener para el botón Calcular Transacción
    document.addEventListener('click', (e) => {
        if (e.target.matches('.calculate-transaction')) {
            const form = e.target.closest('.transaction-form');
            if (form) {
                console.log('Calculando transacción...');
                transactionManager.processTransaction(form);
                
                // Actualizar el stage 3 con los resultados
                const stage3 = document.getElementById('stage3');
                if (stage3) {
                    const resultadoOperacion = stage3.querySelector('#resultadoOperacion');
                    if (resultadoOperacion) {
                        resultadoOperacion.innerHTML = transactionManager.renderGlobalSummary();
                    }
                }
            }
        }
    });

    // ... resto del código sin cambios ...
}); 