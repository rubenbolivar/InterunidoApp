document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const operationForm = document.getElementById('operationForm');
    const stage1 = document.getElementById('stage1');
    const stage2 = document.getElementById('stage2');
    const stage3 = document.getElementById('stage3');

    // Variables globales
    let operationData = {
        cliente: '',
        tipo: '',
        monto: 0,
        comisionCosto: 0,
        comisionVenta: 0,
        diferencia: 0,
        distribucion: {
            nomina: 0,
            ganancia: 0,
            oficinaPZO: 0,
            oficinaCCS: 0,
            ejecutivo: 0
        }
    };

    // Event Listeners
    operationForm.addEventListener('submit', handleStage1Submit);
    document.getElementById('swapType').addEventListener('change', handleSwapTypeChange);
    
    // Calcular automáticamente cuando cambien los valores
    ['swapAmount', 'costCommission', 'saleCommission'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', calculateResults);
    });

    // Funciones principales
    function handleStage1Submit(e) {
        e.preventDefault();
        
        // Capturar datos del formulario
        operationData.cliente = document.getElementById('clientName').value;
        operationData.tipo = document.getElementById('swapType').value;
        operationData.monto = parseFloat(document.getElementById('swapAmount').value);
        operationData.comisionCosto = parseFloat(document.getElementById('costCommission').value);
        operationData.comisionVenta = parseFloat(document.getElementById('saleCommission').value);

        if (validateStage1()) {
            // Calcular resultados
            calculateResults();
            
            // Activar Stage 2
            stage2.classList.add('active');
            
            // Deshabilitar campos del Stage 1
            Array.from(operationForm.elements).forEach(element => {
                element.disabled = true;
            });

            // Actualizar resumen (Stage 3)
            updateSummary();
        }
    }

    function calculateResults() {
        const monto = parseFloat(document.getElementById('swapAmount').value) || 0;
        const comisionCosto = parseFloat(document.getElementById('costCommission').value) / 100;
        const comisionVenta = parseFloat(document.getElementById('saleCommission').value) / 100;
        const tipo = document.getElementById('swapType').value;

        // Calcular diferencia
        const diferencia = monto * (comisionVenta - comisionCosto);
        document.getElementById('difference').value = diferencia.toFixed(2);
        operationData.diferencia = diferencia;

        // Si es externo, calcular distribución
        if (tipo === 'externo') {
            const distribucion = calculateDistribution(diferencia);
            updateDistributionFields(distribucion);
            operationData.distribucion = distribucion;
        }
    }

    function calculateDistribution(diferencia) {
        return {
            nomina: diferencia * 0.40,      // 40%
            ganancia: diferencia * 0.20,    // 20%
            oficinaPZO: diferencia * 0.15,  // 15%
            oficinaCCS: diferencia * 0.15,  // 15%
            ejecutivo: diferencia * 0.10    // 10%
        };
    }

    function updateDistributionFields(distribucion) {
        document.getElementById('payroll').value = distribucion.nomina.toFixed(2);
        document.getElementById('profit').value = distribucion.ganancia.toFixed(2);
        document.getElementById('office1').value = distribucion.oficinaPZO.toFixed(2);
        document.getElementById('office2').value = distribucion.oficinaCCS.toFixed(2);
        document.getElementById('executive').value = distribucion.ejecutivo.toFixed(2);
    }

    function updateSummary() {
        const summaryHTML = `
            <div class="summary-content">
                <div class="summary-item">
                    <span>Cliente:</span>
                    <span>${operationData.cliente}</span>
                </div>
                <div class="summary-item">
                    <span>Tipo de Canje:</span>
                    <span>${operationData.tipo.charAt(0).toUpperCase() + operationData.tipo.slice(1)}</span>
                </div>
                <div class="summary-item">
                    <span>Monto:</span>
                    <span>${formatCurrency(operationData.monto)}</span>
                </div>
                <div class="summary-item">
                    <span>Diferencia:</span>
                    <span>${formatCurrency(operationData.diferencia)}</span>
                </div>
                ${operationData.tipo === 'externo' ? generateDistributionSummary() : ''}
            </div>
        `;

        document.getElementById('operationSummary').innerHTML = summaryHTML;
        stage3.classList.add('active');
    }

    function generateDistributionSummary() {
        return `
            <div class="distribution-summary mt-3">
                <h6>Distribución</h6>
                <div class="summary-item">
                    <span>Nómina (40%):</span>
                    <span>${formatCurrency(operationData.distribucion.nomina)}</span>
                </div>
                <div class="summary-item">
                    <span>Ganancia (20%):</span>
                    <span>${formatCurrency(operationData.distribucion.ganancia)}</span>
                </div>
                <div class="summary-item">
                    <span>Oficina PZO (15%):</span>
                    <span>${formatCurrency(operationData.distribucion.oficinaPZO)}</span>
                </div>
                <div class="summary-item">
                    <span>Oficina CCS (15%):</span>
                    <span>${formatCurrency(operationData.distribucion.oficinaCCS)}</span>
                </div>
                <div class="summary-item">
                    <span>Ejecutivo (10%):</span>
                    <span>${formatCurrency(operationData.distribucion.ejecutivo)}</span>
                </div>
            </div>
        `;
    }

    // Funciones auxiliares
    function handleSwapTypeChange() {
        const tipo = document.getElementById('swapType').value;
        document.getElementById('externalFields').style.display = 
            tipo === 'externo' ? 'block' : 'none';
        calculateResults();
    }

    function validateStage1() {
        const requiredFields = ['clientName', 'swapType', 'swapAmount', 'costCommission', 'saleCommission'];
        
        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                alert(`Por favor complete el campo ${field.labels[0].textContent}`);
                field.focus();
                return false;
            }
        }

        if (operationData.monto <= 0) {
            alert('El monto debe ser mayor a 0');
            return false;
        }

        return true;
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-VE', {
            style: 'currency',
            currency: 'VES'
        }).format(amount);
    }

    // Botón para volver al dashboard
    document.getElementById('backToDashboard')?.addEventListener('click', function() {
        window.location.href = 'dashboard.html';
    });

    // Agregar manejo del botón logout
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        Auth.logout();  // Usar el método estático de la clase Auth
    });
}); 