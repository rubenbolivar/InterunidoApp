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
    const { type, client, date } = req.query;
    let filter = {};
    if (type) filter.type = type;
    if (client) filter.client = { $regex: client, $options: 'i' };
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }
    // Si el usuario no es administrador, filtra por su operatorId
    if (req.user.role !== 'admin') {
      filter.operatorId = req.user.id;
    }
    const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(transactions);
  } catch (error) {
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
    
    // Construir respuesta final
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
          data: salesByHour[0]
        }
      }
    };
    
    res.json(metrics);
  } catch (error) {
    logger.error('Error al calcular métricas:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error al calcular métricas', error: error.message });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Servidor API corriendo en puerto ${PORT}`));
// Actualización servidor: Wed Feb 19 15:47:23 -04 2025
