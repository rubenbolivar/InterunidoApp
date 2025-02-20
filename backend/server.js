// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = process.env.SECRET_KEY || 'tu_clave_secreta';

// Conexión a MongoDB (ajusta la URI según tu configuración o usa MongoDB Atlas)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/interunido', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

// Modelo de Usuario
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,  // Se almacenará el hash de la contraseña
  role: String       // "admin" o "operador"
});
const User = mongoose.model('User', UserSchema);

// Modelo de Transacción (se añadió el campo operatorId)
const TransactionSchema = new mongoose.Schema({
  type: String,       // "venta" o "canje"
  client: String,
  amount: Number,     // Monto en la divisa
  details: Object,    // Información adicional (tasas, comisiones, distribución, etc.)
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
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
    console.error('No se proporcionó token');
    return res.status(403).json({ message: 'No se proporcionó token' });
  }
  
  // Imprime la clave secreta usada (para depuración)
  console.log('Clave secreta usada:', SECRET_KEY);
  
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error('Error al verificar token:', err);
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
    
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error interno en el servidor' });
  }
});

// Endpoint para registrar una transacción (Venta o Canje)
// Se asigna automáticamente el operatorId con el id del usuario autenticado
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

// Endpoint para obtener transacciones con filtros
// Si el usuario no es admin, se filtran solo las transacciones creadas por él
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
app.listen(PORT, () => console.log(`Servidor API corriendo en puerto ${PORT}`));
// Actualización servidor: Wed Feb 19 15:47:23 -04 2025
