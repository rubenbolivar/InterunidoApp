document.addEventListener('DOMContentLoaded', function () {
    // Referencias a elementos del DOM
    const dailySalesEl = document.getElementById('dailySales');
    const percentageChangeEl = document.getElementById('percentageChange');
    const totalOperationsEl = document.getElementById('totalOperations');
    const averageOperationEl = document.getElementById('averageOperation');
    const averageRateEl = document.getElementById('averageRate');
    const salesChartEl = document.getElementById('salesChart');
    const operationsChartEl = document.getElementById('operationsChart');
    const profitsChartEl = document.getElementById('profitsChart');
    const commissionsChartEl = document.getElementById('commissionsChart');
    const performanceChartEl = document.getElementById('performanceChart');
    
    // Referencias a los gráficos
    let salesChart = null;
    let operationsChart = null;
    let profitsChart = null;
    let commissionsChart = null;
    let performanceChart = null;
    
    // Variable para almacenar el último rango de fechas seleccionado
    let currentDateRange = 'today';

    // Función para formatear montos monetarios
    function formatCurrency(amount, includeSymbol = true) {
        const formattedAmount = amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        return includeSymbol ? '$' + formattedAmount : formattedAmount;
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
    
    // Función para obtener métricas del dashboard
    async function fetchDashboardData(dateRange = 'today', startDate = null, endDate = null) {
        try {
            // Construir query params
            let queryParams = `?dateRange=${dateRange}`;
            if (dateRange === 'custom' && startDate && endDate) {
                queryParams += `&start=${startDate}&end=${endDate}`;
            }
            
            // Mostrar loading en los gráficos
            document.querySelectorAll('.dashboard-loading').forEach(el => {
                el.classList.remove('d-none');
            });
            
            const response = await fetch(`/api/metrics${queryParams}`, {
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken()
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error obteniendo métricas: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Log para depuración
            console.log('Datos recibidos del API:', data);
            console.log('Ganancias:', data.charts?.profits);
            console.log('Comisiones:', data.charts?.commissions);
            console.log('Rendimiento:', data.charts?.performance);
            
            return data;
        } catch (error) {
            console.error('Error al obtener métricas:', error);
            showErrorMessage('Error al cargar los datos del dashboard: ' + error.message);
            return null;
        } finally {
            // Ocultar loading en todos los casos
            document.querySelectorAll('.dashboard-loading').forEach(el => {
                el.classList.add('d-none');
            });
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
        
        // Actualizar gráfico de ganancias
        updateProfitsChart(metrics.charts.profits);
        
        // Actualizar gráfico de comisiones
        updateCommissionsChart(metrics.charts.commissions);
        
        // Actualizar gráfico de rendimiento
        updatePerformanceChart(metrics.charts.performance);
    }
    
    // Función para cargar los datos del dashboard
    async function loadDashboardData(dateRange = currentDateRange, startDate = null, endDate = null) {
        // Obtener métricas
        const metrics = await fetchDashboardData(dateRange, startDate, endDate);
        
        if (!metrics) return;
        
        // Actualizar estadísticas
        updateDashboardStats(metrics);
        
        // Actualizar gráfico de ventas
        try {
            updateSalesChart(metrics.charts.salesByTime);
        } catch (e) {
            console.error('Error al actualizar gráfico de ventas:', e);
        }
        
        // Actualizar gráfico de distribución de operaciones
        try {
            updateOperationsChart(metrics.operations.distribution);
        } catch (e) {
            console.error('Error al actualizar gráfico de operaciones:', e);
        }
        
        // Actualizar gráfico de ganancias
        try {
            if (metrics.charts?.profits) {
                updateProfitsChart(metrics.charts.profits);
            } else {
                console.warn('No se encontraron datos de ganancias');
            }
        } catch (e) {
            console.error('Error al actualizar gráfico de ganancias:', e);
        }
        
        // Actualizar gráfico de comisiones
        try {
            if (metrics.charts?.commissions) {
                updateCommissionsChart(metrics.charts.commissions);
            } else {
                console.warn('No se encontraron datos de comisiones');
            }
        } catch (e) {
            console.error('Error al actualizar gráfico de comisiones:', e);
        }
        
        // Actualizar gráfico de rendimiento
        try {
            if (metrics.charts?.performance) {
                updatePerformanceChart(metrics.charts.performance);
            } else {
                console.warn('No se encontraron datos de rendimiento');
            }
        } catch (e) {
            console.error('Error al actualizar gráfico de rendimiento:', e);
        }
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
    
    // Función para actualizar el gráfico de ganancias
    function updateProfitsChart(profitsData) {
        if (!profitsChartEl) {
            console.warn('Elemento del gráfico de ganancias no encontrado');
            return;
        }
        
        console.log('Actualizando gráfico de ganancias con datos:', profitsData);
        
        // Validar datos
        if (!profitsData || !profitsData.labels || !profitsData.data || !profitsData.totals) {
            console.error('Datos de ganancias inválidos:', profitsData);
            return;
        }
        
        if (profitsData.labels.length === 0) {
            console.warn('No hay etiquetas para el gráfico de ganancias');
            profitsData.labels = ['Ventas', 'Canjes'];
            profitsData.data = [0, 0];
            profitsData.totals = [0, 0];
        }
        
        // Preparar conjuntos de datos para monto total y ganancia
        const chartData = {
            labels: profitsData.labels,
            datasets: [
                {
                    label: 'Monto Total',
                    backgroundColor: 'rgba(13, 110, 253, 0.2)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 1,
                    data: profitsData.totals,
                    type: 'bar',
                    order: 1
                },
                {
                    label: 'Ganancia',
                    backgroundColor: 'rgba(25, 135, 84, 0.2)',
                    borderColor: 'rgba(25, 135, 84, 1)',
                    borderWidth: 2,
                    data: profitsData.data,
                    type: 'bar',
                    order: 0
                }
            ]
        };
        
        try {
            if (profitsChart) {
                profitsChart.data = chartData;
                profitsChart.update();
            } else {
                profitsChart = new Chart(profitsChartEl.getContext('2d'), {
                    type: 'bar',
                    data: chartData,
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Ganancias por Tipo de Operación'
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return context.dataset.label + ': ' + formatCurrency(context.raw);
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return formatCurrency(value, false);
                                    }
                                }
                            }
                        }
                    }
                });
                console.log('Gráfico de ganancias creado');
            }
        } catch (e) {
            console.error('Error al crear/actualizar gráfico de ganancias:', e);
        }
    }
    
    // Función para actualizar el gráfico de comisiones por oficina
    function updateCommissionsChart(commissionsData) {
        if (!commissionsChartEl) {
            console.warn('Elemento del gráfico de comisiones no encontrado');
            return;
        }
        
        console.log('Actualizando gráfico de comisiones con datos:', commissionsData);
        
        // Validar datos
        if (!commissionsData || !commissionsData.labels || !commissionsData.data) {
            console.error('Datos de comisiones inválidos:', commissionsData);
            return;
        }
        
        if (commissionsData.labels.length === 0) {
            console.warn('No hay etiquetas para el gráfico de comisiones');
            commissionsData.labels = ['PZO', 'CCS', 'Sin oficina'];
            commissionsData.data = [0, 0, 0];
        }
        
        // Asignar colores por oficina
        const backgroundColors = [];
        const borderColors = [];
        
        commissionsData.labels.forEach(label => {
            if (label === 'PZO') {
                backgroundColors.push('rgba(255, 99, 132, 0.7)');
                borderColors.push('rgba(255, 99, 132, 1)');
            } else if (label === 'CCS') {
                backgroundColors.push('rgba(54, 162, 235, 0.7)');
                borderColors.push('rgba(54, 162, 235, 1)');
            } else {
                backgroundColors.push('rgba(255, 206, 86, 0.7)');
                borderColors.push('rgba(255, 206, 86, 1)');
            }
        });
        
        const chartData = {
            labels: commissionsData.labels,
            datasets: [{
                label: 'Comisión Acumulada',
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
                data: commissionsData.data
            }]
        };
        
        try {
            if (commissionsChart) {
                commissionsChart.data = chartData;
                commissionsChart.update();
            } else {
                commissionsChart = new Chart(commissionsChartEl.getContext('2d'), {
                    type: 'bar',
                    data: chartData,
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: 'Comisión Acumulada por Oficina'
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return 'Comisión: ' + formatCurrency(context.raw);
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return formatCurrency(value, false);
                                    }
                                }
                            }
                        }
                    }
                });
                console.log('Gráfico de comisiones creado');
            }
        } catch (e) {
            console.error('Error al crear/actualizar gráfico de comisiones:', e);
        }
    }
    
    // Función para actualizar el gráfico de rendimiento por tipo de operación
    function updatePerformanceChart(performanceData) {
        if (!performanceChartEl) {
            console.warn('Elemento del gráfico de rendimiento no encontrado');
            return;
        }
        
        console.log('Actualizando gráfico de rendimiento con datos:', performanceData);
        
        // Validar datos
        if (!performanceData || !performanceData.labels || !performanceData.avgAmount || 
            !performanceData.profitPercentage || !performanceData.commissionPercentage) {
            console.error('Datos de rendimiento inválidos:', performanceData);
            return;
        }
        
        if (performanceData.labels.length === 0) {
            console.warn('No hay etiquetas para el gráfico de rendimiento');
            performanceData.labels = ['Ventas', 'Canjes Internos', 'Canjes Externos'];
            performanceData.avgAmount = [0, 0, 0];
            performanceData.profitPercentage = [0, 0, 0];
            performanceData.commissionPercentage = [0, 0, 0];
        }
        
        const chartData = {
            labels: performanceData.labels,
            datasets: [
                {
                    label: 'Monto Promedio',
                    backgroundColor: 'rgba(13, 110, 253, 0.7)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 1,
                    data: performanceData.avgAmount,
                    yAxisID: 'y',
                    order: 1
                },
                {
                    label: 'Margen de Ganancia (%)',
                    backgroundColor: 'rgba(25, 135, 84, 0.7)',
                    borderColor: 'rgba(25, 135, 84, 1)',
                    borderWidth: 1,
                    data: performanceData.profitPercentage,
                    yAxisID: 'y1',
                    type: 'line',
                    order: 0
                },
                {
                    label: 'Comisión (%)',
                    backgroundColor: 'rgba(255, 193, 7, 0.7)',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    borderWidth: 1,
                    data: performanceData.commissionPercentage,
                    yAxisID: 'y1',
                    type: 'line',
                    order: 0
                }
            ]
        };
        
        try {
            if (performanceChart) {
                performanceChart.data = chartData;
                performanceChart.update();
            } else {
                performanceChart = new Chart(performanceChartEl.getContext('2d'), {
                    type: 'bar',
                    data: chartData,
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Rendimiento por Tipo de Operación'
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.dataset.label;
                                        const value = context.raw;
                                        
                                        if (label === 'Monto Promedio') {
                                            return label + ': ' + formatCurrency(value);
                                        } else {
                                            return label + ': ' + value.toFixed(2) + '%';
                                        }
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Monto Promedio'
                                },
                                ticks: {
                                    callback: function(value) {
                                        return formatCurrency(value, false);
                                    }
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                beginAtZero: true,
                                max: 100,
                                title: {
                                    display: true,
                                    text: 'Porcentaje (%)'
                                },
                                ticks: {
                                    callback: function(value) {
                                        return value + '%';
                                    }
                                },
                                grid: {
                                    drawOnChartArea: false
                                }
                            }
                        }
                    }
                });
                console.log('Gráfico de rendimiento creado');
            }
        } catch (e) {
            console.error('Error al crear/actualizar gráfico de rendimiento:', e);
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
    async function loadDashboardData(dateRange = currentDateRange, startDate = null, endDate = null) {
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
        const metrics = await fetchDashboardData(dateRange, startDate, endDate);
        
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
        
        // Cargar datos iniciales
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
    document.addEventListener('DOMContentLoaded', function() {
        initDashboard();
    });
});
