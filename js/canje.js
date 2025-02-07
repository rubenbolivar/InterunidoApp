document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const swapForm = document.getElementById('swapForm');
    const swapType = document.getElementById('swapType');
    const swapAmount = document.getElementById('swapAmount');
    const costCommission = document.getElementById('costCommission');
    const saleCommission = document.getElementById('saleCommission');
    const difference = document.getElementById('difference');
    const externalFields = document.getElementById('externalFields');

    // Campos de distribución
    const payroll = document.getElementById('payroll');
    const profit = document.getElementById('profit');
    const office1 = document.getElementById('office1');
    const office2 = document.getElementById('office2');
    const executive = document.getElementById('executive');

    // Mostrar/ocultar campos según tipo de canje
    swapType?.addEventListener('change', function() {
        externalFields.style.display = this.value === 'externo' ? 'block' : 'none';
    });

    // Calcular diferencia y distribución cuando cambian los valores
    [swapAmount, costCommission, saleCommission].forEach(input => {
        input?.addEventListener('input', calculateAll);
    });

    function calculateAll() {
        calculateDifference();
        if (swapType.value === 'externo') {
            calculateDistribution();
        }
    }

    function calculateDifference() {
        if (swapAmount.value && costCommission.value && saleCommission.value) {
            const amount = parseFloat(swapAmount.value);
            const costComm = parseFloat(costCommission.value) / 100;
            const saleComm = parseFloat(saleCommission.value) / 100;
            
            const diff = amount * (saleComm - costComm);
            difference.value = diff.toFixed(2);
        }
    }

    function calculateDistribution() {
        if (difference.value) {
            const diff = parseFloat(difference.value);
            
            // Distribución según porcentajes establecidos
            const payrollAmount = diff * 0.30; // 30% para nómina
            const profitAmount = diff * 0.30;  // 30% ganancia
            const officeAmount = diff * 0.15;  // 15% para cada oficina
            const executiveAmount = diff * 0.10; // 10% para ejecutivo

            // Actualizar campos
            payroll.value = payrollAmount.toFixed(2);
            profit.value = profitAmount.toFixed(2);
            office1.value = officeAmount.toFixed(2);
            office2.value = officeAmount.toFixed(2);
            executive.value = executiveAmount.toFixed(2);
        }
    }

    // Manejo del formulario
    swapForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        // Aquí irá la lógica para procesar el canje
        // Por ahora solo mostramos un alert
        alert('Canje procesado correctamente');
    });

    // Botón para volver al dashboard
    document.getElementById('backToDashboard')?.addEventListener('click', function() {
        window.location.href = 'dashboard.html';
    });

    // Agregar manejo del botón logout
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        Auth.logout();  // Usar el método estático de la clase Auth
    });
}); 