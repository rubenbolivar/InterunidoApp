// Variables globales para los gráficos
let salesChart = null;
let operationsChart = null;
let profitsChart = null;
let commissionsChart = null;
let performanceChart = null;
let operatorsChart = null;

// Referencias a elementos del DOM
let salesChartEl = null;
let operationsChartEl = null;
let profitsChartEl = null;
let commissionsChartEl = null;
let performanceChartEl = null;
let operatorChartEl = null;

// Variable para el rango de fechas actual
let currentDateRange = 'today';

// Función para formatear montos monetarios
function formatCurrency(amount) {
    return '$' + Number(amount).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Obtener el token de autenticación
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

// Función para mostrar mensajes de error
function showErrorMessage(message, type = 'error', duration = 5000) {
    console.error(message);
    
    // Buscar o crear el contenedor de alertas
    let alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '20px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '9999';
        document.body.appendChild(alertContainer);
    }
    
    // Crear alerta
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertEl.role = 'alert';
    alertEl.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Agregar al contenedor
    alertContainer.appendChild(alertEl);
    
    // Auto eliminar después de la duración especificada
    setTimeout(() => {
        alertEl.classList.remove('show');
        setTimeout(() => alertEl.remove(), 150);
    }, duration);
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

// Función para actualizar el gráfico de ventas
function updateSalesChart(salesData) {
    if (!salesChartEl) return;
    
    try {
        const ctx = salesChartEl.getContext('2d');
        const chartData = {
            labels: salesData.labels || [],
            datasets: [{
                label: 'Ventas por Período',
                data: salesData.data || [],
                borderColor: 'rgba(13, 110, 253, 1)',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };
        
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.raw);
                        }
                    }
                }
            }
        };
        
        // Si el gráfico ya existe, actualizar los datos
        if (salesChart) {
            salesChart.data = chartData;
            salesChart.options = chartOptions;
            salesChart.update();
        } else {
            // Crear nuevo gráfico
            salesChart = new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: chartOptions
            });
        }
    } catch (e) {
        console.error('Error al crear/actualizar gráfico de ventas:', e);
    }
}

// Función para actualizar el gráfico de operaciones
function updateOperationsChart(operationsData) {
    if (!operationsChartEl) return;
    
    try {
        const ctx = operationsChartEl.getContext('2d');
        const chartData = {
            labels: operationsData.labels || ['Ventas', 'Canjes'],
            datasets: [{
                data: operationsData.data || [0, 0],
                backgroundColor: [
                    'rgba(13, 110, 253, 0.8)',
                    'rgba(25, 135, 84, 0.8)'
                ],
                borderColor: [
                    'rgba(13, 110, 253, 1)',
                    'rgba(25, 135, 84, 1)'
                ],
                borderWidth: 1
            }]
        };
        
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        };
        
        // Si el gráfico ya existe, actualizar los datos
        if (operationsChart) {
            operationsChart.data = chartData;
            operationsChart.options = chartOptions;
            operationsChart.update();
        } else {
            // Crear nuevo gráfico
            operationsChart = new Chart(ctx, {
                type: 'doughnut',
                data: chartData,
                options: chartOptions
            });
        }
    } catch (e) {
        console.error('Error al crear/actualizar gráfico de operaciones:', e);
    }
}

// Función para actualizar el gráfico de ganancias
function updateProfitsChart(profitsData) {
    if (!profitsChartEl) return;
    
    try {
        console.log('Actualizando gráfico de ganancias con datos:', profitsData);
        
        const ctx = profitsChartEl.getContext('2d');
        
        // Garantizar que profitsData tenga la estructura correcta
        const labels = profitsData.labels || [];
        const data = profitsData.data || [];
        const totals = profitsData.totals || [];
        
        if (labels.length !== data.length || labels.length !== totals.length) {
            console.warn('Datos para gráfico de ganancias inconsistentes');
        }
        
        // Calcular porcentajes y formatearlos para etiquetas
        const percentages = [];
        const formattedData = [];
        
        for (let i = 0; i < labels.length; i++) {
            // Calcular porcentaje de ganancia
            const total = totals[i] || 0;
            const ganancia = data[i] || 0;
            
            // Evitar división por cero
            let percentage = 0;
            if (total > 0) {
                percentage = (ganancia / total) * 100;
            }
            
            percentages.push(percentage.toFixed(1) + '%');
            formattedData.push({
                total: formatCurrency(total),
                ganancia: formatCurrency(ganancia),
                porcentaje: percentage.toFixed(1) + '%'
            });
        }
        
        const chartData = {
            labels: labels,
            datasets: [{
                label: 'Ganancia (%)',
                data: data,
                backgroundColor: [
                    'rgba(13, 110, 253, 0.8)',
                    'rgba(25, 135, 84, 0.8)'
                ],
                borderColor: [
                    'rgba(13, 110, 253, 1)',
                    'rgba(25, 135, 84, 1)'
                ],
                borderWidth: 1
            }]
        };
        
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const data = formattedData[index];
                            
                            return [
                                `Total: ${data.total}`,
                                `Ganancia: ${data.ganancia}`,
                                `Porcentaje: ${data.porcentaje}`
                            ];
                        }
                    }
                }
            }
        };
        
        // Si el gráfico ya existe, actualizar los datos
        if (profitsChart) {
            profitsChart.data = chartData;
            profitsChart.options = chartOptions;
            profitsChart.update();
        } else {
            // Crear nuevo gráfico
            profitsChart = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: chartOptions
            });
        }
        
        console.log('Gráfico de ganancias creado');
    } catch (e) {
        console.error('Error al crear/actualizar gráfico de ganancias:', e);
    }
}

