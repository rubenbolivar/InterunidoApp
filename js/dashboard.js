document.addEventListener('DOMContentLoaded', function () {
    // Referencias a elementos del DOM
    const dailySalesEl = document.getElementById('dailySales');
    const percentageChangeEl = document.getElementById('percentageChange');
    const totalOperationsEl = document.getElementById('totalOperations');
    const averageOperationEl = document.getElementById('averageOperation');
    const averageRateEl = document.getElementById('averageRate');
    const salesChartEl = document.getElementById('salesChart');
    const operationsChartEl = document.getElementById('operationsChart');
    
    // Referencias a los gráficos
    let salesChart = null;
    let operationsChart = null;
    
    // Variable para almacenar el último rango de fechas seleccionado
    let currentDateRange = 'today';

    // Función para formatear montos monetarios
    function formatCurrency(amount) {
        return '$' + amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    // Obtener el token de autenticación
    function getAuthToken() {
        return localStorage.getItem('auth_token');
    }
    
    // Función para obtener métricas del servidor
    async function fetchMetrics(dateRange = 'today', startDate = null, endDate = null) {
        try {
            // Construir query params
            let queryParams = `?dateRange=${dateRange}`;
            if (dateRange === 'custom' && startDate && endDate) {
                queryParams += `&start=${startDate}&end=${endDate}`;
            }
            
            const response = await fetch(`/api/metrics${queryParams}`, {
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken()
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error obteniendo métricas: ${response.status}`);
            }
            
            const metrics = await response.json();
            return metrics;
        } catch (error) {
            console.error('Error al obtener métricas:', error);
            // Mostrar mensaje de error en el dashboard
            showErrorMessage('No se pudieron cargar los datos. Por favor, inténtelo de nuevo más tarde.');
            return null;
        }
    }
    
    // Función para actualizar los datos en el dashboard
    function updateDashboard(metrics) {
        if (!metrics) return;
        
        // Actualizar las tarjetas de estadísticas
        if (dailySalesEl) {
            dailySalesEl.textContent = formatCurrency(metrics.sales.current);
        }
        
        if (percentageChangeEl) {
            const percentage = metrics.sales.percentageChange;
            percentageChangeEl.textContent = `${percentage > 0 ? '+' : ''}${percentage}% vs periodo anterior`;
            percentageChangeEl.className = percentage >= 0 ? 'card-text text-success' : 'card-text text-danger';
        }
        
        if (totalOperationsEl) {
            totalOperationsEl.textContent = metrics.operations.total;
        }
        
        if (averageOperationEl) {
            averageOperationEl.textContent = formatCurrency(metrics.operations.average);
        }
        
        // Actualizar gráfico de ventas por hora/día
        updateSalesChart(metrics.charts.salesByTime);
        
        // Actualizar gráfico de distribución de operaciones
        updateOperationsChart(metrics.operations.distribution);
    }
    
    // Función para actualizar el gráfico de ventas
    function updateSalesChart(salesData) {
        if (!salesChartEl) return;
        
        const chartData = {
            labels: salesData.data.labels,
            datasets: [{
                label: salesData.isDaily ? 'Ventas por Hora' : 'Ventas por Día',
                data: salesData.data.data,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
        
        // Si el gráfico ya existe, actualizar datos
        if (salesChart) {
            salesChart.data = chartData;
            salesChart.update();
        } else {
            // Crear nuevo gráfico
            salesChart = new Chart(salesChartEl.getContext('2d'), {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return formatCurrency(context.raw);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Función para actualizar el gráfico de operaciones
    function updateOperationsChart(operationsData) {
        if (!operationsChartEl) return;
        
        // Colores para diferentes tipos de operaciones
        const backgroundColors = [
            'rgba(13, 110, 253, 0.8)',   // Azul para ventas
            'rgba(25, 135, 84, 0.8)',    // Verde para canjes internos
            'rgba(255, 193, 7, 0.8)',    // Amarillo para canjes externos
            'rgba(220, 53, 69, 0.8)'     // Rojo para otros tipos
        ];
        
        const chartData = {
            labels: operationsData.labels,
            datasets: [{
                data: operationsData.data,
                backgroundColor: backgroundColors.slice(0, operationsData.labels.length)
            }]
        };
        
        // Si el gráfico ya existe, actualizar datos
        if (operationsChart) {
            operationsChart.data = chartData;
            operationsChart.update();
        } else {
            // Crear nuevo gráfico
            operationsChart = new Chart(operationsChartEl.getContext('2d'), {
                type: 'doughnut',
                data: chartData,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }
    
    // Función para mostrar mensajes de error
    function showErrorMessage(message) {
        const alertEl = document.getElementById('dashboardAlert');
        if (alertEl) {
            alertEl.textContent = message;
            alertEl.classList.remove('d-none');
            setTimeout(() => {
                alertEl.classList.add('d-none');
            }, 5000);
        } else {
            console.error(message);
        }
    }
    
    // Añadir filtros de fecha al HTML
    function setupDateFilters() {
        const filterContainer = document.querySelector('.dashboard-filters');
        if (!filterContainer) return;
        
        // Añadir handlers para los botones de filtro
        document.getElementById('filterToday')?.addEventListener('click', () => loadDashboardData('today'));
        document.getElementById('filterYesterday')?.addEventListener('click', () => loadDashboardData('yesterday'));
        document.getElementById('filterWeek')?.addEventListener('click', () => loadDashboardData('week'));
        document.getElementById('filterMonth')?.addEventListener('click', () => loadDashboardData('month'));
        
        // Handler para fechas personalizadas
        document.getElementById('dateRangeForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            const startDate = document.getElementById('customStartDate')?.value;
            const endDate = document.getElementById('customEndDate')?.value;
            
            if (startDate && endDate) {
                loadDashboardData('custom', startDate, endDate);
            }
        });
    }
    
    // Función principal para cargar datos del dashboard
    async function loadDashboardData(dateRange = 'today', startDate = null, endDate = null) {
        // Actualizar la UI para mostrar que estamos cargando
        document.querySelectorAll('.dashboard-loading').forEach(el => {
            el.classList.remove('d-none');
        });
        
        // Actualizar el rango activo en los botones de filtro
        document.querySelectorAll('.date-filter-btn').forEach(btn => {
            if (btn.getAttribute('data-range') === dateRange) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Guardar el rango actual
        currentDateRange = dateRange;
        
        // Obtener las métricas
        const metrics = await fetchMetrics(dateRange, startDate, endDate);
        
        // Ocultar indicadores de carga
        document.querySelectorAll('.dashboard-loading').forEach(el => {
            el.classList.add('d-none');
        });
        
        // Actualizar el dashboard con los datos obtenidos
        if (metrics) {
            updateDashboard(metrics);
        }
    }
    
    // Variables para los componentes de operadores
    let operatorsChart = null;
    
    // Función para obtener los datos de rendimiento por operador
    async function fetchOperatorsData(dateRange = 'today', startDate = null, endDate = null) {
        try {
            // Construir query params
            let queryParams = `?dateRange=${dateRange}`;
            if (dateRange === 'custom' && startDate && endDate) {
                queryParams += `&start=${startDate}&end=${endDate}`;
            }
            
            const response = await fetch(`/api/metrics/operators${queryParams}`, {
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken()
                }
            });
            
            if (response.status === 403) {
                // Usuario no tiene permisos
                document.getElementById('operatorsPermissionMessage')?.classList.remove('d-none');
                return null;
            }
            
            if (!response.ok) {
                throw new Error(`Error obteniendo datos de operadores: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al obtener datos de operadores:', error);
            return null;
        }
    }
    
    // Función para cargar los datos de operadores
    async function loadOperatorsData(dateRange = currentDateRange, startDate = null, endDate = null) {
        const operatorsSection = document.querySelector('.operators-section');
        if (!operatorsSection) return;
        
        // Mostrar carga
        operatorsSection.querySelectorAll('.dashboard-loading').forEach(el => {
            el.classList.remove('d-none');
        });
        
        // Ocultar mensaje de permisos
        document.getElementById('operatorsPermissionMessage')?.classList.add('d-none');
        
        // Obtener datos
        const data = await fetchOperatorsData(dateRange, startDate, endDate);
        
        // Ocultar carga
        operatorsSection.querySelectorAll('.dashboard-loading').forEach(el => {
            el.classList.add('d-none');
        });
        
        // Actualizar la interfaz con los datos
        if (data && data.operators) {
            updateOperatorsTable(data.operators);
            updateOperatorsChart(data.operators);
        }
    }
    
    // Función para actualizar la tabla de operadores
    function updateOperatorsTable(operators) {
        const tableBody = document.querySelector('#operatorsTable tbody');
        if (!tableBody) return;
        
        // Limpiar tabla
        tableBody.innerHTML = '';
        
        // Si no hay datos
        if (operators.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" class="text-center">No hay datos para mostrar en el período seleccionado</td>';
            tableBody.appendChild(row);
            return;
        }
        
        // Llenar la tabla con los datos
        operators.forEach(op => {
            const row = document.createElement('tr');
            
            // Calcular total de canjes
            const totalCanjes = (op.canjeInternoCount || 0) + (op.canjeExternoCount || 0);
            
            row.innerHTML = `
                <td>${op.operatorName || 'Sin nombre'}</td>
                <td>${op.totalOperations}</td>
                <td>${op.salesCount || 0}</td>
                <td>${totalCanjes}</td>
                <td>${formatCurrency(op.totalAmount)}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Función para actualizar el gráfico de operadores
    function updateOperatorsChart(operators) {
        const chartCanvas = document.getElementById('operatorsChart');
        if (!chartCanvas) return;
        
        // Preparar datos para el gráfico
        const labels = [];
        const salesData = [];
        const canjesInternosData = [];
        const canjesExternosData = [];
        
        // Tomar los top 5 operadores por monto total
        const topOperators = operators.slice(0, 5);
        
        topOperators.forEach(op => {
            labels.push(op.operatorName || 'Sin nombre');
            salesData.push(op.salesCount || 0);
            canjesInternosData.push(op.canjeInternoCount || 0);
            canjesExternosData.push(op.canjeExternoCount || 0);
        });
        
        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Ventas',
                    backgroundColor: 'rgba(13, 110, 253, 0.8)',
                    data: salesData
                },
                {
                    label: 'Canjes Internos',
                    backgroundColor: 'rgba(25, 135, 84, 0.8)',
                    data: canjesInternosData
                },
                {
                    label: 'Canjes Externos',
                    backgroundColor: 'rgba(255, 193, 7, 0.8)',
                    data: canjesExternosData
                }
            ]
        };
        
        // Si el gráfico ya existe, actualizar datos
        if (operatorsChart) {
            operatorsChart.data = chartData;
            operatorsChart.update();
        } else {
            // Crear nuevo gráfico
            operatorsChart = new Chart(chartCanvas.getContext('2d'), {
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        title: {
                            display: true,
                            text: 'Comparativa de Operaciones por Operador'
                        }
                    },
                    scales: {
                        x: {
                            stacked: false
                        },
                        y: {
                            stacked: false,
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }
    
    // Inicializar el dashboard
    function initDashboard() {
        setupDateFilters();
        loadDashboardData();
        
        // Cargar datos de operadores si es administrador
        loadOperatorsData();
        
        // Recargar datos cada 5 minutos
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                loadDashboardData(currentDateRange);
                loadOperatorsData(currentDateRange);
            }
        }, 5 * 60 * 1000);
    }
    
    // Iniciar la carga de datos
    initDashboard();
});
