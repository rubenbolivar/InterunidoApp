const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    index: true // Para búsquedas eficientes por título
  },
  content: { 
    type: String, 
    required: true,
    index: true // Para búsquedas eficientes por contenido
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // Para filtrar por usuario creador
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true // Para búsquedas y ordenamiento por fecha
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  operationType: { 
    type: String, 
    enum: ['venta', 'canje', 'general'], 
    default: 'general',
    index: true // Para filtrar por tipo de operación
  },
  operationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Transaction', 
    default: null,
    index: true // Para búsquedas por operación específica
  },
  tags: [{ 
    type: String,
    index: true // Para búsquedas por etiquetas
  }],
  isArchived: { 
    type: Boolean, 
    default: false,
    index: true // Para filtrar notas archivadas
  }
});

// Índice compuesto para búsquedas frecuentes
NoteSchema.index({ createdBy: 1, operationId: 1 });
NoteSchema.index({ createdBy: 1, operationType: 1 });

// Método para extraer etiquetas del contenido
NoteSchema.pre('save', function(next) {
  // Extraer palabras que comienzan con # como etiquetas
  if (this.content) {
    const tagRegex = /#(\w+)/g;
    const matches = this.content.match(tagRegex);
    
    if (matches) {
      // Eliminar el # y convertir a minúsculas
      this.tags = matches.map(tag => tag.substring(1).toLowerCase());
    }
  }
  
  // Actualizar la fecha de modificación
  this.updatedAt = Date.now();
  
  next();
});

module.exports = mongoose.model('Note', NoteSchema); 