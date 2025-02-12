// Constantes y configuración
const COMMISSION_FACTORS = {
    '100.0000': 1.0000,
    '100.1000': 1.0010,
    '100.2500': 1.0025,
    '100.3000': 1.0030
};

const DISTRIBUTION_FACTORS = {
    OFFICE: 0.30,    // 30% para oficinas
    EXECUTIVE: 0.40  // 40% para ejecutivo
};

class TransactionManager {
    constructor() {
        this.transactions = [];
        this.totalAmount = 0;
        this.remainingAmount = 0;
        this.clientRate = 0;
        
        // Bindings
        this.addTransaction = this.addTransaction.bind(this);
        this.calculateTransaction = this.calculateTransaction.bind(this);
        this.updateGlobalSummary = this.updateGlobalSummary.bind(this);
    }

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

    calculateTransaction(transactionData) {
        const totalSale = transactionData.amount * transactionData.sellingRate;
        const bankCommission = parseFloat(transactionData.bankCommission) / 100;
        const effectiveRate = transactionData.officeRate || this.clientRate;
        
        // Calcular diferencia
        const difference = totalSale - (transactionData.amount * effectiveRate);

        // Procesar comisiones arbitrarias
        const arbitraryCommissions = transactionData.arbitraryCommissions.map(comm => ({
            name: comm.name,
            percentage: comm.percentage,
            amount: (difference * comm.percentage) / 100
        }));

        const totalArbitraryAmount = arbitraryCommissions.reduce((sum, comm) => sum + comm.amount, 0);

        // Calcular distribución
        const distribution = {
            PZO: 0,
            CCS: 0,
            executive: 0,
            clientProfit: 0
        };

        const amountToDistribute = difference - totalArbitraryAmount;

        if (transactionData.officeRate) {
            const selectedOffices = transactionData.selectedOffices;
            const officeCount = selectedOffices.length;
            if (officeCount > 0) {
                const officeShare = amountToDistribute * 0.30 / officeCount;
                if (selectedOffices.includes('PZO')) distribution.PZO = officeShare;
                if (selectedOffices.includes('CCS')) distribution.CCS = officeShare;
            }
            distribution.executive = amountToDistribute * 0.40;
            distribution.clientProfit = amountToDistribute * 0.30;
        } else {
            distribution.clientProfit = amountToDistribute;
        }

        return {
            totalSale,
            difference,
            arbitraryCommissions,
            amountToDistribute,
            distribution
        };
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
        // Actualizar montos en la UI
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

    processTransaction(form) {
        const transactionData = this.collectFormData(form);
        if (!transactionData) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }

        // Verificar que el monto no exceda el restante
        if (transactionData.amount > this.remainingAmount) {
            alert(`El monto no puede exceder el restante (${this.remainingAmount})`);
            return;
        }

        const calculation = this.calculateTransaction(transactionData);
        
        // Actualizar el monto restante
        this.remainingAmount -= transactionData.amount;

        // Agregar la transacción al array
        this.transactions.push({
            ...transactionData,
            ...calculation
        });

        // Deshabilitar el formulario procesado
        form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
        
        // Actualizar montos mostrados
        this.updateUI();

        // Si es la última transacción (monto restante = 0), mostrar Stage 3
        if (this.remainingAmount === 0) {
            this.showFinalSummary();
        }
    }

    // Agregar método para manejar el botón "Continuar a Resumen"
    showFinalSummary() {
        if (this.transactions.length === 0) {
            alert('Debe calcular al menos una transacción antes de continuar.');
            return;
        }

        // Verificar si hay monto restante
        if (this.remainingAmount > 0) {
            alert(`Aún queda un monto restante de $${this.remainingAmount.toFixed(2)} por procesar.`);
            return;
        }

        // Mostrar Stage 3
        document.querySelectorAll('.stage').forEach(stage => {
            stage.style.display = stage.id === 'stage3' ? 'block' : 'none';
        });

        // Asegurarnos de que el Stage 3 tenga la estructura correcta
        const stage3 = document.getElementById('stage3');
        if (stage3) {
            // Crear la estructura si no existe
            if (!stage3.querySelector('.card')) {
                stage3.innerHTML = `
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0">Resultado de la Operación</h5>
                        </div>
                        <div class="card-body">
                            <!-- Aquí se insertarán los resultados -->
                        </div>
                    </div>
                `;
            }

            // Generar el contenido
            let content = '';
            this.transactions.forEach((trans, index) => {
                content += this.renderTransactionResult(trans, index);
            });
            content += this.renderGlobalSummary();

            // Insertar el contenido en el card-body
            const cardBody = stage3.querySelector('.card-body');
            if (cardBody) {
                cardBody.innerHTML = content;
            } else {
                console.error('No se encontró el card-body en Stage 3');
            }
        } else {
            console.error('No se encontró el Stage 3');
        }
    }

