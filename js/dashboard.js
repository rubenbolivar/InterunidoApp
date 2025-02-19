document.addEventListener('DOMContentLoaded', function () {
    // Datos de ejemplo - Luego se reemplazarán con datos reales
    const salesData = {
        labels: ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
        datasets: [{
            label: 'Ventas por Hora',
            data: [4500, 3200, 6800, 2400, 5600, 7800, 4200, 3900],
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const operationsData = {
        labels: ['Ventas', 'Canjes Internos', 'Canjes Externos'],
        datasets: [{
            data: [45, 30, 25],
            backgroundColor: [
                'rgba(13, 110, 253, 0.8)',
                'rgba(25, 135, 84, 0.8)',
                'rgba(255, 193, 7, 0.8)'
            ]
        }]
    };

    // Configuración de los gráficos con verificación de existencia del <canvas>
    const salesCanvas = document.getElementById('salesChart');
    if (salesCanvas) {
        new Chart(salesCanvas.getContext('2d'), {
            type: 'line',
            data: salesData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    } else {
        console.warn('No se encontró el elemento <canvas> con ID "salesChart".');
    }

    const operationsCanvas = document.getElementById('operationsChart');
    if (operationsCanvas) {
        new Chart(operationsCanvas.getContext('2d'), {
            type: 'doughnut',
            data: operationsData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } else {
        console.warn('No se encontró el elemento <canvas> con ID "operationsChart".');
    }

    // Actualizar estadísticas solo si existen los elementos
    function updateStats() {
        const stats = {
            dailySales: 25430,
            percentageChange: 15,
            totalOperations: 42,
            averageOperation: 605
        };

        if (document.getElementById('dailySales')) {
            document.getElementById('dailySales').textContent = `$${stats.dailySales.toLocaleString()}`;
        }
        if (document.getElementById('percentageChange')) {
            document.getElementById('percentageChange').textContent = `${stats.percentageChange}% vs ayer`;
        }
        if (document.getElementById('totalOperations')) {
            document.getElementById('totalOperations').textContent = stats.totalOperations;
        }
        if (document.getElementById('averageOperation')) {
            document.getElementById('averageOperation').textContent = `$${stats.averageOperation.toLocaleString()}`;
        }
    }

    updateStats();

    // Manejador para el botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('auth_token');
            window.location.href = 'index.html';
        });
    }
});
