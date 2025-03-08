// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
// Cargar variables de entorno
require('dotenv').config();
// Importar logger
const logger = require('./logger');

// Configurar zona horaria de Caracas (UTC-04:00)
process.env.TZ = 'America/Caracas';
logger.info('Zona horaria configurada: ' + process.env.TZ);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Usar SECRET_KEY desde variables de entorno de forma segura
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  logger.error('ERROR: SECRET_KEY no está definida en el archivo .env');
  process.exit(1);
}

// Conexión a MongoDB (sin opciones deprecadas)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/interunido', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => logger.info('MongoDB conectado'))
  .catch(err => logger.error('Error de conexión a MongoDB:', { error: err.message }));

// Modelo de Usuario
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,  // Se almacenará el hash de la contraseña
  role: String       // "admin" o "operador"
});
const User = mongoose.model('User', UserSchema);

// Modelo de Transacción (se añadió el campo operatorId y el campo "estado")
const TransactionSchema = new mongoose.Schema({
  type: String,       // "venta" o "canje"
  client: String,
  amount: Number,     // Monto en la divisa (ej. 3000 US$, 2000 EUR, etc.)
  details: Object,    // Información adicional (currency, rate, transacciones parciales, etc.)
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  estado: { type: String, default: 'incompleta' }, // "incompleta" o "completa"
  createdAt: { type: Date, default: Date.now },
  history: [{ type: Object }]
});
const Transaction = mongoose.model('Transaction', TransactionSchema);

// Modelo de Notas
const NoteSchema = new mongoose.Schema({
  title: String,
  content: String,
  tags: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Note = mongoose.model('Note', NoteSchema);

// Middleware para verificar el token
function verifyToken(req, res, next) {
  // Omite la verificación en solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    logger.error('No se proporcionó token');
    return res.status(403).json({ message: 'No se proporcionó token' });
  }
  
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      logger.error('Error al verificar token:', { error: err.message });
      return res.status(401).json({ message: 'Token inválido' });
    }
    req.user = decoded; // decoded debe contener al menos { id, role }
    next();
  });
}

// Endpoint de login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Contraseña incorrecta' });
    
    // Generar un token que expire en 30 días
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '30d' });
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error interno en el servidor' });
  }
});

// Endpoint para registrar una transacción (Venta o Canje)
app.post('/api/transactions', verifyToken, async (req, res) => {
  try {
    req.body.operatorId = req.user.id; // Asigna el id del usuario autenticado
    const transaction = new Transaction(req.body);
    await transaction.save();
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar la transacción' });
  }
});