// Función para actualizar el gráfico de comisiones por oficina
function updateCommissionsChart(commissionsData) {
    if (!commissionsChartEl) return;
    
    try {
        console.log('Actualizando gráfico de comisiones con datos:', commissionsData);
        
        const ctx = commissionsChartEl.getContext('2d');
        const chartData = {
            labels: commissionsData.labels || [],
            datasets: [{
                label: 'Comisiones por Oficina',
                data: commissionsData.data || [],
                backgroundColor: [
                    'rgba(13, 110, 253, 0.8)',
                    'rgba(25, 135, 84, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(220, 53, 69, 0.8)',
                    'rgba(111, 66, 193, 0.8)'
                ],
                borderColor: [
                    'rgba(13, 110, 253, 1)',
                    'rgba(25, 135, 84, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(220, 53, 69, 1)',
                    'rgba(111, 66, 193, 1)'
                ],
                borderWidth: 1
            }]
        };
        
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.raw);
                        }
                    }
                },
                legend: {
                    position: 'right'
                }
            }
        };
        
        // Si el gráfico ya existe, actualizar los datos
        if (commissionsChart) {
            commissionsChart.data = chartData;
            commissionsChart.options = chartOptions;
            commissionsChart.update();
        } else {
            // Crear nuevo gráfico
            commissionsChart = new Chart(ctx, {
                type: 'pie',
                data: chartData,
                options: chartOptions
            });
        }
        
        console.log('Gráfico de comisiones creado');
    } catch (e) {
        console.error('Error al crear/actualizar gráfico de comisiones:', e);
    }
}

// Función para actualizar el gráfico de rendimiento por tipo de operación
function updatePerformanceChart(performanceData) {
    if (!performanceChartEl) return;
    
    try {
        console.log('Actualizando gráfico de rendimiento con datos:', performanceData);
        
        const ctx = performanceChartEl.getContext('2d');
        
        // Garantizar que performanceData tenga la estructura correcta
        const labels = performanceData.labels || [];
        const avgAmount = performanceData.avgAmount || [];
        const profitPercentage = performanceData.profitPercentage || [];
        const commissionPercentage = performanceData.commissionPercentage || [];
        
        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Monto Promedio',
                    data: avgAmount,
                    backgroundColor: 'rgba(13, 110, 253, 0.8)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Margen de Ganancia (%)',
                    data: profitPercentage,
                    backgroundColor: 'rgba(25, 135, 84, 0.8)',
                    borderColor: 'rgba(25, 135, 84, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                },
                {
                    label: 'Comisión (%)',
                    data: commissionPercentage,
                    backgroundColor: 'rgba(255, 193, 7, 0.8)',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }
            ]
        };
        
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Monto Promedio ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Porcentaje (%)'
                    },
                    min: 0,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw;
                            
                            if (label === 'Monto Promedio') {
                                return label + ': ' + formatCurrency(value);
                            } else {
                                return label + ': ' + value + '%';
                            }
                        }
                    }
                }
            }
        };
        
        // Si el gráfico ya existe, actualizar los datos
        if (performanceChart) {
            performanceChart.data = chartData;
            performanceChart.options = chartOptions;
            performanceChart.update();
        } else {
            // Crear nuevo gráfico
            performanceChart = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: chartOptions
            });
        }
        
        console.log('Gráfico de rendimiento creado');
    } catch (e) {
        console.error('Error al crear/actualizar gráfico de rendimiento:', e);
    }
}

