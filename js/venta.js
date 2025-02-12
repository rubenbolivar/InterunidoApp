document.addEventListener('DOMContentLoaded', () => {
    // 1. DECLARACIÓN DE VARIABLES Y ELEMENTOS DOM - GENERAL
    const operationForm = document.getElementById('operationForm');
    const clientNameInput = document.getElementById('clientName');
    const amountToSellInput = document.getElementById('amountToSell');
    const currencyTypeSelect = document.getElementById('currencyType');
    const clientRateInput = document.getElementById('clientRate');
    const amountClientReceivesInput = document.getElementById('amountClientReceives');
    const addTransactionBtn = document.getElementById('addTransaction');
    const transactionsDiv = document.getElementById('transactions');
    const resultsDiv = document.getElementById('results');

    // 2. VARIABLES DE ESTADO
    let montoQueDeseaVender = 0;
    let tasaCliente = 0;
    let selectedCurrency = '';
    let currencySymbol = '$';
    let montoTotal = 0;
    let montoRestante = 0;
    let transactions = [];

    // 3. EVENT LISTENERS

    // Función mejorada para calcular y formatear el monto que recibe el cliente
    function calculateMontoClienteReceives() {
        const amount = parseFloat(amountToSellInput.value) || 0;
        const rate = parseFloat(clientRateInput.value) || 0;
        const total = amount * rate;
        amountClientReceivesInput.value = new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(total);
    }

    // Event listeners para cálculo en tiempo real
    amountToSellInput.addEventListener('input', calculateMontoClienteReceives);
    clientRateInput.addEventListener('input', calculateMontoClienteReceives);

    // Manejo del formulario Stage 1
    operationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validateFields()) return;

        // Guardar valores globales
        montoQueDeseaVender = parseFloat(amountToSellInput.value);
        tasaCliente = parseFloat(clientRateInput.value);
        selectedCurrency = currencyTypeSelect.value;
        montoRestante = montoQueDeseaVender;

        // Mostrar Stage 2 con el diseño correcto
        const stage2 = document.getElementById('stage2');
        stage2.innerHTML = `
            <div class="card shadow-sm">
                <div class="card-body">
                    <h5 class="card-title text-primary mb-4">Transacción 1</h5>
                    
                    <div class="mb-3">
                        <label class="form-label">Nombre del Operador:</label>
                        <input type="text" class="form-control operador">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Monto:</label>
                        <input type="number" class="form-control monto-transaccion" 
                               step="0.01" max="${montoRestante}">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Tasa de Venta:</label>
                        <input type="number" class="form-control tasa-venta">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Tasa Oficina:</label>
                        <input type="number" class="form-control tasa-oficina">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Selección de Oficinas:</label>
                        <div class="form-check">
                            <input class="form-check-input oficina-pzo">
                            <label class="form-check-label">Oficina PZO</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input oficina-ccs">
                            <label class="form-check-label">Oficina CCS</label>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Comisión Bancaria:</label>
                        <select class="form-select comision-bancaria">
                            <option value="100.0000">100.0000%</option>
                            <option value="100.1000">100.1000%</option>
                            <option value="100.2500">100.2500%</option>
                            <option value="100.3000">100.3000%</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Comisión:</label>
                        <input type="text" class="form-control comision-calculada" readonly>
                    </div>

                    <div class="mb-4">
                        <label class="form-label">Comisiones Arbitrarias</label>
                        <button type="button" class="btn btn-link p-0" id="addArbitraryCommission">
                            <i class="fas fa-plus"></i>
                        </button>
                        <div id="arbitraryCommissions"></div>
                    </div>

                    <button type="button" class="btn btn-primary w-100" id="calcularTransaccion">
                        Calcular Transacción
                    </button>
                </div>
            </div>
        `;

        // Mostrar Stage 3 con el diseño inicial
        const stage3 = document.getElementById('stage3');
        stage3.innerHTML = `
            <div class="card shadow-sm">
                <div class="card-body">
                    <h5 class="card-title text-primary mb-4">Resultado de la Operación</h5>
                    
                    <h6 class="mb-3">Totales de la Operación</h6>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Concepto</th>
                                    <th class="text-end">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Total Ganancia en Cliente</td>
                                    <td class="text-end">$ 0,00</td>
                                </tr>
                                <tr>
                                    <td>Monto Vendido</td>
                                    <td class="text-end">$ 0,00</td>
                                </tr>
                                <tr>
                                    <td>Monto Restante</td>
                                    <td class="text-end">$ ${montoQueDeseaVender.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Mostrar los stages
        document.getElementById('stage1').classList.remove('active');
        stage2.classList.add('active');
        stage3.classList.add('active');

        // Inicializar eventos del Stage 2
        initializeStage2Events();
    });

    function initializeStage2Events() {
        // Remover listeners previos si existen
        const calcularBtn = document.getElementById('calcularTransaccion');
        if (calcularBtn) {
            const newBtn = calcularBtn.cloneNode(true);
            calcularBtn.parentNode.replaceChild(newBtn, calcularBtn);
            newBtn.addEventListener('click', processTransaction);
        }

        // Event listeners para cálculos automáticos
        ['tasaVenta', 'tasaOficina', 'montoTransaccion', 'comisionBancaria'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', calculateCommission);
            }
        });

        // Event listener para comisiones arbitrarias
        const addCommissionBtn = document.getElementById('addArbitraryCommission');
        if (addCommissionBtn) {
            addCommissionBtn.addEventListener('click', addArbitraryCommission);
        }

        // Event delegation para remover comisiones arbitrarias
        document.getElementById('arbitraryCommissions').addEventListener('click', (e) => {
            if (e.target.closest('.remove-commission')) {
                e.target.closest('.arbitrary-commission').remove();
            }
        });
    }

    function calculateCommission() {
        const tasaVenta = parseFloat(document.getElementById('tasaVenta').value) || 0;
        const tasaOficina = parseFloat(document.getElementById('tasaOficina').value) || tasaCliente;
        const comisionBancaria = document.getElementById('comisionBancaria').value;
        
        // Convertir el porcentaje a factor decimal
        let factorComision = parseFloat(comisionBancaria) / 100;
        
        // Calcular la comisión según la fórmula
        const comisionCalculada = tasaOficina * factorComision;
        
        // Mostrar el resultado formateado
        document.getElementById('comisionCalculada').value = comisionCalculada.toFixed(4);
    }

    function addArbitraryCommission() {
        const arbitraryCommissionsDiv = document.getElementById('arbitraryCommissions');
        const newCommission = document.createElement('div');
        newCommission.className = 'arbitrary-commission mb-2';
        newCommission.innerHTML = `
            <div class="d-flex gap-2 align-items-center">
                <input type="text" class="form-control" placeholder="Nombre" required>
                <input type="number" class="form-control" placeholder="%" step="0.01" required>
                <button type="button" class="btn btn-outline-danger btn-sm remove-commission">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        arbitraryCommissionsDiv.appendChild(newCommission);
    }

    function processTransaction(e) {
        try {
            console.log('Iniciando processTransaction');
            
            // Obtener el formulario desde stage2
            const stage2 = document.getElementById('stage2');
            if (!stage2) {
                throw new Error('No se encontró el contenedor stage2');
            }

            // Obtener los valores
            const transaction = {
                operador: stage2.querySelector('.operador')?.value,
                monto: parseFloat(stage2.querySelector('.monto-transaccion')?.value),
                tasaVenta: parseFloat(stage2.querySelector('.tasa-venta')?.value),
                tasaOficina: parseFloat(stage2.querySelector('.tasa-oficina')?.value),
                oficinaPZO: stage2.querySelector('.oficina-pzo')?.checked || false,
                oficinaCCS: stage2.querySelector('.oficina-ccs')?.checked || false,
                comisionBancaria: parseFloat(stage2.querySelector('.comision-bancaria')?.value) / 100
            };

            console.log('Datos de la transacción:', transaction);

            // Validaciones básicas
            if (!transaction.operador || isNaN(transaction.monto) || isNaN(transaction.tasaVenta)) {
                throw new Error('Por favor complete todos los campos requeridos');
            }

            // Calcular comisiones
            const comision = calcularComision(transaction);
            console.log('Comisión calculada:', comision);

            // Agregar la transacción al array
            transactions.push({
                ...transaction,
                comision: comision.comisionTotal,
                comisionBancariaCalculada: comision.comisionBancaria,
                comisionOficinasCalculada: comision.comisionOficinas
            });

            // Actualizar montoRestante
            montoRestante = montoTotal - transactions.reduce((sum, t) => sum + t.monto, 0);

            // Mostrar resultados
            mostrarResultados();

            // Preparar siguiente transacción si hay monto restante
            if (montoRestante > 0) {
                crearNuevaTransaccion();
            }

        } catch (error) {
            console.error('Error en processTransaction:', error);
            alert(error.message);
        }
    }

    function disableCurrentForm(form) {
        const inputs = form.querySelectorAll('input, select, button');
        inputs.forEach(input => input.disabled = true);
        form.classList.add('completed');
    }

    function createNewTransactionForm() {
        const transactionCount = document.querySelectorAll('.transaction-form').length + 1;
        const transactionForm = document.createElement('div');
        transactionForm.className = 'transaction-form card shadow-sm mb-4';
        transactionForm.setAttribute('data-id', transactionCount);
        
        // Resto del código de createNewTransactionForm...
    }

    function updateResultsUI() {
        const stage2 = document.getElementById('stage2');
        const stage3 = document.getElementById('stage3');

        if (stage3) {
            let transactionsHTML = '';
            let totalGlobal = {
                totalVenta: 0,
                diferencia: 0,
                comisionesArbitrarias: [],
                montoARepartir: 0,
                montoPZO: 0,
                montoCCS: 0,
                montoEjecutivo: 0,
                gananciaCliente: 0,
                montoVendido: 0
            };

            // Generar HTML para cada transacción
            transactions.forEach((t, index) => {
                const comisionesArbitrarias = obtenerComisionesArbitrarias();
                const totalComisionesArbitrarias = comisionesArbitrarias.reduce((sum, c) => sum + c.monto, 0);
                
                transactionsHTML += `
                    <div class="transaction-result mb-4">
                        <h6 class="text-primary">Transacción ${index + 1} - Operador: ${t.operador}</h6>
                        <div class="table-responsive">
                            <table class="table table-bordered">
                                <tr>
                                    <td>Total de la Venta</td>
                                    <td class="text-end">Bs. ${formatNumber(t.monto)}</td>
                                </tr>
                                <tr>
                                    <td>Diferencia</td>
                                    <td class="text-end">Bs. ${formatNumber(montoRestante)}</td>
                                </tr>
                                ${comisionesArbitrarias.map(c => `
                                    <tr>
                                        <td>${c.concepto} (${c.porcentaje}%)</td>
                                        <td class="text-end">$ ${formatNumber(c.monto)}</td>
                                    </tr>
                                `).join('')}
                                <tr>
                                    <td>Monto a Repartir</td>
                                    <td class="text-end">$ ${formatNumber(t.monto - totalComisionesArbitrarias)}</td>
                                </tr>
                                ${t.oficinaPZO ? `
                                    <tr>
                                        <td>Oficina PZO</td>
                                        <td class="text-end">$ ${formatNumber(t.monto * t.tasaOficina / 100)}</td>
                                    </tr>
                                ` : ''}
                                ${t.oficinaCCS ? `
                                    <tr>
                                        <td>Oficina CCS</td>
                                        <td class="text-end">$ ${formatNumber(t.monto * t.tasaOficina / 100)}</td>
                                    </tr>
                                ` : ''}
                                <tr>
                                    <td>Ganancia en Cliente</td>
                                    <td class="text-end">$ ${formatNumber(t.comision)}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                `;

                // Actualizar totales globales
                totalGlobal.totalVenta += t.monto;
                totalGlobal.comisionesArbitrarias = [...totalGlobal.comisionesArbitrarias, ...comisionesArbitrarias];
                totalGlobal.montoPZO += t.oficinaPZO ? (t.monto * t.tasaOficina / 100) : 0;
                totalGlobal.montoCCS += t.oficinaCCS ? (t.monto * t.tasaOficina / 100) : 0;
                totalGlobal.gananciaCliente += t.comision;
                totalGlobal.montoVendido += t.monto;
            });

            // Agregar resumen global
            transactionsHTML += `
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h5 class="text-primary mb-4">Resumen Global de la Operación</h5>
                        <div class="table-responsive">
                            <table class="table table-bordered">
                                <tr>
                                    <td>Total Comisiones Arbitrarias</td>
                                    <td class="text-end">$ ${formatNumber(totalGlobal.comisionesArbitrarias.reduce((sum, c) => sum + c.monto, 0))}</td>
                                </tr>
                                <tr>
                                    <td>Total Oficina PZO</td>
                                    <td class="text-end">$ ${formatNumber(totalGlobal.montoPZO)}</td>
                                </tr>
                                <tr>
                                    <td>Total Oficina CCS</td>
                                    <td class="text-end">$ ${formatNumber(totalGlobal.montoCCS)}</td>
                                </tr>
                                <tr>
                                    <td>Total Ganancia en Cliente</td>
                                    <td class="text-end">$ ${formatNumber(totalGlobal.gananciaCliente)}</td>
                                </tr>
                                <tr>
                                    <td>Monto Vendido</td>
                                    <td class="text-end">$ ${formatNumber(totalGlobal.montoVendido)}</td>
                                </tr>
                                <tr>
                                    <td>Monto Restante</td>
                                    <td class="text-end">$ ${formatNumber(montoRestante)}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            stage3.innerHTML = transactionsHTML;
        }
    }

    // Función auxiliar para formatear números en bolívares
    function formatNumber(number) {
        return new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(number);
    }

    // 4. FUNCIONES AUXILIARES

    // Función para formatear montos en moneda
    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-VE', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    // Función mejorada para mostrar errores
    function showError(message) {
        // Remover cualquier error previo
        const previousError = document.querySelector('.alert-danger');
        if (previousError) {
            previousError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
        errorDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insertar el error al inicio del stage2
        const stage2 = document.getElementById('stage2');
        if (stage2) {
            stage2.querySelector('.card-body').insertBefore(errorDiv, stage2.querySelector('.card-body').firstChild);
        }

        // Auto-cerrar después de 3 segundos
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    // Función mejorada para mostrar mensajes de éxito
    function showSuccess(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const stage2 = document.getElementById('stage2');
        if (stage2) {
            stage2.querySelector('.card-body').insertBefore(alertDiv, stage2.querySelector('.card-body').firstChild);
        }
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    // Función mejorada para validar campos
    function validateFields() {
        const fields = {
            'clientName': 'Nombre del Cliente',
            'amountToSell': 'Monto a Vender',
            'currencyType': 'Divisa',
            'clientRate': 'Tasa Cliente'
        };

        for (const [id, label] of Object.entries(fields)) {
            const element = document.getElementById(id);
            if (!element.value.trim()) {
                showError(`El campo ${label} es requerido`);
                element.focus();
                return false;
            }
        }

        const amount = parseFloat(amountToSellInput.value);
        if (isNaN(amount) || amount <= 0) {
            showError('El monto debe ser mayor a 0');
            amountToSellInput.focus();
            return false;
        }

        const rate = parseFloat(clientRateInput.value);
        if (isNaN(rate) || rate <= 0) {
            showError('La tasa debe ser mayor a 0');
            clientRateInput.focus();
            return false;
        }

        return true;
    }

    // Función mejorada para validar la transacción
    function validateTransaction(transaction) {
        if (!transaction.operador) {
            showError('Ingrese el nombre del operador');
            return false;
        }
        if (!transaction.monto || transaction.monto <= 0 || transaction.monto > montoRestante) {
            showError(`El monto debe ser mayor a 0 y menor o igual a ${montoRestante}`);
            return false;
        }
        if (!transaction.tasaVenta || transaction.tasaVenta <= 0) {
            showError('Ingrese una tasa de venta válida');
            return false;
        }
        if (!transaction.tasaOficina || transaction.tasaOficina <= 0) {
            showError('Ingrese una tasa de oficina válida');
            return false;
        }
        if (!transaction.oficinaPZO && !transaction.oficinaCCS) {
            showError('Debe seleccionar al menos una oficina');
            return false;
        }
        return true;
    }

    // 5. INICIALIZACIÓN
    document.getElementById('stage1').classList.add('active');
    currencyTypeSelect.addEventListener('change', () => {
        const currency = currencyTypeSelect.value;
        currencySymbol = currency.startsWith('EUR') ? '€' : '$';
        calculateMontoClienteReceives();
    });

    // Función auxiliar para resetear el formulario de transacción
    function resetTransactionForm() {
        document.getElementById('operador').value = '';
        document.getElementById('montoTransaccion').value = '';
        document.getElementById('tasaVenta').value = '';
        document.getElementById('tasaOficina').value = '';
        document.getElementById('oficinaPZO').checked = false;
        document.getElementById('oficinaCCS').checked = false;
        document.getElementById('comisionBancaria').value = '100.0000';
        document.getElementById('comisionCalculada').value = '';
        document.getElementById('arbitraryCommissions').innerHTML = '';
    }

    // Event listener específico para el botón de calcular transacción
    document.body.addEventListener('click', (e) => {
        if (e.target && e.target.matches('#calcularTransaccion')) {
            processTransaction();
        }
    });

    // Primero actualicemos el HTML inicial del formulario en venta.html
    document.addEventListener('DOMContentLoaded', function() {
        // Convertir el formulario inicial para usar clases en lugar de IDs
        const initialForm = document.querySelector('.transaction-form');
        if (initialForm) {
            // Actualizar los selectores del formulario inicial
            const inputs = initialForm.querySelectorAll('input[id], select[id]');
            inputs.forEach(input => {
                const newClass = input.id.replace(/([A-Z])/g, '-$1').toLowerCase();
                input.classList.add(newClass);
                input.removeAttribute('id');
            });
        }
    });

    // Estructura consistente para todos los formularios de transacción
    function createTransactionForm(transactionNumber = 1) {
        return `
            <div class="transaction-form card shadow-sm mb-4">
                <div class="card-body">
                    <h6 class="text-primary mb-4">Transacción ${transactionNumber}</h6>
                    
                    <div class="mb-3">
                        <label class="form-label">Nombre del Operador:</label>
                        <input type="text" class="form-control" name="operador">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Monto:</label>
                        <input type="number" class="form-control text-end" name="montoTransaccion">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Tasa de Venta:</label>
                        <input type="number" class="form-control text-end" name="tasaVenta">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Tasa Oficina:</label>
                        <input type="number" class="form-control text-end" name="tasaOficina">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Selección de Oficinas:</label>
                        <div>
                            <div class="form-check form-check-inline">
                                <input type="checkbox" class="form-check-input" name="oficinaPZO">
                                <label class="form-check-label">Oficina PZO</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input type="checkbox" class="form-check-input" name="oficinaCCS">
                                <label class="form-check-label">Oficina CCS</label>
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Comisión Bancaria:</label>
                        <select class="form-select" name="comisionBancaria">
                            <option value="100.1000">100.1000%</option>
                            <option value="100.2500">100.2500%</option>
                            <option value="100.3000">100.3000%</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Comisiones Arbitrarias</label>
                        <div class="comisiones-arbitrarias"></div>
                        <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addArbitraryCommission(this)">
                            <i class="bi bi-plus-circle"></i> Agregar Comisión
                        </button>
                    </div>

                    <button type="button" class="btn btn-primary w-100" onclick="processTransaction()">
                        Calcular Transacción
                    </button>
                </div>
            </div>
        `;
    }

    // Agregar manejadores de eventos para los checkboxes
    document.addEventListener('DOMContentLoaded', function() {
        // Manejar clicks en checkboxes de oficinas
        const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="oficina"], input[type="checkbox"][name^="oficina"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                console.log(`${this.id || this.name} changed to: ${this.checked}`);
            });
        });

        // Event delegation para checkboxes futuros
        document.addEventListener('click', function(e) {
            if (e.target.matches('input[type="checkbox"][id^="oficina"], input[type="checkbox"][name^="oficina"]')) {
                console.log(`${e.target.id || e.target.name} clicked: ${e.target.checked}`);
            }
        });
    });

    // Asegurarnos de que el DOM esté cargado
    document.addEventListener('DOMContentLoaded', function() {
        // Variables globales
        let transactions = [];
        let montoRestante = 0;
        let montoTotal = 0;

        // Inicializar el primer formulario
        initializeFirstForm();

        // Función para inicializar el primer formulario
        function initializeFirstForm() {
            const firstForm = document.querySelector('.transaction-form');
            if (firstForm) {
                firstForm.setAttribute('data-transaction-id', '1');
                
                // Inicializar checkboxes del primer formulario
                const checkboxesPZO = firstForm.querySelector('input[name="oficinaPZO"]');
                const checkboxesCCS = firstForm.querySelector('input[name="oficinaCCS"]');
                
                if (checkboxesPZO) {
                    checkboxesPZO.addEventListener('click', function(e) {
                        e.target.checked = !e.target.checked;
                        console.log('PZO checked:', e.target.checked);
                    });
                }
                
                if (checkboxesCCS) {
                    checkboxesCCS.addEventListener('click', function(e) {
                        e.target.checked = !e.target.checked;
                        console.log('CCS checked:', e.target.checked);
                    });
                }

                // Agregar el evento al botón de calcular
                const calcularBtn = firstForm.querySelector('button[onclick="processTransaction()"]');
                if (calcularBtn) {
                    calcularBtn.onclick = null; // Remover el onclick inline
                    calcularBtn.addEventListener('click', processTransaction);
                }
            }
        }

        // Función para procesar la transacción
        window.processTransaction = function(event) {
            try {
                console.log('Iniciando processTransaction');
                
                // Obtener todos los formularios para debugging
                const allForms = document.querySelectorAll('.transaction-form');
                console.log('Formularios encontrados:', allForms.length);
                
                // Obtener el formulario que contiene el botón clickeado
                const currentForm = event.target.closest('.transaction-form');
                console.log('Formulario actual:', currentForm);

                if (!currentForm) {
                    throw new Error('No se encontró el formulario de transacción');
                }

                // Obtener los valores del formulario actual
                const transaction = {
                    operador: currentForm.querySelector('input[name="operador"]')?.value,
                    monto: parseFloat(currentForm.querySelector('input[name="montoTransaccion"]')?.value),
                    tasaVenta: parseFloat(currentForm.querySelector('input[name="tasaVenta"]')?.value),
                    tasaOficina: parseFloat(currentForm.querySelector('input[name="tasaOficina"]')?.value),
                    oficinaPZO: currentForm.querySelector('input[name="oficinaPZO"]')?.checked || false,
                    oficinaCCS: currentForm.querySelector('input[name="oficinaCCS"]')?.checked || false,
                    comisionBancaria: parseFloat(currentForm.querySelector('select[name="comisionBancaria"]')?.value) / 100,
                    comisionCalculada: currentForm.querySelector('input[name="comisionCalculada"]')?.value || 0
                };

                console.log('Datos de la transacción:', transaction);

                // Validaciones básicas
                if (!transaction.operador || !transaction.monto || !transaction.tasaVenta) {
                    throw new Error('Por favor complete todos los campos requeridos');
                }

                console.log('Transacción a procesar:', transaction);

                // Aquí va el resto de la lógica de procesamiento...

            } catch (error) {
                console.error('Error en processTransaction:', error);
                alert(error.message);
            }
        };

        // Función para crear nuevo formulario
        window.createNewTransactionForm = function() {
            const transactionCount = document.querySelectorAll('.transaction-form').length + 1;
            const transactionForm = document.createElement('div');
            transactionForm.className = 'transaction-form card shadow-sm mb-4';
            transactionForm.setAttribute('data-transaction-id', transactionCount);

            // HTML del formulario...
            transactionForm.innerHTML = `
                <div class="card-body">
                    <h6 class="text-primary mb-4">Transacción ${transactionCount}</h6>
                    
                    <div class="mb-3">
                        <label class="form-label">Nombre del Operador:</label>
                        <input type="text" class="form-control" name="operador">
                    </div>

                    <!-- ... resto de los campos ... -->

                    <div class="mb-3">
                        <label class="form-label">Selección de Oficinas:</label>
                        <div>
                            <div class="form-check form-check-inline">
                                <input type="checkbox" class="form-check-input" name="oficinaPZO">
                                <label class="form-check-label">Oficina PZO</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input type="checkbox" class="form-check-input" name="oficinaCCS">
                                <label class="form-check-label">Oficina CCS</label>
                            </div>
                        </div>
                    </div>

                    <button type="button" class="btn btn-primary w-100 calcular-btn">
                        Calcular Transacción
                    </button>
                </div>
            `;

            // Agregar eventos a los checkboxes del nuevo formulario
            const checkboxes = transactionForm.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function(e) {
                    e.target.checked = !e.target.checked;
                    console.log(`${checkbox.name} checked:`, checkbox.checked);
                });
            });

            // Agregar el nuevo formulario al contenedor
            const container = document.querySelector('#transactions') || document.querySelector('.transactions-container');
            if (container) {
                container.appendChild(transactionForm);
            }
        };
    });

    // Hacer la función processTransaction disponible globalmente
    window.processTransaction = processTransaction;

    // Función para inicializar los eventos
    function initializeEvents() {
        console.log('Inicializando eventos...');
        
        const stage2 = document.getElementById('stage2');
        if (!stage2) {
            console.error('No se encontró stage2');
            return;
        }

        // Inicializar checkboxes
        const checkboxes = stage2.querySelectorAll('input.oficina-pzo, input.oficina-ccs');
        checkboxes.forEach(checkbox => {
            if (!checkbox.hasAttribute('type')) {
                checkbox.setAttribute('type', 'checkbox');
            }
            checkbox.addEventListener('click', function(e) {
                this.checked = !this.checked;
                console.log(`${this.className} changed:`, this.checked);
            });
        });

        // Agregar event listener al botón calcular
        const calcularBtn = stage2.querySelector('#calcularTransaccion');
        if (calcularBtn) {
            calcularBtn.addEventListener('click', processTransaction);
            console.log('Event listener agregado al botón calcular');
        }
    }

    // Esperar a que el stage2 esté listo
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (document.getElementById('stage2')) {
                console.log('Stage2 detectado, inicializando eventos...');
                observer.disconnect();
                initializeEvents();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Función para calcular la comisión
    function calcularComision(transaction) {
        try {
            const montoBase = transaction.monto;
            const tasaVenta = transaction.tasaVenta;
            const tasaOficina = transaction.tasaOficina;
            
            // 1. Total de la Venta (en bolívares)
            const totalVenta = montoBase * tasaVenta;
            
            // 2. Comisión
            const comision = transaction.comisionBancaria;
            const montoComision = montoBase * comision;
            
            // 3. Diferencia (en bolívares)
            const diferencia = totalVenta - (montoBase * comision);
            
            // 4. Comisiones Arbitrarias
            const comisionesArbitrarias = obtenerComisionesArbitrarias().map(ca => {
                const montoArbitrario = (diferencia * ca.porcentaje) / (100 * tasaVenta);
                return {
                    ...ca,
                    monto: montoArbitrario
                };
            });
            
            // 5. Monto a Repartir
            const totalComisionesArbitrarias = comisionesArbitrarias.reduce((sum, ca) => sum + ca.monto, 0);
            const montoRepartir = diferencia / tasaVenta - totalComisionesArbitrarias;
            
            // 6. Distribución de Ganancias
            let montoPZO = 0;
            let montoCCS = 0;
            let montoEjecutivo = 0;
            
            if (tasaOficina) {
                const factorPZO = transaction.oficinaPZO ? (transaction.oficinaCCS ? 0.5 : 1) : 0;
                const factorCCS = transaction.oficinaCCS ? (transaction.oficinaPZO ? 0.5 : 1) : 0;
                
                montoPZO = montoRepartir * 0.30 * factorPZO;
                montoCCS = montoRepartir * 0.30 * factorCCS;
                montoEjecutivo = montoRepartir * 0.40;
            }
            
            // 7. Ganancia en Cliente
            const gananciaCliente = tasaOficina ? 
                (montoPZO + montoCCS) : 
                (diferencia / tasaVenta);

            return {
                totalVenta,
                diferencia,
                comisionesArbitrarias,
                montoRepartir,
                montoPZO,
                montoCCS,
                montoEjecutivo,
                gananciaCliente
            };
        } catch (error) {
            console.error('Error en calcularComision:', error);
            throw error;
        }
    }

    // Función para mostrar resultados
    function mostrarResultados() {
        const stage3 = document.getElementById('stage3');
        if (!stage3) return;

        const formatNumber = (num) => new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);

        // Procesar cada transacción
        let resultadosHTML = '';
        transactions.forEach((t, index) => {
            const comision = calcularComision(t);
            
            resultadosHTML += `
                <div class="mb-4">
                    <h6 class="text-primary">Transacción ${index + 1} - Operador: ${t.operador}</h6>
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <tr>
                                <td>Total de la Venta</td>
                                <td class="text-end">Bs. ${formatNumber(t.monto)}</td>
                            </tr>
                            <tr>
                                <td>Diferencia</td>
                                <td class="text-end">Bs. ${formatNumber(montoTotal - t.monto)}</td>
                            </tr>
                            ${obtenerComisionesArbitrarias().map(c => `
                                <tr>
                                    <td>${c.concepto} (${c.porcentaje}%)</td>
                                    <td class="text-end">$ ${formatNumber(c.monto)}</td>
                                </tr>
                            `).join('')}
                            <tr>
                                <td>Monto a Repartir</td>
                                <td class="text-end">$ ${formatNumber(t.monto)}</td>
                            </tr>
                            <tr>
                                <td>Ganancia en Cliente</td>
                                <td class="text-end">$ ${formatNumber(t.monto * (t.tasaVenta/100))}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            `;
        });

        // Mostrar resumen global
        const totales = transactions.reduce((acc, t) => ({
            totalVenta: acc.totalVenta + t.monto,
            gananciaCliente: acc.gananciaCliente + (t.monto * (t.tasaVenta/100)),
            montoVendido: acc.montoVendido + t.monto
        }), {
            totalVenta: 0,
            gananciaCliente: 0,
            montoVendido: 0
        });

        resultadosHTML += `
            <div class="card shadow-sm">
                <div class="card-body">
                    <h5 class="text-primary mb-4">Resumen Global</h5>
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <tr>
                                <td>Total Ganancia en Cliente</td>
                                <td class="text-end">$ ${formatNumber(totales.gananciaCliente)}</td>
                            </tr>
                            <tr>
                                <td>Monto Vendido</td>
                                <td class="text-end">$ ${formatNumber(totales.montoVendido)}</td>
                            </tr>
                            <tr>
                                <td>Monto Restante</td>
                                <td class="text-end">$ ${formatNumber(montoTotal - totales.montoVendido)}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        `;

        stage3.innerHTML = resultadosHTML;
        stage3.classList.add('active');
    }

    // Función auxiliar para obtener comisiones arbitrarias
    function obtenerComisionesArbitrarias() {
        const comisiones = [];
        const arbitraryCommissions = document.querySelectorAll('.arbitrary-commission');
        
        arbitraryCommissions.forEach(commission => {
            const concepto = commission.querySelector('input[type="text"]').value;
            const porcentaje = parseFloat(commission.querySelector('input[type="number"]').value);
            if (concepto && !isNaN(porcentaje)) {
                const monto = montoTotal * (porcentaje / 100);
                comisiones.push({ concepto, porcentaje, monto });
            }
        });
        
        return comisiones;
    }

    // Función para crear nueva transacción
    function crearNuevaTransaccion() {
        const stage2 = document.getElementById('stage2');
        if (!stage2) return;

        // Limpiar campos
        stage2.querySelector('.operador').value = '';
        stage2.querySelector('.monto-transaccion').value = '';
        stage2.querySelector('.tasa-venta').value = '';
        stage2.querySelector('.tasa-oficina').value = '';
        stage2.querySelector('.oficina-pzo').checked = false;
        stage2.querySelector('.oficina-ccs').checked = false;

        // Actualizar número de transacción
        const titulo = stage2.querySelector('.card-title');
        if (titulo) {
            titulo.textContent = `Transacción ${transactions.length + 1}`;
        }
    }
});
