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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const salesAggregate = await Transaction.aggregate([
      { $match: { createdAt: { $gte: today }, type: 'venta' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const dailySales = salesAggregate[0] ? salesAggregate[0].total : 0;
    res.json({ dailySales });
  } catch (error) {
    res.status(500).json({ message: 'Error al calcular métricas' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Servidor API corriendo en puerto ${PORT}`));
// Actualización servidor: Wed Feb 19 15:47:23 -04 2025
