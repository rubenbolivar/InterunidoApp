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
    
    // Variables globales para los gráficos
    let salesChart = null;
    let operationsChart = null;
    let profitsChart = null;
    let commissionsChart = null;
    let performanceChart = null;
    let operatorsChart = null;

    // Variable para el rango de fechas actual
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
        console.log('Actualizando dashboard con métricas:', metrics);
        
        try {
            // Actualizar cards de estadísticas
            updateStatCards(metrics);
            
            // Verificar y actualizar gráficos
            console.log('Verificando y actualizando gráficos...');
            
            // Gráfico de ventas por período
            if (metrics.charts && metrics.charts.salesByTime) {
                console.log('Actualizando gráfico de ventas por período');
                updateSalesChart(metrics.charts.salesByTime);
            } else {
                console.warn('Datos para gráfico de ventas no disponibles');
            }
            
            // Gráfico de operaciones
            if (metrics.operations && metrics.operations.distribution) {
                console.log('Actualizando gráfico de operaciones');
                updateOperationsChart(metrics.operations.distribution);
            } else {
                console.warn('Datos para gráfico de operaciones no disponibles');
            }
            
            // Gráfico de ganancias
            if (metrics.charts && metrics.charts.profits) {
                console.log('Actualizando gráfico de ganancias con datos:', metrics.charts.profits);
                updateProfitsChart(metrics.charts.profits);
            } else {
                console.warn('Datos para gráfico de ganancias no disponibles, usando datos por defecto');
                // Datos por defecto para gráfico de ganancias
                updateProfitsChart({
                    labels: ['Ventas', 'Canjes'],
                    data: [0, 0],
                    totals: [0, 0]
                });
            }
            
            // Gráfico de comisiones
            if (metrics.charts && metrics.charts.commissions) {
                console.log('Actualizando gráfico de comisiones con datos:', metrics.charts.commissions);
                updateCommissionsChart(metrics.charts.commissions);
            } else {
                console.warn('Datos para gráfico de comisiones no disponibles, usando datos por defecto');
                // Datos por defecto para gráfico de comisiones
                updateCommissionsChart({
                    labels: ['PZO', 'CCS', 'Sin oficina'],
                    data: [0, 0, 0]
                });
            }
            
            // Gráfico de rendimiento
            if (metrics.charts && metrics.charts.performance) {
                console.log('Actualizando gráfico de rendimiento con datos:', metrics.charts.performance);
                updatePerformanceChart(metrics.charts.performance);
            } else {
                console.warn('Datos para gráfico de rendimiento no disponibles, usando datos por defecto');
                // Datos por defecto para gráfico de rendimiento
                updatePerformanceChart({
                    labels: ['Ventas', 'Canjes Internos', 'Canjes Externos'],
                    avgAmount: [0, 0, 0],
                    profitPercentage: [0, 0, 0],
                    commissionPercentage: [0, 0, 0]
                });
            }
            
            console.log('Dashboard actualizado correctamente');
        } catch (error) {
            console.error('Error al actualizar dashboard:', error);
            showErrorMessage('Error al actualizar datos: ' + error.message);
        }
    }
    
    // Función para cargar los datos del dashboard
    async function loadDashboardData(dateRange = currentDateRange, startDate = null, endDate = null) {
        // Obtener métricas
        const metrics = await fetchDashboardData(dateRange, startDate, endDate);
        
        if (!metrics) return;
        
        // Actualizar estadísticas
        updateStatCards(metrics);
        
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
        console.error('ERROR:', message);
        
        // Intentar mostrar un mensaje en la UI si existe el elemento
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
            
            // Ocultar después de 5 segundos
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 5000);
        } else {
            // Crear un elemento para mostrar el error si no existe
            const newErrorContainer = document.createElement('div');
            newErrorContainer.id = 'errorContainer';
            newErrorContainer.style.cssText = 'position: fixed; top: 10px; right: 10px; background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; z-index: 9999;';
            newErrorContainer.textContent = message;
            document.body.appendChild(newErrorContainer);
            
            // Ocultar después de 5 segundos
            setTimeout(() => {
                document.body.removeChild(newErrorContainer);
            }, 5000);
        }
    }
    
    // Función para mostrar/ocultar indicador de carga
    function showLoading(show = true) {
        const loadingIndicators = document.querySelectorAll('.dashboard-loading');
        if (loadingIndicators.length > 0) {
            loadingIndicators.forEach(indicator => {
                if (show) {
                    indicator.classList.remove('d-none');
                } else {
                    indicator.classList.add('d-none');
                }
            });
        } else if (show) {
            console.warn('No se encontraron indicadores de carga');
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
        // Obtener métricas
        const metrics = await fetchDashboardData(dateRange, startDate, endDate);
        
        if (!metrics) return;
        
        // Actualizar estadísticas
        updateStatCards(metrics);
        
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
    
    // Función para inicializar elementos de gráficos
    function initChartElements() {
        console.log('Inicializando elementos de gráficos...');
        
        try {
            // Obtener referencias a los elementos canvas
            salesChartEl = document.getElementById('salesChart');
            operationsChartEl = document.getElementById('operationsChart');
            profitsChartEl = document.getElementById('profitsChart');
            commissionsChartEl = document.getElementById('commissionsChart');
            performanceChartEl = document.getElementById('performanceChart');
            
            console.log('Estado de elementos canvas:');
            console.log('- salesChartEl:', salesChartEl ? 'Encontrado' : 'No encontrado');
            console.log('- operationsChartEl:', operationsChartEl ? 'Encontrado' : 'No encontrado');
            console.log('- profitsChartEl:', profitsChartEl ? 'Encontrado' : 'No encontrado');
            console.log('- commissionsChartEl:', commissionsChartEl ? 'Encontrado' : 'No encontrado');
            console.log('- performanceChartEl:', performanceChartEl ? 'Encontrado' : 'No encontrado');
            
            return true;
        } catch (e) {
            console.error('Error al inicializar elementos de gráficos:', e);
            return false;
        }
    }
    
    // Inicializar el dashboard
    function initDashboard() {
        console.log('Iniciando dashboard...');
        
        try {
            // Inicializar elementos de gráficos
            const elementsInitialized = initChartElements();
            if (!elementsInitialized) {
                console.error('No se pudieron inicializar los elementos de gráficos');
                return;
            }
            
            // Configurar filtros de fecha
            setupDateFilters();
            
            // Cargar datos iniciales
            console.log('Cargando datos iniciales...');
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
            
            console.log('Dashboard inicializado correctamente');
        } catch (e) {
            console.error('Error crítico al inicializar dashboard:', e);
            showErrorMessage('Error al inicializar dashboard: ' + e.message);
        }
    }

    // Añadir un simple gráfico de prueba para verificar que Chart.js funciona
    function createTestChart() {
        console.log('Creando gráfico de prueba...');
        
        try {
            // Verificar si Chart está disponible
            if (typeof Chart === 'undefined') {
                console.error('Error: Chart.js no está disponible');
                return false;
            }
            
            // Verificar si los elementos están disponibles
            if (!salesChartEl) {
                salesChartEl = document.getElementById('salesChart');
                if (!salesChartEl) {
                    console.error('No se encontró el elemento salesChart');
                    return false;
                }
            }
            
            // Datos de prueba
            const testData = {
                labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'],
                datasets: [{
                    label: 'Ventas de Prueba',
                    data: [12, 19, 3, 5, 2],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            };
            
            // Crear gráfico de prueba
            const testChart = new Chart(salesChartEl.getContext('2d'), {
                type: 'bar',
                data: testData,
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            
            console.log('Gráfico de prueba creado correctamente');
            return true;
        } catch (e) {
            console.error('Error al crear gráfico de prueba:', e);
            return false;
        }
    }

    // Inicializar cuando el DOM esté cargado
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM cargado. Verificando Chart.js...');
        
        // Verificar si Chart.js está cargado
        if (typeof Chart === 'undefined') {
            console.error('ERROR: Chart.js no está disponible al cargar la página');
            showErrorMessage('Error: No se pudo cargar la biblioteca de gráficos. Por favor, recarga la página.');
            return;
        }
        
        console.log('Chart.js disponible. Procediendo con inicialización...');
        
        // Inicializar dashboard
        initDashboard();
        
        // Si los gráficos no se cargan correctamente, intentar con un gráfico de prueba
        setTimeout(() => {
            if (!salesChart && !operationsChart) {
                console.warn('No se detectaron gráficos inicializados. Intentando crear gráfico de prueba...');
                createTestChart();
            }
        }, 3000);
    });

    // Asegurarse de que los gráficos se inicialicen cuando la ventana esté completamente cargada
    window.addEventListener('load', function() {
        console.log('Ventana completamente cargada.');
        
        // Si los gráficos no están inicializados, intentar nuevamente
        if (!salesChart && !operationsChart) {
            console.warn('Gráficos no inicializados después de cargar la ventana. Reinicializando...');
            initChartElements();
            loadDashboardData();
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Inicializando dashboard...');
    
    // Verificar si Chart.js está disponible
    if (typeof Chart === 'undefined') {
        console.error('Chart.js no está disponible. Verifique que el script esté cargado correctamente.');
        showErrorMessage('Error: Biblioteca de gráficos no disponible');
        
        // Intentar cargar Chart.js dinámicamente si no está disponible
        const chartScript = document.createElement('script');
        chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        chartScript.onload = () => {
            console.log('Chart.js cargado dinámicamente');
            initDashboard();
        };
        chartScript.onerror = () => {
            console.error('No se pudo cargar Chart.js dinámicamente');
            showErrorMessage('Error: No se pudo cargar la biblioteca de gráficos');
        };
        document.head.appendChild(chartScript);
        return;
    }
    
    initDashboard();
});

// Función para inicializar el dashboard
function initDashboard() {
    console.log('Inicializando dashboard...');
    
    try {
        // Inicializar referencias a los elementos de gráficos
        initChartElements();
        
        // Configurar filtros de fecha
        initDateFilters();
        
        // Escuchar el clic en el botón de exportar reporte
        document.getElementById('exportBtn').addEventListener('click', exportReport);
        
        // Cargar datos iniciales (vista por defecto: hoy)
        loadDashboardData('today');
        
        console.log('Dashboard inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar dashboard:', error);
        showErrorMessage('Error al inicializar dashboard: ' + error.message);
    }
}

// Función para inicializar los elementos de los gráficos
function initChartElements() {
    console.log('Inicializando elementos de gráficos...');
    
    // Elementos de gráficos
    salesChartEl = document.getElementById('salesChart');
    operationsChartEl = document.getElementById('operationsChart');
    profitsChartEl = document.getElementById('profitsChart');
    commissionsChartEl = document.getElementById('commissionsChart');
    performanceChartEl = document.getElementById('performanceChart');
    operatorChartEl = document.getElementById('operatorChart');
    
    // Verificar que todos los elementos existan
    if (!salesChartEl) console.warn('Elemento salesChart no encontrado');
    if (!operationsChartEl) console.warn('Elemento operationsChart no encontrado');
    if (!profitsChartEl) console.warn('Elemento profitsChart no encontrado');
    if (!commissionsChartEl) console.warn('Elemento commissionsChart no encontrado');
    if (!performanceChartEl) console.warn('Elemento performanceChart no encontrado');
    if (!operatorChartEl) console.warn('Elemento operatorChart no encontrado');
    
    // Verificar que al menos un elemento canvas exista
    const canvases = document.querySelectorAll('canvas');
    console.log(`Se encontraron ${canvases.length} elementos canvas`);
    
    if (canvases.length === 0) {
        console.error('No se encontraron elementos canvas en el DOM');
        showErrorMessage('Error: No se encontraron elementos para gráficos');
    }
}

// Función para inicializar los filtros de fecha
function initDateFilters() {
    console.log('Inicializando filtros de fecha...');
    
    // Botones de filtro de fecha (corregido para usar la clase date-filter-btn)
    const dateFilters = document.querySelectorAll('.date-filter-btn');
    if (dateFilters.length === 0) {
        console.warn('No se encontraron botones de filtro de fecha');
    } else {
        console.log(`Se encontraron ${dateFilters.length} botones de filtro de fecha`);
        dateFilters.forEach(btn => {
            btn.addEventListener('click', function() {
                const dateRange = this.dataset.range;
                console.log(`Filtro seleccionado: ${dateRange}`);
                
                // Remover clase activa de todos los botones
                dateFilters.forEach(b => b.classList.remove('active'));
                
                // Agregar clase activa al botón seleccionado
                this.classList.add('active');
                
                // Cargar datos para el rango seleccionado
                loadDashboardData(dateRange);
            });
        });
        
        // Marcar el filtro "Hoy" como seleccionado por defecto
        const todayFilter = document.querySelector('.date-filter-btn[data-range="today"]');
        if (todayFilter) {
            todayFilter.classList.add('active');
        }
    }
    
    // Configurar formulario de fechas personalizadas
    const dateRangeForm = document.getElementById('dateRangeForm');
    if (dateRangeForm) {
        dateRangeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const startDate = document.getElementById('customStartDate').value;
            const endDate = document.getElementById('customEndDate').value;
            
            if (!startDate || !endDate) {
                showErrorMessage('Por favor seleccione fechas de inicio y fin');
                return;
            }
            
            // Remover clase activa de todos los botones
            dateFilters.forEach(b => b.classList.remove('active'));
            
            // Cargar datos para el rango personalizado
            loadDashboardData('custom', startDate, endDate);
        });
    } else {
        console.warn('No se encontró el formulario de fechas personalizadas');
    }
}

// Función para cargar datos del dashboard
async function loadDashboardData(dateRange, startDate = null, endDate = null) {
    console.log(`Cargando datos para rango: ${dateRange}`, startDate, endDate);
    
    showLoading(true);
    try {
        const metrics = await fetchMetrics(dateRange, startDate, endDate);
        if (metrics) {
            updateDashboard(metrics);
            console.log('Datos cargados y dashboard actualizado con éxito');
        } else {
            console.error('No se pudieron obtener métricas');
            showErrorMessage('Error al obtener datos');
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
        showErrorMessage('Error al cargar datos: ' + error.message);
    } finally {
        showLoading(false);
    }
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

// Función para actualizar las tarjetas de estadísticas
function updateStatCards(metrics) {
    try {
        // Actualizar ventas diarias
        const dailySalesElement = document.getElementById('dailySales');
        if (dailySalesElement) {
            dailySalesElement.textContent = formatCurrency(metrics.sales?.current || 0);
        }
        
        // Actualizar porcentaje de cambio
        const percentageChangeEl = document.getElementById('percentageChange');
        if (percentageChangeEl) {
            const percentageChange = metrics.sales?.percentageChange || 0;
            percentageChangeEl.textContent = `${Math.abs(percentageChange).toFixed(1)}% vs período anterior`;
            percentageChangeEl.classList.remove('text-success', 'text-danger');
            percentageChangeEl.classList.add(percentageChange >= 0 ? 'text-success' : 'text-danger');
        }
        
        // Actualizar número de operaciones
        const totalOperationsElement = document.getElementById('totalOperations');
        if (totalOperationsElement) {
            totalOperationsElement.textContent = metrics.operations?.total || 0;
        }
        
        // Actualizar operación promedio
        const averageOperationElement = document.getElementById('averageOperation');
        if (averageOperationElement) {
            averageOperationElement.textContent = formatCurrency(metrics.operations?.average || 0);
        }
        
        // Actualizar tasa promedio
        const averageRateElement = document.getElementById('averageRate');
        if (averageRateElement) {
            averageRateElement.textContent = metrics.operations?.rate?.toFixed(2) || '3.85';
        }
        
        console.log('Estadísticas actualizadas correctamente');
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
    }
}