    createTransactionForm(transactionNumber) {
        const formHTML = `
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

                    <button type="button" class="btn btn-primary w-100 calculate-transaction">
                        Calcular Transacción
                    </button>
                </div>
            </div>
        `;

        return formHTML;
    }

    setupFormEventListeners(form) {
        // Mejorar el manejo de checkboxes de oficinas
        const officeCheckboxes = form.querySelectorAll('input[type="checkbox"]');
        officeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const officeName = e.target.value; // 'PZO' o 'CCS'
                console.log(`Oficina ${officeName} ${e.target.checked ? 'seleccionada' : 'deseleccionada'}`);
            });
        });

        // Manejo de la tasa de oficina
        const officeRateInput = form.querySelector('.tasaOficina');
        const officeSelection = form.querySelector('.comisiones-arbitrarias');
        if (officeRateInput && officeSelection) {
            officeRateInput.addEventListener('input', (e) => {
                officeSelection.style.display = e.target.value ? 'block' : 'none';
            });
        }

        // Botón de calcular transacción
        const calculateBtn = form.querySelector('.calculate-transaction');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => {
                this.processTransaction(form);
            });
        }

        // Agregar comisión arbitraria
        form.querySelector('.add-arbitrary-commission').addEventListener('click', () => {
            this.addArbitraryCommissionFields(form);
        });
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
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Asegurarse de que solo el Stage 1 esté visible inicialmente
    document.querySelectorAll('.stage').forEach(stage => {
        stage.style.display = stage.id === 'stage1' ? 'block' : 'none';
    });

    const transactionManager = new TransactionManager();

    // Agregar cálculo dinámico para el monto que debe recibir el cliente
    const amountToSell = document.getElementById('amountToSell');
    const clientRate = document.getElementById('clientRate');
    const amountClientReceives = document.getElementById('amountClientReceives');

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

    // Agregar event listeners para actualización en tiempo real
    amountToSell.addEventListener('input', updateClientAmount);
    clientRate.addEventListener('input', updateClientAmount);

    // Asegurarse de que el formulario del Stage 1 funcione correctamente
    const operationForm = document.getElementById('operationForm');
    if (operationForm) {
        operationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const totalAmount = parseFloat(amountToSell.value);
            const rate = parseFloat(clientRate.value);
            
            if (totalAmount > 0 && rate > 0) {
                window.clientRate = rate;
                transactionManager.setTotalAmount(totalAmount);
                
                // Actualizar visualización de stages
                document.querySelectorAll('.stage').forEach(stage => {
                    stage.style.display = stage.id === 'stage2' ? 'block' : 'none';
                });
                
                // Actualizar montos mostrados en Stage 2
                const montoTotalElement = document.getElementById('montoTotal');
                const montoRestanteElement = document.getElementById('montoRestante');
                if (montoTotalElement) montoTotalElement.textContent = totalAmount.toFixed(2);
                if (montoRestanteElement) montoRestanteElement.textContent = totalAmount.toFixed(2);
            }
        });
    }

    // Agregar event listener para el botón de agregar transacción
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => {
            const transactionsContainer = document.getElementById('transactionsContainer');
            const transactionCount = transactionsContainer.children.length + 1;
            const newTransactionHTML = transactionManager.createTransactionForm(transactionCount);
            
            // Crear un contenedor temporal para el nuevo formulario
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = newTransactionHTML;
            
            // Agregar el nuevo formulario al contenedor
            transactionsContainer.appendChild(tempContainer.firstElementChild);
            
            // Configurar los event listeners para el nuevo formulario
            transactionManager.setupFormEventListeners(transactionsContainer.lastElementChild);
        });
    }

    // Agregar event listener para el botón "Continuar a Resumen"
    const continueToSummaryBtn = document.querySelector('[data-continue-to-summary]');
    if (continueToSummaryBtn) {
        continueToSummaryBtn.addEventListener('click', () => {
            transactionManager.showFinalSummary();
        });
    }

    // Event listener para el botón de calcular transacción
    document.addEventListener('click', (e) => {
        if (e.target.matches('.calculate-transaction')) {
            const form = e.target.closest('.transaction-form');
            if (form) {
                transactionManager.processTransaction(form);
            }
        }
    });

    console.log('Sistema de ventas inicializado correctamente');
}); 