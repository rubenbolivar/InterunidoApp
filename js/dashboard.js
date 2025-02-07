document.addEventListener('DOMContentLoaded', function() {
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

    // Gráfico de Operaciones por Mes
    const operationsChart = new Chart(
        document.getElementById('operationsChart').getContext('2d'),
        {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Operaciones',
                    data: monthlyData.operations,
                    backgroundColor: chartColors.blue,
                    borderColor: chartColors.blueBorder,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Operaciones Mensuales'
                    }
                }
            }
        }
    );

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

    // Función para actualizar las estadísticas
    function updateStats(stats) {
        // Esta función se implementará cuando tengamos la conexión con la BD
        // Actualizará los números y tendencias en las tarjetas de estadísticas
    }
});