document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const operationForm = document.getElementById('operationForm');
    const amountToSell = document.getElementById('amountToSell');
    const clientRate = document.getElementById('clientRate');
    const amountClientReceives = document.getElementById('amountClientReceives');
    const stage1 = document.getElementById('stage1');
    const stage2 = document.getElementById('stage2');
    const stage3 = document.getElementById('stage3');
    const addTransactionBtn = document.getElementById('addTransaction');
    const transactionsContainer = document.getElementById('transactions');
    const resultsContainer = document.getElementById('results');

    // Evento para calcular monto que recibe el cliente
    [amountToSell, clientRate].forEach(input => {
        input?.addEventListener('input', calculateClientAmount);
    });

    function calculateClientAmount() {
        if (amountToSell.value && clientRate.value) {
            const amount = parseFloat(amountToSell.value);
            const rate = parseFloat(clientRate.value);
            const result = amount * rate;
            amountClientReceives.value = result.toFixed(2);
        }
    }

    // Manejo del formulario principal
    operationForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        stage1.style.display = 'none';
        stage2.style.display = 'block';
    });

    // Agregar transacción
    let transactionCount = 0;
    addTransactionBtn?.addEventListener('click', function() {
        transactionCount++;
        addTransactionForm();
    });

    function addTransactionForm() {
        const transactionDiv = document.createElement('div');
        transactionDiv.className = 'transaction-form';
        transactionDiv.innerHTML = `
            <h3>Transacción ${transactionCount}</h3>
            <div class="form-group">
                <label for="transactionAmount${transactionCount}">Monto:</label>
                <input type="number" id="transactionAmount${transactionCount}" required>
            </div>
            <div class="form-group">
                <label for="transactionType${transactionCount}">Tipo:</label>
                <select id="transactionType${transactionCount}" required>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                </select>
            </div>
            <button type="button" class="btn btn-secondary remove-transaction">Eliminar</button>
        `;

        transactionsContainer?.appendChild(transactionDiv);

        // Evento para eliminar transacción
        transactionDiv.querySelector('.remove-transaction').addEventListener('click', function() {
            transactionDiv.remove();
            updateTransactions();
        });
    }

    function updateTransactions() {
        // Actualizar numeración de transacciones
        const transactions = document.querySelectorAll('.transaction-form');
        transactions.forEach((transaction, index) => {
            transaction.querySelector('h3').textContent = `Transacción ${index + 1}`;
        });
        transactionCount = transactions.length;
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