// Función para mostrar/ocultar indicador de carga
function showLoading(show = true) {
    const loader = document.getElementById('dashboardLoader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
    
    // También podemos ocultar/mostrar el contenido principal
    const content = document.getElementById('dashboardContent');
    if (content) {
        content.style.opacity = show ? '0.5' : '1';
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

// Función para actualizar las tarjetas de estadísticas
function updateStatCards(stats) {
    console.log('Actualizando tarjetas de estadísticas:', stats);
    
    if (!stats) {
        console.warn('No hay datos de estadísticas para mostrar');
        return;
    }
    
    try {
        // Actualizar ventas diarias
        const dailySalesEl = document.getElementById('dailySales');
        if (dailySalesEl) {
            dailySalesEl.textContent = formatCurrency(stats.sales?.current || 0);
        }
        
        // Actualizar cambio porcentual
        const percentageChangeEl = document.getElementById('percentageChange');
        if (percentageChangeEl) {
            const changeVal = stats.sales?.percentageChange || 0;
            percentageChangeEl.textContent = (changeVal > 0 ? '+' : '') + changeVal + '%';
            percentageChangeEl.className = changeVal >= 0 ? 'text-success' : 'text-danger';
        }
        
        // Actualizar total de operaciones
        const totalOperationsEl = document.getElementById('totalOperations');
        if (totalOperationsEl) {
            totalOperationsEl.textContent = stats.operations?.total || 0;
        }
        
        // Actualizar operación promedio
        const averageOperationEl = document.getElementById('averageOperation');
        if (averageOperationEl) {
            averageOperationEl.textContent = formatCurrency(stats.operations?.average || 0);
        }
        
        // Actualizar tasa promedio
        const averageRateEl = document.getElementById('averageRate');
        if (averageRateEl) {
            averageRateEl.textContent = stats.exchangeRate?.average?.toFixed(2) || '0.00';
        }
        
        console.log('Tarjetas de estadísticas actualizadas correctamente');
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
        throw error;
    }
}

// Función para cargar datos del dashboard
async function loadDashboardData(dateRange = currentDateRange, startDate = null, endDate = null) {
    console.log(`Cargando datos para rango: ${dateRange}`, startDate, endDate);
    
    // Mostrar indicadores de carga
    const loaders = document.querySelectorAll('.dashboard-loading');
    loaders.forEach(loader => loader.classList.remove('d-none'));
    
    try {
        // Obtener datos del servidor
        const metrics = await fetchDashboardData(dateRange, startDate, endDate);
        if (metrics) {
            // Actualizar el dashboard con los nuevos datos
            updateDashboard(metrics);
            console.log('Datos cargados y dashboard actualizado con éxito');
            
            // Actualizar variable global con el filtro actual
            currentDateRange = dateRange;
        } else {
            console.error('No se pudieron obtener métricas');
            showErrorMessage('Error al obtener datos del servidor');
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
        showErrorMessage('Error al cargar datos: ' + error.message);
    } finally {
        // Ocultar indicadores de carga
        loaders.forEach(loader => loader.classList.add('d-none'));
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

// Función para crear un gráfico de prueba (fallback)
function createTestChart() {
    console.log('Intentando crear gráfico de prueba...');
    try {
        // Verificar si algún elemento canvas está disponible
        const canvases = document.querySelectorAll('canvas');
        if (canvases.length === 0) {
            console.error('No se encontraron elementos canvas');
            return;
        }
        
        // Usar el primer canvas disponible
        const canvas = canvases[0];
        console.log(`Usando canvas: ${canvas.id || 'sin id'} para gráfico de prueba`);
        
        // Crear gráfico de prueba
        new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Prueba'],
                datasets: [{
                    label: 'Gráfico de prueba',
                    data: [100],
                    backgroundColor: '#007bff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
        
        console.log('Gráfico de prueba creado correctamente');
    } catch (error) {
        console.error('Error al crear gráfico de prueba:', error);
    }
}

// Función para inicializar el dashboard
function initDashboard() {
    console.log('Inicializando dashboard...');
    
    try {
        // Inicializar referencias a los elementos de gráficos
        initChartElements();
        
        // Configurar filtros de fecha
        initDateFilters();
        
        // Escuchar el clic en el botón de exportar reporte (si existe)
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                console.log('Exportando reporte...');
                showErrorMessage('Exportación de reportes en desarrollo', 'info');
            });
        }
        
        // Cargar datos iniciales (vista por defecto: hoy)
        loadDashboardData('today');
        
        console.log('Dashboard inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar dashboard:', error);
        showErrorMessage('Error al inicializar dashboard: ' + error.message);
    }
}

// Verificar si Chart.js está disponible al cargar la página
document.addEventListener('DOMContentLoaded', function() {
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

// Asegurarse de que los gráficos se inicialicen cuando la ventana esté completamente cargada
window.addEventListener('load', () => {
    console.log('Ventana completamente cargada.');
    
    // Si los gráficos no están inicializados, intentar nuevamente
    if (!salesChart && !operationsChart) {
        console.warn('Gráficos no inicializados después de cargar la ventana. Reinicializando...');
        try {
            initChartElements();
            loadDashboardData(currentDateRange);
        } catch (error) {
            console.error('Error al reinicializar gráficos:', error);
            showErrorMessage('Error al cargar gráficos. Por favor, recargue la página.');
        }
    }
});

// Manejar errores de red
window.addEventListener('offline', () => {
    showErrorMessage('Se ha perdido la conexión a Internet');
});

window.addEventListener('online', () => {
    showErrorMessage('Conexión a Internet restablecida', 'success');
    // Recargar datos automáticamente
    loadDashboardData(currentDateRange);
});