// Endpoint para actualizar una transacción existente
app.put('/api/transactions/:id', verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      logger.error(`Operación no encontrada: ${req.params.id}`);
      return res.status(404).json({ message: 'Operación no encontrada' });
    }
    // Si el usuario no es admin, solo puede actualizar su propia operación
    if (req.user.role !== 'admin' && transaction.operatorId.toString() !== req.user.id) {
      logger.warn(`Usuario ${req.user.id} intentó actualizar operación ${req.params.id} sin autorización`);
      return res.status(403).json({ message: 'No autorizado para actualizar esta operación' });
    }
    
    // Validar datos recibidos
    if (req.body.amount && (isNaN(req.body.amount) || req.body.amount <= 0)) {
      return res.status(400).json({ message: 'El monto debe ser un número positivo' });
    }
    
    // Registrar cambios en el historial
    const historyEntry = {
      date: new Date(),
      userId: req.user.id,
      action: req.body.estado === 'completa' && transaction.estado === 'incompleta' ? 'complete' : 'update',
      changes: {}
    };
    
    // Verificar cambios específicos
    if (req.body.client && req.body.client !== transaction.client) {
      historyEntry.changes.client = [transaction.client, req.body.client];
    }
    
    if (req.body.amount && req.body.amount !== transaction.amount) {
      historyEntry.changes.amount = [transaction.amount, req.body.amount];
    }
    
    if (req.body.estado && req.body.estado !== transaction.estado) {
      historyEntry.changes.estado = [transaction.estado, req.body.estado];
    }
    
    // Verificar si hubo cambios en los detalles
    if (req.body.details) {
      // Solo para simplificar, registramos que hubo cambios en detalles
      historyEntry.changes.details = ['updated', 'updated'];
    }
    
    // Actualizar los campos relevantes
    transaction.client = req.body.client || transaction.client;
    transaction.amount = req.body.amount || transaction.amount;
    transaction.details = req.body.details || transaction.details;
    
    // Verificación automática del estado basado en monto pendiente
    let shouldBeComplete = false;
    let pendingAmount = 0;
    
    // Verificar si hay monto pendiente en los detalles actualizados o en los existentes
    if (req.body.details && req.body.details.summary) {
      if (typeof req.body.details.summary.montoPendiente !== 'undefined') {
        pendingAmount = req.body.details.summary.montoPendiente;
      } else if (typeof req.body.details.summary.montoRestante !== 'undefined') {
        pendingAmount = req.body.details.summary.montoRestante;
      }
    } else if (transaction.details && transaction.details.summary) {
      if (typeof transaction.details.summary.montoPendiente !== 'undefined') {
        pendingAmount = transaction.details.summary.montoPendiente;
      } else if (typeof transaction.details.summary.montoRestante !== 'undefined') {
        pendingAmount = transaction.details.summary.montoRestante;
      }
    }
    
    // Si el monto pendiente es 0 o negativo, la operación debe estar completa
    shouldBeComplete = pendingAmount <= 0;
    
    // Si debe estar completa, asegurar que el estado sea 'completa'
    if (shouldBeComplete && transaction.estado !== 'completa') {
      transaction.estado = 'completa';
      
      // Si el estado no venía en la solicitud, añadir el cambio al historial
      if (!req.body.estado) {
        historyEntry.changes.estado = [transaction.estado, 'completa'];
        historyEntry.action = 'complete';
      }
      
      logger.info(`Operación ${req.params.id} marcada automáticamente como completa debido a monto pendiente cero`);
    } else {
      // Si no debe estar completa automáticamente, respetar lo que viene en la solicitud
      transaction.estado = req.body.estado || transaction.estado;
    }
    
    // Solo añadir la entrada de historial si hay cambios
    if (Object.keys(historyEntry.changes).length > 0) {
      // Inicializar el array history si no existe
      if (!transaction.history) {
        transaction.history = [];
      }
      
      transaction.history.push(historyEntry);
    }
    
    await transaction.save();
    logger.info(`Operación ${req.params.id} actualizada correctamente`);
    res.json(transaction);
  } catch (error) {
    logger.error('Error al actualizar la transacción:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error al actualizar la operación' });
  }
});

// Endpoint para obtener UNA transacción por su ID
app.get('/api/transactions/:id', verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Operación no encontrada' });
    }
    // Si no es admin, solo puede ver sus propias operaciones
    if (req.user.role !== 'admin' && transaction.operatorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'No autorizado para ver esta operación' });
    }
    res.json(transaction);
  } catch (error) {
    console.error('Error al obtener la transacción:', error);
    res.status(500).json({ message: 'Error al obtener la operación' });
  }
});

// Endpoint para obtener transacciones con filtros
app.get('/api/transactions', verifyToken, async (req, res) => {
  try {
    // Capturar parámetros de paginación y filtros
    const { type, client, date, page = '1', limit = '20' } = req.query;
    
    // Convertir página y límite a números
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    // Validar valores
    const validPage = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
    const validLimit = isNaN(limitNum) || limitNum < 1 || limitNum > 100 ? 20 : limitNum;
    
    // Calcular skip (cuántos documentos omitir)
    const skip = (validPage - 1) * validLimit;
    
    // Construir filtro
    let filter = {};
    if (type) filter.type = type;
    if (client) filter.client = { $regex: client, $options: 'i' };
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }
    
    // Si el usuario no es administrador, filtrar por su operatorId
    if (req.user.role !== 'admin') {
      filter.operatorId = req.user.id;
    }
    
    // Ejecutar consulta con paginación
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validLimit);
    
    // Contar total de documentos para metadatos de paginación
    const total = await Transaction.countDocuments(filter);
    
    // Calcular el número total de páginas
    const totalPages = Math.ceil(total / validLimit);
    
    // Registrar información de paginación
    logger.info(`Paginación: página ${validPage} de ${totalPages}, mostrando ${transactions.length} de ${total} operaciones`);
    
    // Devolver datos con metadatos de paginación
    res.json({
      transactions,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        pages: totalPages
      }
    });
  } catch (error) {
    logger.error('Error al obtener transacciones:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error al obtener las transacciones' });
  }
});

