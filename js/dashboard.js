document.addEventListener('DOMContentLoaded', function() {
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

    // Configuración de los gráficos
    const salesChart = new Chart(document.getElementById('salesChart'), {
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
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    const operationsChart = new Chart(document.getElementById('operationsChart'), {
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

    // Actualizar estadísticas
    function updateStats() {
        // Aquí se conectará con la API para obtener datos reales
        const stats = {
            dailySales: 25430,
            percentageChange: 15,
            totalOperations: 42,
            averageOperation: 605
        };

        // Actualizar cards
        document.getElementById('dailySales').textContent = `$${stats.dailySales.toLocaleString()}`;
        document.getElementById('percentageChange').textContent = `${stats.percentageChange}% vs ayer`;
        document.getElementById('totalOperations').textContent = stats.totalOperations;
        document.getElementById('averageOperation').textContent = `$${stats.averageOperation.toLocaleString()}`;
    }

    // Inicializar estadísticas
    updateStats();

    // Configuración de colores para los gráficos
    const chartColors = {
        blue: 'rgba(54, 162, 235, 0.2)',
        blueBorder: 'rgba(54, 162, 235, 1)',
        green: 'rgba(75, 192, 192, 0.2)',
        greenBorder: 'rgba(75, 192, 192, 1)'
    };

    // Datos de ejemplo (después los reemplazaremos con datos reales de la BD)
    const monthlyData = {
        labels: ['Enero', 'Febrero', 'Marzo'],
        operations: [12, 19, 3],
        volume: [65, 59, 80]
    };

    // Gráfico de Volumen de Transacciones
    const volumeChart = new Chart(
        document.getElementById('volumeChart').getContext('2d'),
        {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Volumen',
                    data: monthlyData.volume,
                    fill: false,
                    borderColor: chartColors.greenBorder,
                    backgroundColor: chartColors.green,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Volumen de Transacciones'
                    }
                }
            }
        }
    );

    // Función para actualizar los datos de los gráficos
    function updateCharts(newData) {
        operationsChart.data.labels = newData.labels;
        operationsChart.data.datasets[0].data = newData.operations;
        operationsChart.update();

        volumeChart.data.labels = newData.labels;
        volumeChart.data.datasets[0].data = newData.volume;
        volumeChart.update();
    }

    // Manejador para el botón de cerrar sesión
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        // Aquí implementaremos la lógica de cierre de sesión
        localStorage.removeItem('auth_token');
        window.location.href = 'index.html';
    });
});