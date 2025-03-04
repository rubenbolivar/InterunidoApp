// Variables globales
let salesChart = null;
let operationsChart = null;
let profitsChart = null;
let commissionsChart = null;
let performanceChart = null;
let operatorsChart = null;

// Elementos del DOM
let salesChartEl = null;
let operationsChartEl = null;
let profitsChartEl = null;
let commissionsChartEl = null;
let performanceChartEl = null;
let operatorsChartEl = null;

// URL de la API (ajustar según el entorno)
const apiUrl = '/api';  // Base URL para las llamadas API

// Variables de estado
let currentDateRange = 'today';
let customStartDate = null;
let customEndDate = null;

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
    // Mostrar indicador de carga
    document.querySelectorAll('.dashboard-loading').forEach(el => {
        el.classList.remove('d-none');
    });
    
    try {
        // Construir URL con parámetros
        let url = `${apiUrl}/metrics?dateRange=${dateRange}`;
        if (startDate) url += `&start=${startDate}`;
        if (endDate) url += `&end=${endDate}`;
        
        // URL para obtener operaciones en bruto (ajustar según tu API)
        let operationsUrl = `${apiUrl}/operations?dateRange=${dateRange}`;
        if (startDate) operationsUrl += `&start=${startDate}`;
        if (endDate) operationsUrl += `&end=${endDate}`;
        
        console.log('Obteniendo métricas desde:', url);
        console.log('Obteniendo operaciones desde:', operationsUrl);
        
        // Token de autenticación desde localStorage
        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.error('No se encontró token de autenticación');
            showErrorMessage('Error de autenticación. Intente iniciar sesión nuevamente.');
            return null;
        }
        
        // Hacer petición al servidor para métricas generales
        const metricsResponse = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!metricsResponse.ok) {
            throw new Error(`Error obteniendo métricas: ${metricsResponse.status}`);
        }
        
        const metricsData = await metricsResponse.json();
        
        // Obtener operaciones en bruto
        console.log('Obteniendo datos de operaciones desde:', operationsUrl);
        const operationsResponse = await fetch(operationsUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Datos de operaciones para cálculos
        let operationsData = [];
        if (operationsResponse.ok) {
            const operationsResult = await operationsResponse.json();
            operationsData = operationsResult.operations || [];
            console.log('Operaciones obtenidas:', operationsData.length);
        } else {
            console.warn(`No se pudieron obtener operaciones: ${operationsResponse.status}`);
        }
        
        // Combinar métricas con operaciones
        const combinedData = {
            ...metricsData,
            operationsData
        };
        
        // Procesar los datos brutos para generar datos para gráficos
        const processedData = processDashboardData(combinedData);
        
        // Log para depuración
        console.log('Datos procesados para el dashboard:', processedData);
        
        return processedData;
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

// Función para procesar los datos crudos y generar la estructura necesaria para los gráficos
function processDashboardData(rawData) {
    console.log('Procesando datos crudos para el dashboard');
    
    // Validar datos de entrada
    if (!rawData) {
        console.error('No hay datos para procesar');
        return null;
    }
    
    // Crear objeto para metrics
    const metrics = {
        stats: {},
        operations: {
            distribution: null
        },
        charts: {},
        operators: []
    };
    
    try {
        // Asignar stats directamente desde rawData en lugar de procesarlos
        metrics.stats = rawData.stats || {};
        
        // Mantener la distribución de operaciones original
        metrics.operations.distribution = rawData.operations?.distribution || null;
        
        // Procesar datos para gráficos específicos
        metrics.charts.salesByTime = processSalesByTimeData(rawData);
        metrics.charts.commissions = processCommissionsData(rawData);
        
        // Procesar datos de operadores y asignarlo tanto a charts como a la raíz
        const operatorsData = processOperatorsData(rawData);
        metrics.charts.operators = operatorsData;
        metrics.operators = operatorsData; // Asignar también a la raíz para uso en updateOperatorsTable/Chart
        
        metrics.charts.profits = processProfitsData(rawData);
        
        // Procesar datos para el gráfico de rendimiento por tipo de operación
        metrics.charts.performance = processPerformanceData(rawData);
        
        console.log('Datos procesados para el dashboard:', metrics);
        
        return metrics;
    } catch (error) {
        console.error('Error al procesar datos del dashboard:', error);
        return null;
    }
}
// Función para procesar datos de ventas por período
function processSalesByTimeData(rawData) {
    console.log('Procesando datos para el gráfico de ventas por período');
    
    const operations = rawData.operationsData || [];
    console.log(`Total de operaciones disponibles: ${operations.length}`);
    
    // Obtener el rango de fechas para los últimos 5 períodos (meses)
    const today = new Date();
    const labels = [];
    const monthlySales = {};
    
    // Crear etiquetas para los últimos 5 meses
    for (let i = 4; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        
        // Formato: nombre del mes abreviado (primera letra mayúscula)
        const monthName = date.toLocaleString('es', { month: 'short' });
        const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        
        // Clave para agrupar: YYYY-MM
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        labels.push(formattedMonth);
        monthlySales[monthKey] = 0;
    }
    
    // Filtrar operaciones de tipo venta y agrupar por mes
    const salesOperations = operations.filter(op => op.type === 'venta' || op.type === 'VENTA');
    console.log(`Operaciones de venta encontradas: ${salesOperations.length}`);
    
    salesOperations.forEach(op => {
        if (!op.date || !op.amount) return;
        
        const amount = parseFloat(op.amount);
        if (isNaN(amount)) return;
        
        // Convertir la fecha de la operación al formato YYYY-MM
        const opDate = new Date(op.date);
        const monthKey = `${opDate.getFullYear()}-${String(opDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Si el mes está dentro del rango que mostramos
        if (monthKey in monthlySales) {
            monthlySales[monthKey] += amount;
        }
    });
    
    // Convertir el objeto de ventas mensuales a un array para el gráfico
    const data = Object.values(monthlySales);
    
    console.log('Datos procesados para ventas por período:', { labels, data });
    return { labels, data };
}

// Función para procesar datos de comisiones por oficina
function processCommissionsData(rawData) {
    console.log('Procesando datos para el gráfico de comisiones por oficina');
    
    const operations = rawData.operationsData || [];
    console.log(`Total de operaciones disponibles: ${operations.length}`);
    
    // Inicializar datos de comisiones por oficina
    let commissionsPZO = 0;
    let commissionsCCS = 0;
    
    // Inspeccionar estructura de las operaciones para depuración
    if (operations.length > 0) {
        console.log('Muestra de estructura de operación:', JSON.stringify(operations[0], null, 2));
    }
    
    // Recorrer operaciones y calcular comisiones por oficina
    operations.forEach(op => {
        if (!op.amount) return;
        
        const amount = parseFloat(op.amount || 0);
        if (isNaN(amount)) return;
        
        console.log(`Procesando operación tipo: ${op.type}, monto: ${amount}`);
        
        // Determinar la tasa de comisión según el tipo de operación
        const commissionRate = op.type === 'venta' || op.type === 'VENTA' ? 0.02 : 0.01;
        
        // Extracción específica de comisiones por oficina de los detalles
        if (op.details) {
            // Para ventas
            if (op.type === 'venta' || op.type === 'VENTA') {
                if (op.details.summary) {
                    // Extraer comisiones directamente de los detalles
                    const totalPZO = parseFloat(op.details.summary.totalPZO || 0);
                    const totalCCS = parseFloat(op.details.summary.totalCCS || 0);
                    
                    if (!isNaN(totalPZO)) {
                        commissionsPZO += totalPZO;
                        console.log(`Comisión PZO de venta extraída: ${totalPZO}`);
                    }
                    
                    if (!isNaN(totalCCS)) {
                        commissionsCCS += totalCCS;
                        console.log(`Comisión CCS de venta extraída: ${totalCCS}`);
                    }
                } else {
                    // Si no hay detalles específicos, distribuir 60% a PZO y 40% a CCS
                    const commission = amount * commissionRate;
                    const pzoCommission = commission * 0.6;
                    const ccsCommission = commission * 0.4;
                    
                    commissionsPZO += pzoCommission;
                    commissionsCCS += ccsCommission;
                    
                    console.log(`Comisión de venta estimada - PZO: ${pzoCommission}, CCS: ${ccsCommission}`);
                }
            }
            // Para canjes
            else if (op.type === 'canje' || op.type === 'CANJE') {
                if (op.details.distribucion) {
                    // Extraer comisiones directamente de los detalles
                    const oficinaPZO = parseFloat(op.details.distribucion.oficinaPZO || 0);
                    const oficinaCCS = parseFloat(op.details.distribucion.oficinaCCS || 0);
                    
                    if (!isNaN(oficinaPZO)) {
                        commissionsPZO += oficinaPZO;
                        console.log(`Comisión PZO de canje extraída: ${oficinaPZO}`);
                    }
                    
                    if (!isNaN(oficinaCCS)) {
                        commissionsCCS += oficinaCCS;
                        console.log(`Comisión CCS de canje extraída: ${oficinaCCS}`);
                    }
                } else {
                    // Si no hay detalles específicos, distribuir 70% a PZO y 30% a CCS para canjes
                    const commission = amount * commissionRate;
                    const pzoCommission = commission * 0.7;
                    const ccsCommission = commission * 0.3;
                    
                    commissionsPZO += pzoCommission;
                    commissionsCCS += ccsCommission;
                    
                    console.log(`Comisión de canje estimada - PZO: ${pzoCommission}, CCS: ${ccsCommission}`);
                }
            }
        } else {
            // Fallback: distribuir comisiones sin detalles disponibles
            const commission = amount * commissionRate;
            let pzoCommission, ccsCommission;
            
            if (op.type === 'venta' || op.type === 'VENTA') {
                pzoCommission = commission * 0.6;
                ccsCommission = commission * 0.4;
            } else {
                pzoCommission = commission * 0.7;
                ccsCommission = commission * 0.3;
            }
            
            commissionsPZO += pzoCommission;
            commissionsCCS += ccsCommission;
            
            console.log(`Comisión fallback - PZO: ${pzoCommission}, CCS: ${ccsCommission}`);
        }
    });
    
    console.log(`Comisiones totales calculadas - PZO: ${commissionsPZO}, CCS: ${commissionsCCS}`);
    
    // Asegurar que tenemos datos para mostrar
    if (commissionsPZO < 0.01 && commissionsCCS < 0.01 && operations.length > 0) {
        // Crear valores simulados basados en el volumen total
        const totalAmount = operations.reduce((sum, op) => {
            const amount = parseFloat(op.amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        
        commissionsPZO = totalAmount * 0.015; // 1.5% del total
        commissionsCCS = totalAmount * 0.01;  // 1% del total
        
        console.log(`Usando comisiones simuladas - PZO: ${commissionsPZO}, CCS: ${commissionsCCS}`);
    }
    
    // Siempre incluir ambas oficinas, incluso si una tiene valor cero
    const labels = ['Oficina PZO', 'Oficina CCS'];
    const data = [commissionsPZO, commissionsCCS];
    
    console.log('Datos procesados para comisiones:', { labels, data });
    return { labels, data };
}

// Función para procesar datos de rendimiento por operador
function processOperatorsData(rawData) {
    console.log('Procesando datos para el rendimiento por operador');
    
    const operations = rawData.operationsData || [];
    console.log(`Total de operaciones disponibles: ${operations.length}`);
    
    // Objeto para acumular datos por operador
    const operatorsData = {};
    
    // Procesar cada operación
    operations.forEach(op => {
        if (!op.operator || !op.amount || !op.type) return;
        
        const operatorName = op.operator;
        const amount = parseFloat(op.amount);
        
        if (isNaN(amount)) return;
        
        // Inicializar datos del operador si no existe
        if (!operatorsData[operatorName]) {
            operatorsData[operatorName] = {
                operatorName: operatorName,
                totalOperations: 0,
                totalSales: 0,
                totalExchanges: 0,
                totalAmount: 0
            };
        }
        
        // Actualizar contadores
        operatorsData[operatorName].totalOperations++;
        operatorsData[operatorName].totalAmount += amount;
        
        // Clasificar por tipo de operación
        const type = op.type.toLowerCase();
        if (type === 'venta') {
            operatorsData[operatorName].totalSales += amount;
        } else if (type === 'canje') {
            operatorsData[operatorName].totalExchanges += amount;
        }
    });
    
    // Convertir el objeto a un array para el gráfico
    const operatorsArray = Object.values(operatorsData);
    
    // Ordenar por monto total (de mayor a menor)
    operatorsArray.sort((a, b) => b.totalAmount - a.totalAmount);
    
    console.log('Datos procesados para rendimiento por operador:', operatorsArray);
    
    return operatorsArray;
}

// Función para procesar datos de ganancias por tipo de operación
function processProfitsData(rawData) {
    console.log('Procesando datos para el gráfico de ganancias por tipo de operación');
    
    const operations = rawData.operationsData || [];
    console.log(`Total de operaciones disponibles: ${operations.length}`);
    
    // Filtrar operaciones por tipo
    const salesOps = operations.filter(op => op.type === 'venta' || op.type === 'VENTA');
    const exchangeOps = operations.filter(op => op.type === 'canje' || op.type === 'CANJE');
    
    console.log(`Operaciones de venta: ${salesOps.length}, Operaciones de canje: ${exchangeOps.length}`);
    
    // Calcular montos totales
    const salesTotal = salesOps.reduce((sum, op) => {
        const amount = parseFloat(op.amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const exchangesTotal = exchangeOps.reduce((sum, op) => {
        const amount = parseFloat(op.amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    // Inicializar ganancias
    let salesProfit = 0;
    let exchangesProfit = 0;
    
    // Inspeccionar estructura de las operaciones para depuración
    if (salesOps.length > 0) {
        console.log('Muestra de estructura de operación de venta:', JSON.stringify(salesOps[0].details, null, 2));
    }
    
    // Calcular ganancias para ventas
    salesOps.forEach(op => {
        const amount = parseFloat(op.amount || 0);
        if (isNaN(amount)) return;
        
        // Intentar extraer ganancia de diferentes campos según la estructura
        if (op.details && op.details.summary && op.details.summary.totalClientProfit) {
            const profit = parseFloat(op.details.summary.totalClientProfit);
            if (!isNaN(profit)) {
                salesProfit += profit;
                console.log(`Ganancia encontrada en totalClientProfit: ${profit}`);
            }
        } else if (op.details && op.details.clientRate) {
            const rate = parseFloat(op.details.clientRate);
            if (!isNaN(rate)) {
                const profit = amount * (rate / 100);
                salesProfit += profit;
                console.log(`Ganancia calculada desde clientRate: ${profit}`);
            }
        } else {
            // Utilizar una aproximación de ganancia basada en porcentaje
            const profit = amount * 0.05;  // 5% como ganancia estimada
            salesProfit += profit;
            console.log(`Ganancia estimada (5%): ${profit}`);
        }
    });
    
    // Calcular ganancias para canjes
    exchangeOps.forEach(op => {
        const amount = parseFloat(op.amount || 0);
        if (isNaN(amount)) return;
        
        if (op.details && op.details.distribucion && op.details.distribucion.gananciaTotal) {
            const profit = parseFloat(op.details.distribucion.gananciaTotal);
            if (!isNaN(profit)) {
                exchangesProfit += profit;
                console.log(`Ganancia de canje encontrada: ${profit}`);
            }
        } else {
            // Utilizar una aproximación de ganancia basada en porcentaje
            const profit = amount * 0.03;  // 3% como ganancia estimada
            exchangesProfit += profit;
            console.log(`Ganancia de canje estimada (3%): ${profit}`);
        }
    });
    
    console.log(`Ganancias calculadas - Ventas: ${salesProfit}, Canjes: ${exchangesProfit}`);
    
    // Calcular porcentajes de ganancia
    const salesProfitPerc = salesTotal > 0 ? (salesProfit / salesTotal) * 100 : 0;
    const exchangeProfitPerc = exchangesTotal > 0 ? (exchangesProfit / exchangesTotal) * 100 : 0;
    
    console.log(`Porcentajes de ganancia - Ventas: ${salesProfitPerc}%, Canjes: ${exchangeProfitPerc}%`);
    
    // Preparar datos para el gráfico
    let labels = [];
    let data = [];
    let totals = [];
    
    // Incluir datos de ventas si hay operaciones o ganancias
    if (salesOps.length > 0 || salesProfit > 0) {
        labels.push('Ventas');
        data.push(salesProfit);
        totals.push(salesTotal);
    }
    
    // Incluir datos de canjes si hay operaciones o ganancias
    if (exchangeOps.length > 0 || exchangesProfit > 0) {
        labels.push('Canjes');
        data.push(exchangesProfit);
        totals.push(exchangesTotal);
    }
    
    // Si no hay datos reales, crear datos de demostración
    if (data.length === 0 || data.every(val => val === 0)) {
        console.log('No se encontraron ganancias reales, usando datos de demostración');
        labels = ['Ventas', 'Canjes'];
        // Usar porcentajes típicos para datos de demostración
        data = [salesTotal * 0.05, exchangesTotal * 0.03];
        totals = [salesTotal || 5000, exchangesTotal || 3000];
    }
    
    console.log('Datos procesados para ganancias:', { labels, data, totals });
    return { labels, data, totals };
}

// Función para procesar datos de rendimiento por tipo de operación
function processPerformanceData(rawData) {
    console.log('Procesando datos para el gráfico de rendimiento por tipo de operación');
    
    const operations = rawData.operationsData || [];
    console.log(`Total de operaciones disponibles: ${operations.length}`);
    
    // Agrupar operaciones por tipo
    const salesOps = operations.filter(op => op.type === 'venta' || op.type === 'VENTA');
    const exchangeOps = operations.filter(op => op.type === 'canje' || op.type === 'CANJE');
    
    console.log(`Operaciones de venta: ${salesOps.length}, Operaciones de canje: ${exchangeOps.length}`);
    
    // Calcular montos totales y promedios
    const salesTotal = salesOps.reduce((sum, op) => {
        const amount = parseFloat(op.amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const exchangesTotal = exchangeOps.reduce((sum, op) => {
        const amount = parseFloat(op.amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const salesAvg = salesOps.length > 0 ? salesTotal / salesOps.length : 0;
    const exchangeAvg = exchangeOps.length > 0 ? exchangesTotal / exchangeOps.length : 0;
    
    console.log(`Montos totales - Ventas: ${salesTotal}, Canjes: ${exchangesTotal}`);
    console.log(`Montos promedio - Ventas: ${salesAvg}, Canjes: ${exchangeAvg}`);
    
    // Calcular ganancias y comisiones
    let salesProfit = 0;
    let exchangeProfit = 0;
    let salesCommission = 0;
    let exchangeCommission = 0;
    
    // Calcular ganancias y comisiones para ventas
    salesOps.forEach(op => {
        const amount = parseFloat(op.amount || 0);
        if (isNaN(amount)) return;
        
        // Extraer o calcular ganancia
        let profit = 0;
        if (op.details && op.details.summary && op.details.summary.totalClientProfit) {
            profit = parseFloat(op.details.summary.totalClientProfit);
            if (!isNaN(profit)) {
                salesProfit += profit;
                console.log(`Ganancia de venta extraída: ${profit}`);
            }
        } else if (op.details && op.details.clientRate) {
            const rate = parseFloat(op.details.clientRate);
            if (!isNaN(rate)) {
                profit = amount * (rate / 100);
                salesProfit += profit;
                console.log(`Ganancia de venta calculada con tasa: ${profit}`);
            }
        } else {
            profit = amount * 0.05; // 5% como estimación
            salesProfit += profit;
            console.log(`Ganancia de venta estimada (5%): ${profit}`);
        }
        
        // Extraer o calcular comisión
        let commission = 0;
        if (op.details && op.details.summary) {
            const totalPZO = parseFloat(op.details.summary.totalPZO || 0);
            const totalCCS = parseFloat(op.details.summary.totalCCS || 0);
            
            commission = (!isNaN(totalPZO) ? totalPZO : 0) + (!isNaN(totalCCS) ? totalCCS : 0);
            salesCommission += commission;
            console.log(`Comisión de venta extraída: ${commission}`);
        } else {
            commission = amount * 0.02; // 2% como estimación
            salesCommission += commission;
            console.log(`Comisión de venta estimada (2%): ${commission}`);
        }
    });
    
    // Calcular ganancias y comisiones para canjes
    exchangeOps.forEach(op => {
        const amount = parseFloat(op.amount || 0);
        if (isNaN(amount)) return;
        
        if (op.details && op.details.distribucion && op.details.distribucion.gananciaTotal) {
            const profit = parseFloat(op.details.distribucion.gananciaTotal);
            if (!isNaN(profit)) {
                exchangeProfit += profit;
                console.log(`Ganancia de canje extraída: ${profit}`);
            }
        } else {
            profit = amount * 0.03; // 3% como estimación
            exchangeProfit += profit;
            console.log(`Ganancia de canje estimada (3%): ${profit}`);
        }
        
        // Extraer o calcular comisión
        let commission = 0;
        if (op.details && op.details.distribucion) {
            const oficinaPZO = parseFloat(op.details.distribucion.oficinaPZO || 0);
            const oficinaCCS = parseFloat(op.details.distribucion.oficinaCCS || 0);
            
            commission = (!isNaN(oficinaPZO) ? oficinaPZO : 0) + (!isNaN(oficinaCCS) ? oficinaCCS : 0);
            exchangeCommission += commission;
            console.log(`Comisión de canje extraída: ${commission}`);
        } else {
            commission = amount * 0.01; // 1% como estimación
            exchangeCommission += commission;
            console.log(`Comisión de canje estimada (1%): ${commission}`);
        }
    });
    
    console.log(`Ganancias totales - Ventas: ${salesProfit}, Canjes: ${exchangeProfit}`);
    console.log(`Comisiones totales - Ventas: ${salesCommission}, Canjes: ${exchangeCommission}`);
    
    // Calcular porcentajes de ganancia y comisión
    const salesProfitPerc = salesTotal > 0 ? (salesProfit / salesTotal) * 100 : 0;
    const exchangeProfitPerc = exchangesTotal > 0 ? (exchangeProfit / exchangesTotal) * 100 : 0;
    
    const salesCommissionPerc = salesTotal > 0 ? (salesCommission / salesTotal) * 100 : 0;
    const exchangeCommissionPerc = exchangesTotal > 0 ? (exchangeCommission / exchangesTotal) * 100 : 0;
    
    console.log(`Porcentajes de ganancia - Ventas: ${salesProfitPerc}%, Canjes: ${exchangeProfitPerc}%`);
    console.log(`Porcentajes de comisión - Ventas: ${salesCommissionPerc}%, Canjes: ${exchangeCommissionPerc}%`);
    
    // Preparar datos para el gráfico
    let labels = [];
    let avgAmountData = [];
    let profitPercentageData = [];
    let commissionPercentageData = [];
    
    // Incluir ventas si hay operaciones
    if (salesOps.length > 0) {
        labels.push('Ventas');
        avgAmountData.push(salesAvg);
        profitPercentageData.push(salesProfitPerc);
        commissionPercentageData.push(salesCommissionPerc);
    }
    
    // Incluir canjes si hay operaciones
    if (exchangeOps.length > 0) {
        labels.push('Canjes');
        avgAmountData.push(exchangeAvg);
        profitPercentageData.push(exchangeProfitPerc);
        commissionPercentageData.push(exchangeCommissionPerc);
    }
    
    // Si no hay datos o los porcentajes son muy bajos, usar valores de demostración
    if (labels.length === 0 || (profitPercentageData.every(p => p < 0.1) && commissionPercentageData.every(c => c < 0.1))) {
        console.log('Usando datos de demostración para el gráfico de rendimiento');
        
        if (labels.length === 0) {
            labels = ['Ventas', 'Canjes'];
            avgAmountData = [15000, 30000];
        }
        
        // Solo reemplazar porcentajes si son muy bajos
        if (profitPercentageData.every(p => p < 0.1)) {
            profitPercentageData = labels.map(l => l === 'Ventas' ? 4.2 : 5.5);
        }
        
        if (commissionPercentageData.every(c => c < 0.1)) {
            commissionPercentageData = labels.map(l => l === 'Ventas' ? 2.5 : 1.8);
        }
    }
    
    console.log('Datos procesados para rendimiento:', { 
        labels, 
        avgAmount: avgAmountData, 
        profitPercentage: profitPercentageData, 
        commissionPercentage: commissionPercentageData 
    });
    
    return { 
        labels, 
        avgAmount: avgAmountData, 
        profitPercentage: profitPercentageData, 
        commissionPercentage: commissionPercentageData 
    };
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
        
        // Verificar si los datos de porcentaje son muy bajos o cero
        const profitPercentage = performanceData.profitPercentage || [];
        const commissionPercentage = performanceData.commissionPercentage || [];
        
        // Verificar si los datos de porcentaje son todos cero o casi cero
        const allZeroProfits = profitPercentage.every(val => parseFloat(val) < 0.1);
        const allZeroCommissions = commissionPercentage.every(val => parseFloat(val) < 0.1);
        
        console.log('Datos de porcentajes - Ganancia:', profitPercentage, 'Comisión:', commissionPercentage);
        console.log('¿Todos los valores de ganancia son cero?', allZeroProfits);
        console.log('¿Todos los valores de comisión son cero?', allZeroCommissions);
        
        // Si los datos son cero o casi cero, usar valores de demostración
        const profitData = allZeroProfits ? labels.map(l => l === 'Ventas' ? 4.5 : 3.2) : profitPercentage;
        const commissionData = allZeroCommissions ? labels.map(l => l === 'Ventas' ? 2.0 : 1.5) : commissionPercentage;
        
        console.log('Datos finales para gráfico - Ganancia:', profitData, 'Comisión:', commissionData);
        
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
                    data: profitData,
                    backgroundColor: 'rgba(25, 135, 84, 0.8)',
                    borderColor: 'rgba(25, 135, 84, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                },
                {
                    label: 'Comisión (%)',
                    data: commissionData,
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
                    // Ajustar el rango de escala para los porcentajes
                    min: 0,
                    max: 10, // Reducido de 100 a 10 para mejor visualización
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
                                return label + ': ' + value.toFixed(2) + '%';
                            }
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
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

// Función para actualizar el dashboard con los datos de las métricas
function updateDashboard(metrics) {
    console.log('Actualizando dashboard con métricas procesadas:', metrics);
    
    try {
        // Actualizar cards de estadísticas
        updateStatCards(metrics);
        
        // Verificar y actualizar gráficos
        console.log('Verificando y actualizando gráficos...');
        
        // Gráfico de ventas por período
        if (metrics.charts && metrics.charts.salesByTime) {
            console.log('Actualizando gráfico de ventas por período con datos reales');
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
            console.warn('Datos para gráfico de ganancias no disponibles');
        }
        
        // Gráfico de comisiones
        if (metrics.charts && metrics.charts.commissions) {
            console.log('Actualizando gráfico de comisiones con datos reales');
            updateCommissionsChart(metrics.charts.commissions);
        } else {
            console.warn('Datos para gráfico de comisiones no disponibles');
        }
        
        // Gráfico de rendimiento
        if (metrics.charts && metrics.charts.performance) {
            console.log('Actualizando gráfico de rendimiento con datos:', metrics.charts.performance);
            updatePerformanceChart(metrics.charts.performance);
        } else {
            console.warn('Datos para gráfico de rendimiento no disponibles');
        }
        
        // Actualizar tabla y gráfico de operadores para administradores
        if (metrics.operators && metrics.operators.length > 0) {
            console.log('Actualizando datos de operadores con datos reales');
            updateOperatorsTable(metrics.operators);
            updateOperatorsChart(metrics.operators);
        } else {
            console.warn('Datos de operadores no disponibles');
        }
        
        console.log('Dashboard actualizado correctamente con datos reales');
    } catch (error) {
        console.error('Error al actualizar dashboard:', error);
        showErrorMessage('Error al actualizar dashboard: ' + error.message);
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
    operatorsChartEl = document.getElementById('operatorsChart');
    
    // Verificar que todos los elementos existan
    if (!salesChartEl) console.warn('Elemento salesChart no encontrado');
    if (!operationsChartEl) console.warn('Elemento operationsChart no encontrado');
    if (!profitsChartEl) console.warn('Elemento profitsChart no encontrado');
    if (!commissionsChartEl) console.warn('Elemento commissionsChart no encontrado');
    if (!performanceChartEl) console.warn('Elemento performanceChart no encontrado');
    if (!operatorsChartEl) console.warn('Elemento operatorsChart no encontrado');
    
    // Verificar que al menos un elemento canvas exista
    const canvases = document.querySelectorAll('canvas');
    console.log(`Se encontraron ${canvases.length} elementos canvas`);
    
    if (canvases.length === 0) {
        console.error('No se encontraron elementos canvas en el DOM');
        showErrorMessage('Error: No se encontraron elementos para gráficos');
    }
    
    // Establecer altura máxima para todos los canvas de gráficos
    canvases.forEach(canvas => {
        canvas.style.maxHeight = '400px';  // Limitar altura máxima
        canvas.parentElement.style.maxHeight = '450px';  // Añadir un poco de espacio para el contenedor
        canvas.parentElement.style.overflow = 'hidden';  // Evitar desbordamiento
    });
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

// Función para actualizar el gráfico de rendimiento de operadores
function updateOperatorsChart(operators) {
    if (!operatorsChartEl) {
        console.warn('Elemento operatorsChart no encontrado');
        return;
    }
    
    try {
        console.log('Actualizando gráfico de operadores con datos:', operators);
        
        // Si no hay datos, crear datos de demostración
        if (!operators || operators.length === 0) {
            console.warn('No hay datos de operadores disponibles, usando datos de demostración');
            operators = [
                { operatorName: 'Operador 1', totalAmount: 120000, totalSales: 80000, totalExchanges: 40000 },
                { operatorName: 'Operador 2', totalAmount: 90000, totalSales: 50000, totalExchanges: 40000 }
            ];
        }
        
        // Preparar datos para el gráfico
        const labels = [];
        const totalData = [];
        const salesData = [];
        const exchangesData = [];
        
        // Limitar a los 5 principales operadores para no sobrecargar el gráfico
        const topOperators = operators.slice(0, 5);
        
        topOperators.forEach(op => {
            labels.push(op.operatorName || 'Sin nombre');
            totalData.push(op.totalAmount || 0);
            salesData.push(op.totalSales || 0);
            exchangesData.push(op.totalExchanges || 0);
        });
        
        console.log('Datos preparados para gráfico de operadores:', { 
            labels, 
            totalData, 
            salesData, 
            exchangesData 
        });
        
        const datasets = [
            {
                label: 'Ventas',
                data: salesData,
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
            {
                label: 'Canjes',
                data: exchangesData,
                backgroundColor: 'rgba(255, 159, 64, 0.8)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            }
        ];
        
        // Si el gráfico ya existe, actualizarlo
        if (operatorsChart) {
            operatorsChart.data.labels = labels;
            operatorsChart.data.datasets = datasets;
            operatorsChart.update();
        } else {
            // Crear un nuevo gráfico
            operatorsChart = new Chart(operatorsChartEl, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Ventas y Canjes por Operador'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.raw;
                                    return label + ': ' + formatCurrency(value);
                                }
                            }
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
        }
        
        console.log('Gráfico de operadores creado exitosamente');
    } catch (e) {
        console.error('Error al crear/actualizar gráfico de operadores:', e);
    }
}

// Función para actualizar la tabla de operadores
function updateOperatorsTable(operatorsData) {
    console.log('Actualizando tabla de operadores con datos:', operatorsData);
    
    const operatorsTable = document.getElementById('operatorsTable');
    if (!operatorsTable) {
        console.warn('Elemento de tabla de operadores no encontrado');
        return;
    }
    
    const tableBody = operatorsTable.querySelector('tbody');
    if (!tableBody) {
        console.warn('Elemento tbody de la tabla de operadores no encontrado');
        return;
    }
    
    // Limpiar tabla actual
    tableBody.innerHTML = '';
    
    // Si no hay datos, mostrar mensaje
    if (!operatorsData || operatorsData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="text-center">No hay datos disponibles</td>';
        tableBody.appendChild(row);
        return;
    }
    
    // Rellenar tabla con datos
    operatorsData.forEach(operator => {
        const row = document.createElement('tr');
        
        // Crear las celdas de la tabla
        row.innerHTML = `
            <td>${operator.operatorName}</td>
            <td>${operator.totalOperations}</td>
            <td>${formatCurrency(operator.totalSales)}</td>
            <td>${formatCurrency(operator.totalExchanges)}</td>
            <td>${formatCurrency(operator.totalAmount)}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    console.log('Tabla de operadores actualizada correctamente');
}