// Endpoint para obtener el detalle completo de una operación para reportes
app.get('/api/transactions/:id/report', verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Operación no encontrada' });
    }
    
    // Si no es admin, solo puede ver sus propias operaciones
    if (req.user.role !== 'admin' && transaction.operatorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'No autorizado para ver esta operación' });
    }
    
    // Obtener información del operador
    const operator = await User.findById(transaction.operatorId).select('username role');
    
    // Construir respuesta con toda la información necesaria para el reporte
    const reportData = {
      ...transaction.toObject(),
      operator: operator || { username: 'No registrado' }
    };
    
    res.json(reportData);
  } catch (error) {
    logger.error('Error al obtener detalle de operación para reporte:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error al obtener detalle de la operación' });
  }
});

// Endpoint para obtener métricas para el dashboard
app.get('/api/metrics', verifyToken, async (req, res) => {
  try {
    const { dateRange } = req.query;
    
    // Configurar fechas según el rango solicitado (por defecto: hoy)
    const now = new Date();
    let startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    let previousStartDate, previousEndDate;
    
    // Procesar diferentes rangos de fechas
    if (dateRange === 'yesterday') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      
      previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - 1);
      previousEndDate = new Date(endDate);
      previousEndDate.setDate(previousEndDate.getDate() - 1);
    } else if (dateRange === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setHours(0, 0, 0, 0);
      
      previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - 7);
      previousEndDate = new Date(startDate);
      previousEndDate.setSeconds(previousEndDate.getSeconds() - 1);
    } else if (dateRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (dateRange === 'custom' && req.query.start && req.query.end) {
      startDate = new Date(req.query.start);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(req.query.end);
      endDate.setHours(23, 59, 59, 999);
      
      // Para el período anterior, usamos el mismo intervalo pero más atrás
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
      previousEndDate = new Date(endDate);
      previousEndDate.setDate(previousEndDate.getDate() - daysDiff);
    } else {
      // Por defecto: hoy
      previousStartDate = new Date(now);
      previousStartDate.setDate(previousStartDate.getDate() - 1);
      previousStartDate.setHours(0, 0, 0, 0);
      previousEndDate = new Date(now);
      previousEndDate.setDate(previousEndDate.getDate() - 1);
      previousEndDate.setHours(23, 59, 59, 999);
    }

    // 1. Ventas del período actual
    const salesAggregate = await Transaction.aggregate([
      { $match: { 
          createdAt: { $gte: startDate, $lte: endDate },
          type: 'venta'
        } 
      },
      { $group: { 
          _id: null, 
          total: { $sum: "$amount" }, 
          count: { $sum: 1 } 
        } 
      }
    ]);
    
    // 2. Ventas del período anterior (para comparación)
    const previousSalesAggregate = await Transaction.aggregate([
      { $match: { 
          createdAt: { $gte: previousStartDate, $lte: previousEndDate },
          type: 'venta'
        } 
      },
      { $group: { 
          _id: null, 
          total: { $sum: "$amount" }, 
          count: { $sum: 1 } 
        } 
      }
    ]);
    
    // 3. Operaciones por tipo (ventas, canjes internos, canjes externos)
    const operationsByType = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { 
          _id: {
            type: "$type",
            subtype: { $cond: [{ $eq: ["$type", "canje"] }, "$details.tipo", null] }
          },
          count: { $sum: 1 },
          total: { $sum: "$amount" }
        } 
      }
    ]);

    // 4. Datos por hora para el gráfico de línea
    const startHour = new Date(startDate);
    const salesByHour = [];
    const hoursInRange = dateRange === 'week' || dateRange === 'month' || dateRange === 'custom' 
                         ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) * 24 
                         : 24;

    // Si el rango es mayor a un día, agrupamos por día en lugar de por hora
    const groupByDay = hoursInRange > 24;
    
    if (groupByDay) {
      // Agrupar por día
      const salesByDay = await Transaction.aggregate([
        { $match: { 
            createdAt: { $gte: startDate, $lte: endDate },
            type: 'venta'
          } 
        },
        { 
          $group: { 
            _id: { 
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            total: { $sum: "$amount" }
          } 
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]);
      
      // Formatear los resultados para el gráfico
      const labels = [];
      const data = [];
      
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}`;
        labels.push(formattedDate);
        
        // Buscar si hay datos para este día
        const dayData = salesByDay.find(d => 
          d._id.year === currentDate.getFullYear() && 
          d._id.month === currentDate.getMonth() + 1 && 
          d._id.day === currentDate.getDate()
        );
        
        data.push(dayData ? dayData.total : 0);
        
        // Avanzar al siguiente día
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      salesByHour.push({ labels, data });
    } else {
      // Agrupar por hora (para un solo día)
      const hourlyData = await Transaction.aggregate([
        { $match: { 
            createdAt: { $gte: startDate, $lte: endDate },
            type: 'venta'
          } 
        },
        { 
          $group: { 
            _id: { $hour: "$createdAt" },
            total: { $sum: "$amount" }
          } 
        },
        { $sort: { "_id": 1 } }
      ]);
      
      // Formatear los resultados para el gráfico
      const labels = [];
      const data = [];
      
      for (let hour = 0; hour < 24; hour++) {
        const hourLabel = `${hour}:00`;
        labels.push(hourLabel);
        
        const hourData = hourlyData.find(h => h._id === hour);
        data.push(hourData ? hourData.total : 0);
      }
      
      salesByHour.push({ labels, data });
    }
    
    // 5. NUEVO: Ganancias por tipo de operación (ventas y canjes)
    const profitByType = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { 
        $group: { 
          _id: "$type",
          total: { $sum: "$amount" },
          profit: { 
            $sum: { 
              $cond: [
                { $eq: ["$type", "venta"] }, 
                { $ifNull: ["$profit", 0] }, 
                { $ifNull: ["$details.profit", 0] }
              ] 
            }
          }
        } 
      }
    ]);
    
    // 6. NUEVO: Comisiones por oficina (PZO y CCS)
    const commissionByOffice = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $lookup: {
          from: 'users',
          localField: 'operatorId',
          foreignField: '_id',
          as: 'operator'
        }
      },
      { $unwind: { path: '$operator', preserveNullAndEmptyArrays: true } },
      { 
        $group: { 
          _id: "$operator.office",
          commissionTotal: { 
            $sum: { 
              $cond: [
                { $eq: ["$type", "venta"] }, 
                { $ifNull: ["$commission", 0] }, 
                { $ifNull: ["$details.commission", 0] }
              ] 
            }
          },
          count: { $sum: 1 }
        } 
      }
    ]);
    
    // 7. NUEVO: Rendimiento por tipo de operación (eficiencia, monto promedio)
    const performanceByType = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { 
        $group: { 
          _id: {
            type: "$type",
            subtype: { $cond: [{ $eq: ["$type", "canje"] }, "$details.tipo", null] }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalProfit: { 
            $sum: { 
              $cond: [
                { $eq: ["$type", "venta"] }, 
                { $ifNull: ["$profit", 0] }, 
                { $ifNull: ["$details.profit", 0] }
              ] 
            }
          },
          totalCommission: { 
            $sum: { 
              $cond: [
                { $eq: ["$type", "venta"] }, 
                { $ifNull: ["$commission", 0] }, 
                { $ifNull: ["$details.commission", 0] }
              ] 
            }
          }
        } 
      },
      {
        $project: {
          _id: 1,
          count: 1,
          totalAmount: 1,
          totalProfit: 1,
          totalCommission: 1,
          avgAmount: { $divide: ["$totalAmount", { $cond: [{ $eq: ["$count", 0] }, 1, "$count"] }] },
          profitPercentage: { 
            $multiply: [
              { $divide: [
                "$totalProfit", 
                { $cond: [{ $eq: ["$totalAmount", 0] }, 1, "$totalAmount"] }
              ] },
              100
            ]
          },
          commissionPercentage: { 
            $multiply: [
              { $divide: [
                "$totalCommission", 
                { $cond: [{ $eq: ["$totalAmount", 0] }, 1, "$totalAmount"] }
              ] },
              100
            ]
          }
        }
      }
    ]);
    
    // 5. Calcular métricas adicionales y organizar la respuesta
    const currentPeriodSales = salesAggregate[0] ? salesAggregate[0].total : 0;
    const previousPeriodSales = previousSalesAggregate[0] ? previousSalesAggregate[0].total : 0;
    
    // Calcular el cambio porcentual entre periodos
    let percentageChange = 0;
    if (previousPeriodSales > 0) {
      percentageChange = Math.round(((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100);
    }
    
    // Calcular número total de operaciones en el período
    const totalOperations = salesAggregate[0] ? salesAggregate[0].count : 0;
    
    // Calcular promedio por operación
    const averageOperation = totalOperations > 0 ? Math.round(currentPeriodSales / totalOperations) : 0;
    
    // Organizar los datos por tipo de operación para el gráfico circular
    const operationTypes = {
      labels: [],
      data: []
    };
    
    operationsByType.forEach(op => {
      let label;
      if (op._id.type === 'venta') {
        label = 'Ventas';
      } else if (op._id.type === 'canje') {
        if (op._id.subtype === 'interno') {
          label = 'Canjes Internos';
        } else if (op._id.subtype === 'externo') {
          label = 'Canjes Externos';
        } else {
          label = 'Canjes';
        }
      } else {
        label = op._id.type;
      }
      
      operationTypes.labels.push(label);
      operationTypes.data.push(op.count);
    });
    
    // Si no hay datos de operaciones, establecer valores por defecto
    if (operationTypes.labels.length === 0) {
      operationTypes.labels = ['Ventas', 'Canjes Internos', 'Canjes Externos'];
      operationTypes.data = [0, 0, 0];
    }
    
    // Formatear ganancias por tipo para el gráfico
    const profits = {
      labels: [],
      data: [],
      totals: []
    };
    
    profitByType.forEach(item => {
      let label = item._id === 'venta' ? 'Ventas' : 'Canjes';
      profits.labels.push(label);
      profits.data.push(item.profit || 0);
      profits.totals.push(item.total || 0);
    });
    
    // Si no hay datos, añadir valores por defecto
    if (profits.labels.length === 0) {
      profits.labels = ['Ventas', 'Canjes'];
      profits.data = [0, 0];
      profits.totals = [0, 0];
    }
    
    // Formatear comisiones por oficina para el gráfico
    const commissions = {
      labels: [],
      data: []
    };
    
    commissionByOffice.forEach(item => {
      let label = item._id || 'Sin oficina';
      commissions.labels.push(label);
      commissions.data.push(item.commissionTotal || 0);
    });
    
    // Si no hay datos, añadir valores por defecto
    if (commissions.labels.length === 0) {
      commissions.labels = ['PZO', 'CCS', 'Sin oficina'];
      commissions.data = [0, 0, 0];
    }
    
    // Formatear rendimiento por tipo para el gráfico
    const performance = {
      labels: [],
      avgAmount: [],
      profitPercentage: [],
      commissionPercentage: []
    };
    
    performanceByType.forEach(item => {
      let label;
      if (item._id.type === 'venta') {
        label = 'Ventas';
      } else if (item._id.type === 'canje') {
        if (item._id.subtype === 'interno') {
          label = 'Canjes Internos';
        } else if (item._id.subtype === 'externo') {
          label = 'Canjes Externos';
        } else {
          label = 'Canjes';
        }
      } else {
        label = item._id.type || 'Desconocido';
      }
      
      performance.labels.push(label);
      performance.avgAmount.push(item.avgAmount || 0);
      performance.profitPercentage.push(item.profitPercentage || 0);
      performance.commissionPercentage.push(item.commissionPercentage || 0);
    });
    
    // Si no hay datos, añadir valores por defecto
    if (performance.labels.length === 0) {
      performance.labels = ['Ventas', 'Canjes Internos', 'Canjes Externos'];
      performance.avgAmount = [0, 0, 0];
      performance.profitPercentage = [0, 0, 0];
      performance.commissionPercentage = [0, 0, 0];
    }
    
    // Construir respuesta final con valores por defecto si es necesario
    const metrics = {
      dateRange: {
        start: startDate,
        end: endDate
      },
      sales: {
        current: currentPeriodSales,
        previous: previousPeriodSales,
        percentageChange
      },
      operations: {
        total: totalOperations,
        average: averageOperation,
        distribution: operationTypes
      },
      charts: {
        salesByTime: {
          isDaily: !groupByDay,
          data: salesByHour[0] || { labels: [], data: [] }
        },
        profits: profits,
        commissions: commissions,
        performance: performance
      }
    };
    
    // Log para depuración
    logger.info('Enviando métricas dashboard:', { 
      user: req.user.username,
      dateRange,
      hasProfit: !!metrics.charts.profits,
      profitLabels: metrics.charts.profits.labels,
      hasCommissions: !!metrics.charts.commissions,
      commissionLabels: metrics.charts.commissions.labels,
      hasPerformance: !!metrics.charts.performance,
      performanceLabels: metrics.charts.performance.labels
    });
    
    res.json(metrics);
  } catch (error) {
    logger.error('Error al calcular métricas:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error al calcular métricas', error: error.message });
  }
});

// Endpoint para obtener operaciones (datos crudos)
app.get('/api/operations', verifyToken, async (req, res) => {
  try {
    const { dateRange, start, end } = req.query;
    
    // Configurar fechas según el rango solicitado
    const now = new Date();
    let startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    // Procesar diferentes rangos de fechas
    if (dateRange === 'yesterday') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateRange === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (dateRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateRange === 'custom' && start && end) {
      startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
    }
    
    // Log para depuración
    logger.info(`Obteniendo operaciones para usuario ${req.user.username} (${req.user.role})`, {
      dateRange,
      startDate,
      endDate
    });
    
    // Consulta de operaciones
    const operations = await Transaction.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate, $lte: endDate }
        } 
      },
      {
        $lookup: {
          from: 'users',
          localField: 'operatorId',
          foreignField: '_id',
          as: 'operatorInfo'
        }
      },
      {
        $unwind: {
          path: '$operatorInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          type: 1,
          amount: 1,
          details: 1,
          client: 1,
          date: '$createdAt',
          status: '$estado',
          operator: '$operatorInfo.username',
          office: { $ifNull: ['$details.office', 'Sin oficina'] }
        }
      },
      { 
        $sort: { 
          date: -1 
        } 
      }
    ]);
    
    // Devolver operaciones
    res.json({
      dateRange: {
        start: startDate,
        end: endDate
      },
      operations
    });
    
  } catch (error) {
    logger.error('Error al obtener operaciones:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error al obtener operaciones', error: error.message });
  }
});

// Endpoint para obtener estadísticas por operador
app.get('/api/metrics/operators', verifyToken, async (req, res) => {
  try {
    // Solo los administradores pueden ver las estadísticas de todos los operadores
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para ver estadísticas de operadores' });
    }
    
    const { dateRange, start, end } = req.query;
    
    // Configurar fechas según el rango solicitado
    const now = new Date();
    let startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    // Procesar diferentes rangos de fechas
    if (dateRange === 'yesterday') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateRange === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (dateRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateRange === 'custom' && start && end) {
      startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
    }
    
    // Log para depuración
    logger.info(`Obteniendo estadísticas por operador para usuario ${req.user.username} (${req.user.role})`, {
      dateRange,
      startDate,
      endDate
    });
    
    // Consulta de rendimiento por operador
    const operatorStats = await Transaction.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate, $lte: endDate }
        } 
      },
      {
        $lookup: {
          from: 'users',
          localField: 'operatorId',
          foreignField: '_id',
          as: 'operator'
        }
      },
      {
        $unwind: {
          path: '$operator',
          preserveNullAndEmptyArrays: true
        }
      },
      { 
        $group: { 
          _id: '$operatorId',
          operatorName: { $first: '$operator.username' },
          totalOperations: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          types: {
            $push: {
              type: '$type',
              subtype: { $cond: [{ $eq: ["$type", "canje"] }, "$details.tipo", null] }
            }
          }
        } 
      },
      {
        $project: {
          _id: 1,
          operatorName: 1,
          totalOperations: 1,
          totalAmount: 1,
          salesCount: {
            $size: {
              $filter: {
                input: '$types',
                as: 'type',
                cond: { $eq: ['$$type.type', 'venta'] }
              }
            }
          },
          canjeInternoCount: {
            $size: {
              $filter: {
                input: '$types',
                as: 'type',
                cond: { $and: [
                  { $eq: ['$$type.type', 'canje'] },
                  { $eq: ['$$type.subtype', 'interno'] }
                ]}
              }
            }
          },
          canjeExternoCount: {
            $size: {
              $filter: {
                input: '$types',
                as: 'type',
                cond: { $and: [
                  { $eq: ['$$type.type', 'canje'] },
                  { $eq: ['$$type.subtype', 'externo'] }
                ]}
              }
            }
          }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    // Devolver estadísticas
    res.json({
      dateRange: {
        start: startDate,
        end: endDate
      },
      operators: operatorStats
    });
    
  } catch (error) {
    logger.error('Error al obtener estadísticas por operador:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error al obtener estadísticas por operador', error: error.message });
  }
});

// Endpoint para listar usuarios (solo admin)
app.get('/api/users', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    logger.error('Error al obtener usuarios:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Endpoint para crear usuario (solo admin)
app.post('/api/users', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  
  try {
    const { username, password, role } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }
    
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear el usuario
    const user = new User({
      username,
      password: hashedPassword,
      role: role || 'operador' // Por defecto, operador
    });
    
    await user.save();
    logger.info(`Usuario creado: ${username}, rol: ${role}`);
    res.status(201).json({ message: 'Usuario creado exitosamente', user: { username: user.username, role: user.role } });
  } catch (error) {
    logger.error('Error al crear usuario:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error al crear usuario' });
  }
});

// Endpoint para actualizar usuario (solo admin)
app.put('/api/users/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  
  try {
    const { username, password, role } = req.body;
    const updates = {};
    
    if (username) updates.username = username;
    if (role) updates.role = role;
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    logger.info(`Usuario actualizado: ${username}, rol: ${role}`);
    res.json({ message: 'Usuario actualizado exitosamente', user });
  } catch (error) {
    logger.error('Error al actualizar usuario:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// Endpoint para eliminar usuario (solo admin)
app.delete('/api/users/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  
  try {
    // Evitar que un admin se elimine a sí mismo
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    logger.info(`Usuario eliminado: ${user.username}`);
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    logger.error('Error al eliminar usuario:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

// Endpoints para Notas
// 1. Crear una nueva nota
app.post('/api/notes', verifyToken, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const newNote = new Note({
      title,
      content,
      tags: tags || [],
      createdBy: req.user.id
    });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    logger.error('Error al crear nota:', { error: error.message });
    res.status(500).json({ error: 'Error al crear la nota' });
  }
});

// 2. Obtener todas las notas (con filtros opcionales)
app.get('/api/notes', verifyToken, async (req, res) => {
  try {
    const { search, startDate, endDate, tags } = req.query;
    let query = { createdBy: req.user.id };
    
    // Filtro por texto (título o contenido)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filtro por fecha
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Filtro por etiquetas
    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }
    
    const notes = await Note.find(query).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    logger.error('Error al obtener notas:', { error: error.message });
    res.status(500).json({ error: 'Error al obtener las notas' });
  }
});

// 3. Obtener una nota específica
app.get('/api/notes/:id', verifyToken, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!note) return res.status(404).json({ error: 'Nota no encontrada' });
    res.json(note);
  } catch (error) {
    logger.error('Error al obtener nota:', { error: error.message });
    res.status(500).json({ error: 'Error al obtener la nota' });
  }
});

// 4. Actualizar una nota
app.put('/api/notes/:id', verifyToken, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const updatedNote = await Note.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { 
        title, 
        content, 
        tags: tags || [],
        updatedAt: Date.now() 
      },
      { new: true }
    );
    if (!updatedNote) return res.status(404).json({ error: 'Nota no encontrada' });
    res.json(updatedNote);
  } catch (error) {
    logger.error('Error al actualizar nota:', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar la nota' });
  }
});

// 5. Eliminar una nota
app.delete('/api/notes/:id', verifyToken, async (req, res) => {
  try {
    const deletedNote = await Note.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!deletedNote) return res.status(404).json({ error: 'Nota no encontrada' });
    res.json({ message: 'Nota eliminada correctamente' });
  } catch (error) {
    logger.error('Error al eliminar nota:', { error: error.message });
    res.status(500).json({ error: 'Error al eliminar la nota' });
  }
});

// Endpoints para Notas V2
// 1. Crear una nueva nota
app.post('/api/v2/notes', verifyToken, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    
    // Validar datos
    if (!title || !content) {
      return res.status(400).json({ error: 'El título y el contenido son obligatorios' });
    }
    
    const newNote = new Note({
      title,
      content,
      tags: tags || [],
      createdBy: req.user.id
    });
    
    await newNote.save();
    logger.info(`Nota creada por usuario ${req.user.id}`);
    res.status(201).json(newNote);
  } catch (error) {
    logger.error('Error al crear nota v2:', { error: error.message });
    res.status(500).json({ error: 'Error al crear la nota' });
  }
});

// 2. Obtener todas las notas (con filtros opcionales)
app.get('/api/v2/notes', verifyToken, async (req, res) => {
  try {
    const { search, startDate, endDate, tags } = req.query;
    let query = { createdBy: req.user.id };
    
    // Filtro por texto (título o contenido)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filtro por fecha
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        // Ajustar la fecha final para incluir todo el día
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateTime;
      }
    }
    
    // Filtro por etiquetas
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    logger.info(`Consultando notas para usuario ${req.user.id}`);
    const notes = await Note.find(query).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    logger.error('Error al obtener notas v2:', { error: error.message });
    res.status(500).json({ error: 'Error al obtener las notas' });
  }
});

// 3. Obtener una nota específica
app.get('/api/v2/notes/:id', verifyToken, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!note) {
      logger.warn(`Nota ${req.params.id} no encontrada para usuario ${req.user.id}`);
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    res.json(note);
  } catch (error) {
    logger.error('Error al obtener nota v2:', { error: error.message });
    res.status(500).json({ error: 'Error al obtener la nota' });
  }
});

// 4. Actualizar una nota
app.put('/api/v2/notes/:id', verifyToken, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    
    // Validar datos
    if (!title || !content) {
      return res.status(400).json({ error: 'El título y el contenido son obligatorios' });
    }
    
    const updatedNote = await Note.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { 
        title, 
        content, 
        tags: tags || [],
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedNote) {
      logger.warn(`Nota ${req.params.id} no encontrada para actualizar por usuario ${req.user.id}`);
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    
    logger.info(`Nota ${req.params.id} actualizada por usuario ${req.user.id}`);
    res.json(updatedNote);
  } catch (error) {
    logger.error('Error al actualizar nota v2:', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar la nota' });
  }
});

// 5. Eliminar una nota
app.delete('/api/v2/notes/:id', verifyToken, async (req, res) => {
  try {
    const deletedNote = await Note.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!deletedNote) {
      logger.warn(`Nota ${req.params.id} no encontrada para eliminar por usuario ${req.user.id}`);
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    
    logger.info(`Nota ${req.params.id} eliminada por usuario ${req.user.id}`);
    res.json({ message: 'Nota eliminada correctamente' });
  } catch (error) {
    logger.error('Error al eliminar nota v2:', { error: error.message });
    res.status(500).json({ error: 'Error al eliminar la nota' });
  }
});

// Endpoint de prueba para verificar que la API está funcionando
app.get('/api/v2/test', (req, res) => {
  logger.info('Endpoint de prueba accedido');
  res.json({ message: 'API v2 funcionando correctamente', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Servidor API corriendo en puerto ${PORT}`));
// Actualización servidor: Wed Feb 19 15:47:23 -04 2025
