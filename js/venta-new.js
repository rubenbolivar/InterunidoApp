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
    round: (number, decimals = PRECISION.DECIMALS) => {
        return Number(Math.round(number + 'e' + decimals) + 'e-' + decimals);
    },
    
    isValidNumber: (number) => {
        return typeof number === 'number' && !isNaN(number) && isFinite(number);
    },
    
    parseAmount: (value) => {
        const parsed = parseFloat(value);
        return NumberUtils.isValidNumber(parsed) ? NumberUtils.round(parsed) : null;
    }
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

        // Listener para calcular la comisión cuando cambien los valores relevantes
        const calculateCommission = () => this.calculateCommission(form);
        
        form.addEventListener('calculate-commission', calculateCommission);
        form.querySelector('[name="tasaVenta"]').addEventListener('input', calculateCommission);
        form.querySelector('[name="tasaOficina"]').addEventListener('input', calculateCommission);
        form.querySelector('[name="bankCommission"]').addEventListener('change', calculateCommission);
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
        try {
            if (!this.validateTransactionData(transactionData)) {
                throw new Error(VALIDATION_MESSAGES.INVALID_AMOUNT);
            }

            // 1. Cálculo del Total de Venta en Bolívares
            const totalSale = NumberUtils.round(
                transactionData.amount * transactionData.sellingRate
            );

            // 2. Cálculo de la Diferencia
            const baseCost = NumberUtils.round(
                transactionData.amount * transactionData.officeRate
            );
            const difference = NumberUtils.round(totalSale - baseCost);

            // 3. Procesar comisiones arbitrarias (en USD)
            const arbitraryCommissions = transactionData.arbitraryCommissions.map(commission => {
                const amountBs = NumberUtils.round(difference * (commission.percentage / 100));
                const amountUSD = NumberUtils.round(amountBs / transactionData.sellingRate);
                return {
                    ...commission,
                    amount: amountUSD,
                    amountBs: amountBs
                };
            });

            // 4. Calcular monto total de comisiones en Bs
            const totalArbitraryCommissionsBs = arbitraryCommissions.reduce(
                (sum, commission) => sum + commission.amountBs, 
                0
            );

            // 5. Calcular monto a repartir en USD
            const amountToDistribute = NumberUtils.round(
                (difference - totalArbitraryCommissionsBs) / transactionData.officeRate
            );

            // 6. Calcular distribución
            const officeDistributionFactor = transactionData.selectedOffices.length === 2 ? 0.5 : 1;
            
            const distribution = {
                PZO: 0,
                CCS: 0,
                executive: NumberUtils.round(amountToDistribute * 0.40), // 40% para ejecutivo
                clientProfit: 0
            };

            // Distribución para oficinas (30% total)
            if (transactionData.selectedOffices.includes('PZO')) {
                distribution.PZO = NumberUtils.round(
                    amountToDistribute * 0.30 * officeDistributionFactor
                );
            }
            if (transactionData.selectedOffices.includes('CCS')) {
                distribution.CCS = NumberUtils.round(
                    amountToDistribute * 0.30 * officeDistributionFactor
                );
            }

            // Ganancia en Cliente es la suma de las oficinas
            distribution.clientProfit = NumberUtils.round(
                distribution.PZO + distribution.CCS
            );

            console.debug('Cálculo de transacción:', {
                totalSale,
                baseCost,
                difference,
                arbitraryCommissions,
                amountToDistribute,
                distribution,
                originalData: { ...transactionData }
            });

            return {
                totalSale,
                difference,
                arbitraryCommissions,
                amountToDistribute,
                distribution
            };
        } catch (error) {
            console.error('Error en cálculo de transacción:', error);
            throw error;
        }
    }

    // Método auxiliar para validar datos de transacción
    validateTransactionData(data) {
        return (
            data &&
            NumberUtils.isValidNumber(data.amount) &&
            data.amount > 0 &&
            NumberUtils.isValidNumber(data.sellingRate) &&
            data.sellingRate > 0 &&
            data.amount <= this.remainingAmount
        );
    }

    // Método para calcular comisiones arbitrarias con validación
    calculateArbitraryCommissions(difference, sellingRate, commissions) {
        return commissions.map(comm => {
            const percentage = NumberUtils.parseAmount(comm.percentage);
            if (!NumberUtils.isValidNumber(percentage)) {
                throw new Error(`Porcentaje inválido para comisión ${comm.name}`);
            }
            
            return {
                name: comm.name,
                percentage: percentage,
                amount: NumberUtils.round((difference / sellingRate) * (percentage / 100))
            };
        });
    }

    // Método para calcular distribución con validación
    calculateValidatedDistribution(amount, hasOfficeRate, selectedOffices) {
        if (!NumberUtils.isValidNumber(amount)) {
            throw new Error(VALIDATION_MESSAGES.CALCULATION_ERROR);
        }

        if (!hasOfficeRate) {
            return {
                PZO: 0,
                CCS: 0,
                executive: 0,
                clientProfit: NumberUtils.round(amount)
            };
        }

        const officeCount = selectedOffices.length;
        const distribution = {
            PZO: 0,
            CCS: 0,
            executive: NumberUtils.round(amount * DISTRIBUTION_FACTORS.EXECUTIVE),
            clientProfit: NumberUtils.round(amount * DISTRIBUTION_FACTORS.CLIENT)
        };

        if (officeCount > 0) {
            const officeShare = NumberUtils.round(
                (amount * DISTRIBUTION_FACTORS.OFFICE) / officeCount
            );
            
            if (selectedOffices.includes('PZO')) distribution.PZO = officeShare;
            if (selectedOffices.includes('CCS')) distribution.CCS = officeShare;
        }

        return distribution;
    }

    /**
     * Procesa una transacción completa
     * @param {HTMLElement} form - Formulario de la transacción
     */
    processTransaction(form) {
        console.log('Procesando transacción...');
        try {
            const transactionData = this.collectFormData(form);
            
            if (!transactionData) {
                console.error('Datos de transacción inválidos');
                return;
            }

            console.log('Datos recolectados:', transactionData);

            const calculation = this.calculateTransaction(transactionData);
            console.log('Cálculos realizados:', calculation);
            
            // Agregar la transacción al array
            this.transactions.push({
                ...transactionData,
                ...calculation
            });

            // Actualizar monto restante
            this.remainingAmount -= transactionData.amount;

            // Deshabilitar campos del formulario
            form.querySelectorAll('input, select, button:not(.add-arbitrary-commission)').forEach(el => el.disabled = true);
            
            // Ocultar botón de agregar comisión
            const addCommissionBtn = form.querySelector('.add-arbitrary-commission');
            if (addCommissionBtn) {
                addCommissionBtn.style.display = 'none';
            }
            
            // Actualizar UI y mostrar Stage 3
            this.updateUI();
            document.getElementById('stage3').style.display = 'block';

            console.log('Transacción procesada exitosamente');
            return true;
        } catch (error) {
            console.error('Error en processTransaction:', error);
            alert('Error al procesar la transacción: ' + error.message);
            return false;
        }
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
        try {
            const totals = this.transactions.reduce((acc, trans) => ({
                totalAmount: NumberUtils.round(acc.totalAmount + trans.amount),
                totalArbitrary: NumberUtils.round(acc.totalArbitrary + trans.arbitraryCommissions.reduce((sum, comm) => sum + comm.amount, 0)),
                totalClientProfit: NumberUtils.round(acc.totalClientProfit + trans.distribution.clientProfit),
                totalExecutive: NumberUtils.round(acc.totalExecutive + trans.distribution.executive),
                totalPZO: NumberUtils.round(acc.totalPZO + (trans.distribution.PZO || 0)),
                totalCCS: NumberUtils.round(acc.totalCCS + (trans.distribution.CCS || 0))
            }), {
                totalAmount: 0,
                totalArbitrary: 0,
                totalClientProfit: 0,
                totalExecutive: 0,
                totalPZO: 0,
                totalCCS: 0
            });

            // Validar totales
            Object.keys(totals).forEach(key => {
                if (!NumberUtils.isValidNumber(totals[key])) {
                    console.error(`Error en el cálculo de ${key}:`, totals[key]);
                    totals[key] = 0;
                }
            });

            return `
                <div class="global-summary mt-4">
                    <h5 class="mb-3">Totales de la Operación</h5>
                    <div class="table-responsive">
                        <table class="table table-sm table-hover">
                            <tbody>
                                <tr>
                                    <td>Total Viático (2%)</td>
                                    <td class="text-end fw-bold">${this.formatCurrency(totals.totalArbitrary)}</td>
                                </tr>
                                <tr>
                                    <td>Total Ganancia en Cliente</td>
                                    <td class="text-end fw-bold">${this.formatCurrency(totals.totalClientProfit)}</td>
                                </tr>
                                <tr>
                                    <td>Total Ejecutivo</td>
                                    <td class="text-end fw-bold">${this.formatCurrency(totals.totalExecutive)}</td>
                                </tr>
                                ${totals.totalPZO > 0 ? `
                                    <tr>
                                        <td>Total Oficina PZO</td>
                                        <td class="text-end fw-bold">${this.formatCurrency(totals.totalPZO)}</td>
                                    </tr>
                                ` : ''}
                                ${totals.totalCCS > 0 ? `
                                    <tr>
                                        <td>Total Oficina CCS</td>
                                        <td class="text-end fw-bold">${this.formatCurrency(totals.totalCCS)}</td>
                                    </tr>
                                ` : ''}
                                <tr class="table-info">
                                    <td>Monto Total Operación</td>
                                    <td class="text-end fw-bold">${this.formatCurrency(this.totalAmount)}</td>
                                </tr>
                                <tr class="table-success">
                                    <td>Monto Vendido</td>
                                    <td class="text-end fw-bold">${this.formatCurrency(totals.totalAmount)}</td>
                                </tr>
                                <tr class="table-warning">
                                    <td>Monto Restante</td>
                                    <td class="text-end fw-bold">${this.formatCurrency(this.remainingAmount)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error en updateGlobalSummary:', error);
            return `<div class="alert alert-danger">Error al calcular el resumen global: ${error.message}</div>`;
        }
    }

    renderTransactionResult(transaction, index) {
        try {
            // Validar datos de la transacción
            if (!transaction || !NumberUtils.isValidNumber(transaction.totalSale)) {
                throw new Error('Datos de transacción inválidos');
            }

            return `
                <div class="transaction-result mb-4">
                    <div class="card shadow-sm">
                        <div class="card-header bg-light">
                            <h6 class="text-primary mb-0">
                                <i class="fas fa-exchange-alt me-2"></i>
                                Transacción ${index + 1} - Operador: ${transaction.operatorName}
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-sm table-hover">
                                    <tbody>
                                        <tr>
                                            <td>Total de la Venta</td>
                                            <td class="text-end fw-bold">${this.formatCurrency(transaction.totalSale, 'Bs.')}</td>
                                        </tr>
                                        <tr>
                                            <td>Diferencia</td>
                                            <td class="text-end fw-bold">${this.formatCurrency(transaction.difference, 'Bs.')}</td>
                                        </tr>
                                        ${this.renderValidatedArbitraryCommissions(transaction.arbitraryCommissions)}
                                        <tr class="table-info">
                                            <td>Monto a Repartir</td>
                                            <td class="text-end fw-bold">${this.formatCurrency(transaction.amountToDistribute)}</td>
                                        </tr>
                                        ${this.renderValidatedDistribution(transaction.distribution)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error al renderizar transacción:', error);
            return `
                <div class="alert alert-danger">
                    Error al mostrar la transacción ${index + 1}: ${error.message}
                </div>
            `;
        }
    }

    renderValidatedArbitraryCommissions(commissions) {
        if (!Array.isArray(commissions)) return '';
        
        return commissions.map(comm => {
            if (!comm || !NumberUtils.isValidNumber(comm.amount)) {
                console.warn('Comisión inválida:', comm);
                return '';
            }
            
            return `
                <tr>
                    <td>${comm.name} (${comm.percentage}%)</td>
                    <td class="text-end">${this.formatCurrency(comm.amount)}</td>
                </tr>
            `;
        }).join('');
    }

    renderValidatedDistribution(distribution) {
        if (!distribution) return '';

        let html = '';
        
        if (NumberUtils.isValidNumber(distribution.PZO) && distribution.PZO > 0) {
            html += `
                <tr>
                    <td>Oficina PZO (${DISTRIBUTION_FACTORS.OFFICE * 50}%)</td>
                    <td class="text-end">${this.formatCurrency(distribution.PZO)}</td>
                </tr>
            `;
        }
        
        if (NumberUtils.isValidNumber(distribution.CCS) && distribution.CCS > 0) {
            html += `
                <tr>
                    <td>Oficina CCS (${DISTRIBUTION_FACTORS.OFFICE * 50}%)</td>
                    <td class="text-end">${this.formatCurrency(distribution.CCS)}</td>
                </tr>
            `;
        }
        
        return html + `
            <tr>
                <td>Ejecutivo (${DISTRIBUTION_FACTORS.EXECUTIVE * 100}%)</td>
                <td class="text-end">${this.formatCurrency(distribution.executive)}</td>
            </tr>
            <tr>
                <td>Ganancia en Cliente (${DISTRIBUTION_FACTORS.CLIENT * 100}%)</td>
                <td class="text-end">${this.formatCurrency(distribution.clientProfit)}</td>
            </tr>
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
                        ${this.renderValidatedArbitraryCommissions(transaction.arbitraryCommissions)}
                        <tr>
                            <td>Monto a Repartir</td>
                            <td class="text-end">${this.formatCurrency(transaction.amountToDistribute)}</td>
                        </tr>
                        ${this.renderValidatedDistribution(transaction.distribution)}
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

    createTransactionForm(index) {
        return `
            <div class="transaction-form mb-4" data-transaction-index="${index}">
                <h6 class="text-primary mb-4">Transacción ${index}</h6>
                
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
                    <div class="arbitrary-commissions-container">
                        <!-- Las comisiones arbitrarias se agregarán aquí -->
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-secondary mt-2 add-arbitrary-commission">
                        <i class="fas fa-plus"></i> Agregar Comisión
                    </button>
                </div>

                <button type="button" class="btn btn-primary w-100 calculate-transaction">
                    Calcular Transacción
                </button>
            </div>
        `;
    }

    collectFormData(form) {
        if (!form) {
            console.error('Formulario no encontrado');
            return null;
        }

        try {
            // Obtener el valor de la comisión bancaria
            const bankCommissionSelect = form.querySelector('[name="bankCommission"]');
            const bankCommission = bankCommissionSelect ? bankCommissionSelect.value : '100.0000';
            
            // Validar que la comisión existe en nuestras constantes
            if (!COMMISSION_FACTORS[bankCommission]) {
                console.error('Comisión bancaria no válida:', bankCommission);
                throw new Error(VALIDATION_MESSAGES.INVALID_COMMISSION);
            }

            console.debug('Comisión bancaria seleccionada:', bankCommission);

            // Recolectar datos del formulario
            const data = {
                operatorName: form.querySelector('[name="operador"]')?.value || '',
                amount: NumberUtils.parseAmount(form.querySelector('[name="montoTransaccion"]')?.value),
                sellingRate: NumberUtils.parseAmount(form.querySelector('[name="tasaVenta"]')?.value),
                officeRate: NumberUtils.parseAmount(form.querySelector('[name="tasaOficina"]')?.value),
                bankCommission: bankCommission,
                selectedOffices: Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value),
                arbitraryCommissions: this.collectArbitraryCommissions(form)
            };

            console.debug('Datos recolectados:', data);
            
            // Validar datos críticos
            if (!data.amount || !data.sellingRate) {
                throw new Error('Datos de transacción incompletos');
            }

            return data;
        } catch (error) {
            console.error('Error al recolectar datos del formulario:', error);
            throw error;
        }
    }

    addArbitraryCommissionFields(form) {
        const container = form.querySelector('.arbitrary-commissions-container');
        const commissionRow = document.createElement('div');
        commissionRow.className = 'arbitrary-commission-row d-flex gap-2 align-items-center mb-2';
        commissionRow.innerHTML = `
            <input type="text" class="form-control form-control-sm" 
                   name="arbitraryCommissionName[]" placeholder="Nombre">
            <input type="number" class="form-control form-control-sm" 
                   name="arbitraryCommissionPercentage[]" step="0.01" placeholder="%">
            <button type="button" class="btn btn-sm btn-danger remove-commission">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(commissionRow);

        // Event listener para remover la comisión
        commissionRow.querySelector('.remove-commission').addEventListener('click', () => {
            commissionRow.remove();
        });
    }

    /**
     * Métodos Auxiliares de Renderizado y Cálculo
     */

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

    calculateCommission(form) {
        const sellingRate = parseFloat(form.querySelector('[name="tasaVenta"]').value) || 0;
        const officeRate = parseFloat(form.querySelector('[name="tasaOficina"]').value) || 0;
        const bankCommissionStr = form.querySelector('[name="bankCommission"]').value;
        const bankCommissionFactor = parseFloat(bankCommissionStr) / 100;

        // Determinar qué tasa usar
        const rateToUse = officeRate || window.clientRate || 0;

        // Calcular la comisión
        const commission = rateToUse * bankCommissionFactor;

        // Actualizar el campo
        const commissionField = form.querySelector('[name="commission"]');
        if (commissionField) {
            commissionField.value = commission.toFixed(4);
        }

        return commission;
    }

    collectArbitraryCommissions(form) {
        try {
            const arbitraryCommissionsContainer = form.querySelector('.arbitrary-commissions-container');
            if (!arbitraryCommissionsContainer) {
                return [];
            }

            return Array.from(arbitraryCommissionsContainer.querySelectorAll('.arbitrary-commission-row')).map(row => {
                const name = row.querySelector('[name^="arbitraryCommissionName"]')?.value || '';
                const percentage = NumberUtils.parseAmount(
                    row.querySelector('[name^="arbitraryCommissionPercentage"]')?.value
                ) || 0;

                console.debug('Comisión arbitraria encontrada:', { name, percentage });

                return {
                    name: name,
                    percentage: percentage
                };
            }).filter(commission => commission.name && commission.percentage > 0);
        } catch (error) {
            console.error('Error al recolectar comisiones arbitrarias:', error);
            return [];
        }
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
                try {
                    // Procesar la transacción
                    transactionManager.processTransaction(form);
                    
                    // Actualizar el stage 3 con los resultados
                    const stage3 = document.getElementById('stage3');
                    if (stage3) {
                        const resultadoOperacion = stage3.querySelector('#resultadoOperacion');
                        if (resultadoOperacion) {
                            // Agregar log para debugging
                            console.log('Actualizando Stage 3...');
                            resultadoOperacion.innerHTML = transactionManager.updateGlobalSummary();
                            
                            // Hacer visible el Stage 3
                            stage3.style.display = 'block';
                        } else {
                            console.error('No se encontró el contenedor de resultados');
                        }
                    } else {
                        console.error('No se encontró el Stage 3');
                    }
                } catch (error) {
                    console.error('Error al procesar la transacción:', error);
                    alert('Error al procesar la transacción: ' + error.message);
                }
            }
        }
    });

    // ... resto del código sin cambios ...
}); 