/**
 * Notas V2 - Gestión de notas para InterUnido
 * Versión mejorada con mejor manejo de errores y compatibilidad
 */

class NotesManager {
  constructor() {
    // Referencias a elementos del DOM
    this.notesList = document.getElementById('notesList');
    this.filterForm = document.getElementById('filterForm');
    this.newNoteBtn = document.getElementById('newNoteBtn');
    this.saveNoteBtn = document.getElementById('saveNoteBtn');
    this.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    this.alertContainer = document.getElementById('alertContainer');
    
    // Variables de estado
    this.currentNoteId = null;
    this.notes = [];
    
    // Inicializar
    this.init();
  }
  
  /**
   * Inicializa la aplicación
   */
  init() {
    // Verificar autenticación
    if (!this.isAuthenticated()) {
      this.showAlert('Debe iniciar sesión para acceder a las notas', 'warning');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
      return;
    }
    
    // Cargar notas
    this.fetchNotes();
    
    // Configurar eventos
    this.setupEventListeners();
  }
  
  /**
   * Configura los listeners de eventos
   */
  setupEventListeners() {
    // Filtrar notas
    this.filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.applyFilters();
    });
    
    // Nueva nota
    this.newNoteBtn.addEventListener('click', () => {
      this.openNoteModal();
    });
    
    // Guardar nota
    this.saveNoteBtn.addEventListener('click', () => {
      this.saveNote();
    });
    
    // Confirmar eliminación
    this.confirmDeleteBtn.addEventListener('click', () => {
      this.deleteNote();
    });
  }
  
  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated() {
    return !!this.getAuthToken();
  }
  
  /**
   * Obtiene el token de autenticación
   */
  getAuthToken() {
    return localStorage.getItem('auth_token');
  }
  
  /**
   * Obtiene los datos del usuario actual
   */
  getUserData() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
  
  /**
   * Carga las notas desde el servidor
   */
  fetchNotes(queryParams = '') {
    const token = this.getAuthToken();
    
    // Mostrar estado de carga
    this.notesList.innerHTML = `
      <div class="col-12 text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2">Cargando notas...</p>
      </div>
    `;
    
    console.log(`Cargando notas con parámetros: ${queryParams || 'ninguno'}`);
    
    // Realizar petición al servidor
    fetch('/api/v2/notes' + queryParams, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      console.log('Respuesta de notas recibida:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada o inválida');
        }
        return response.text().then(text => {
          console.error('Error response body:', text);
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        });
      }
      return response.json();
    })
    .then(notes => {
      console.log(`Recibidas ${notes.length} notas`);
      this.notes = notes;
      this.displayNotes(notes);
    })
    .catch(error => {
      console.error('Error al cargar notas:', error);
      
      if (error.message.includes('Sesión expirada')) {
        this.showAlert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.', 'warning');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      } else {
        this.showAlert('Error al cargar las notas. ' + error.message, 'danger');
        this.notesList.innerHTML = `
          <div class="col-12 text-center my-5">
            <p class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error al cargar las notas</p>
            <button class="btn btn-outline-primary mt-2" onclick="notesManager.fetchNotes()">
              <i class="fas fa-sync"></i> Reintentar
            </button>
          </div>
        `;
      }
    });
  }
  
  /**
   * Muestra las notas en la interfaz
   */
  displayNotes(notes) {
    this.notesList.innerHTML = '';
    
    if (notes.length === 0) {
      this.notesList.innerHTML = `
        <div class="col-12 text-center my-5">
          <p class="text-muted">No hay notas disponibles. ¡Crea una nueva nota!</p>
        </div>
      `;
      return;
    }
    
    notes.forEach(note => {
      // Manejar las etiquetas que pueden venir como array o como string
      let tags = [];
      if (Array.isArray(note.tags)) {
        tags = note.tags;
      } else if (typeof note.tags === 'string' && note.tags) {
        tags = note.tags.split(',').map(tag => tag.trim());
      }
      
      const tagsHtml = tags.map(tag => 
        `<span class="badge bg-secondary me-1">${this.escapeHtml(tag)}</span>`
      ).join('');
      
      const noteCard = document.createElement('div');
      noteCard.className = 'col-md-6 col-lg-4 mb-4';
      noteCard.innerHTML = `
        <div class="card h-100 note-card" data-id="${note._id || note.id}">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">${this.escapeHtml(note.title)}</h5>
            <div class="dropdown">
              <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item edit-note" href="#" data-id="${note._id || note.id}"><i class="fas fa-edit me-2"></i>Editar</a></li>
                <li><a class="dropdown-item delete-note" href="#" data-id="${note._id || note.id}"><i class="fas fa-trash-alt me-2"></i>Eliminar</a></li>
              </ul>
            </div>
          </div>
          <div class="card-body">
            <p class="card-text">${this.escapeHtml(note.content)}</p>
            <div class="mt-3">
              ${tagsHtml}
            </div>
          </div>
          <div class="card-footer text-muted">
            <small>${this.formatDate(note.createdAt)}</small>
          </div>
        </div>
      `;
      
      this.notesList.appendChild(noteCard);
    });
    
    // Configurar eventos para editar y eliminar
    document.querySelectorAll('.edit-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const noteId = btn.getAttribute('data-id');
        this.editNote(noteId);
      });
    });
    
    document.querySelectorAll('.delete-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const noteId = btn.getAttribute('data-id');
        this.confirmDeleteNote(noteId);
      });
    });
    
    // Configurar evento para abrir nota al hacer clic en la tarjeta
    document.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Evitar que se active si se hizo clic en el menú de opciones o sus elementos
        if (e.target.closest('.dropdown') || e.target.closest('.dropdown-menu')) {
          return;
        }
        
        const noteId = card.getAttribute('data-id');
        this.viewNote(noteId);
      });
    });
  }
  
  /**
   * Aplica los filtros seleccionados
   */
  applyFilters() {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    const tags = document.getElementById('filterTags').value;
    const search = document.getElementById('filterSearch').value;
    
    let queryParams = '?';
    if (startDate) queryParams += `startDate=${startDate}&`;
    if (endDate) queryParams += `endDate=${endDate}&`;
    if (tags) queryParams += `tags=${encodeURIComponent(tags)}&`;
    if (search) queryParams += `search=${encodeURIComponent(search)}&`;
    
    // Eliminar el último '&' o '?' si no hay parámetros
    queryParams = queryParams.endsWith('&') 
      ? queryParams.slice(0, -1) 
      : (queryParams === '?' ? '' : queryParams);
    
    console.log('Aplicando filtros:', { startDate, endDate, tags, search });
    console.log('Query params:', queryParams);
    
    this.fetchNotes(queryParams);
  }
  
  /**
   * Abre el modal para crear una nueva nota
   */
  openNoteModal(note = null) {
    // Limpiar formulario
    document.getElementById('noteId').value = note ? (note._id || note.id) : '';
    document.getElementById('noteTitle').value = note ? note.title : '';
    document.getElementById('noteContent').value = note ? note.content : '';
    
    // Manejar las etiquetas
    let tagsValue = '';
    if (note) {
      if (Array.isArray(note.tags)) {
        tagsValue = note.tags.join(', ');
      } else if (typeof note.tags === 'string') {
        tagsValue = note.tags;
      }
    }
    document.getElementById('noteTags').value = tagsValue;
    
    // Actualizar título del modal
    document.getElementById('noteModalLabel').textContent = note ? 'Editar Nota' : 'Nueva Nota';
    
    // Mostrar modal
    const noteModal = new bootstrap.Modal(document.getElementById('noteModal'));
    noteModal.show();
  }
  
  /**
   * Edita una nota existente
   */
  editNote(noteId) {
    this.currentNoteId = noteId;
    const token = this.getAuthToken();
    
    fetch(`/api/v2/notes/${noteId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada o inválida');
        } else if (response.status === 404) {
          throw new Error('Nota no encontrada');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(note => {
      this.openNoteModal(note);
    })
    .catch(error => {
      console.error('Error al cargar la nota:', error);
      this.showAlert('Error al cargar la nota: ' + error.message, 'danger');
    });
  }
  
  /**
   * Confirma la eliminación de una nota
   */
  confirmDeleteNote(noteId) {
    this.currentNoteId = noteId;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteNoteModal'));
    deleteModal.show();
  }
  
  /**
   * Elimina una nota
   */
  deleteNote() {
    const token = this.getAuthToken();
    
    fetch(`/api/v2/notes/${this.currentNoteId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada o inválida');
        } else if (response.status === 404) {
          throw new Error('Nota no encontrada');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(() => {
      // Cerrar modal
      const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteNoteModal'));
      deleteModal.hide();
      
      // Mostrar mensaje de éxito
      this.showAlert('Nota eliminada correctamente', 'success');
      
      // Recargar notas
      this.fetchNotes();
    })
    .catch(error => {
      console.error('Error al eliminar la nota:', error);
      this.showAlert('Error al eliminar la nota: ' + error.message, 'danger');
    });
  }
  
  /**
   * Guarda una nota (crea o actualiza)
   */
  saveNote() {
    const token = this.getAuthToken();
    const noteId = document.getElementById('noteId').value;
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const tags = document.getElementById('noteTags').value;
    
    console.log('Guardando nota:', { title, content, tags: tags.split(',') });
    
    // Validar campos requeridos
    if (!title.trim() || !content.trim()) {
      this.showAlert('El título y el contenido son obligatorios', 'warning');
      return;
    }
    
    // Convertir las etiquetas de string a array
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    const noteData = {
      title,
      content,
      tags: tagsArray
    };
    
    const url = noteId ? `/api/v2/notes/${noteId}` : '/api/v2/notes';
    const method = noteId ? 'PUT' : 'POST';
    
    console.log(`Enviando solicitud ${method} a ${url}`);
    
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(noteData)
    })
    .then(response => {
      console.log('Respuesta recibida:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada o inválida');
        }
        return response.text().then(text => {
          console.error('Error response body:', text);
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Nota guardada exitosamente:', data);
      
      // Cerrar modal
      const noteModal = bootstrap.Modal.getInstance(document.getElementById('noteModal'));
      noteModal.hide();
      
      // Mostrar mensaje de éxito
      const message = noteId ? 'Nota actualizada correctamente' : 'Nota creada correctamente';
      this.showAlert(message, 'success');
      
      // Recargar notas
      this.fetchNotes();
    })
    .catch(error => {
      console.error('Error al guardar la nota:', error);
      this.showAlert('Error al guardar la nota: ' + error.message, 'danger');
    });
  }
  
  /**
   * Muestra una alerta en la interfaz
   */
  showAlert(message, type = 'danger') {
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    this.alertContainer.innerHTML = '';
    this.alertContainer.appendChild(alertElement);
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      if (alertElement.parentNode) {
        const bsAlert = new bootstrap.Alert(alertElement);
        bsAlert.close();
      }
    }, 5000);
  }
  
  /**
   * Formatea una fecha para mostrarla
   */
  formatDate(dateString) {
    if (!dateString) return 'Fecha desconocida';
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    try {
      return new Date(dateString).toLocaleDateString('es-ES', options);
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  }
  
  /**
   * Escapa caracteres HTML para prevenir XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.toString().replace(/[&<>"']/g, m => map[m]);
  }
  
  /**
   * Muestra una nota en un modal
   */
  viewNote(noteId) {
    const token = this.getAuthToken();
    
    fetch(`/api/v2/notes/${noteId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada o inválida');
        } else if (response.status === 404) {
          throw new Error('Nota no encontrada');
        }
        throw new Error('Error al obtener la nota');
      }
      return response.json();
    })
    .then(note => {
      this.openViewNoteModal(note);
    })
    .catch(error => {
      this.showAlert(error.message, 'danger');
    });
  }
  
  /**
   * Abre el modal para ver una nota
   */
  openViewNoteModal(note) {
    // Configurar contenido del modal
    document.getElementById('viewNoteTitle').textContent = note.title;
    document.getElementById('viewNoteContent').innerHTML = this.formatNoteContent(note.content);
    
    // Manejar las etiquetas
    let tagsHtml = '';
    if (note.tags) {
      let tags = [];
      if (Array.isArray(note.tags)) {
        tags = note.tags;
      } else if (typeof note.tags === 'string' && note.tags) {
        tags = note.tags.split(',').map(tag => tag.trim());
      }
      
      tagsHtml = tags.map(tag => 
        `<span class="badge bg-secondary me-1">${this.escapeHtml(tag)}</span>`
      ).join('');
    }
    document.getElementById('viewNoteTags').innerHTML = tagsHtml;
    
    // Mostrar fecha
    document.getElementById('viewNoteDate').textContent = `Creada: ${this.formatDate(note.createdAt)}`;
    
    // Configurar botón de editar
    const editBtn = document.getElementById('editNoteFromViewBtn');
    editBtn.onclick = () => {
      // Cerrar modal de vista
      const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewNoteModal'));
      viewModal.hide();
      
      // Abrir modal de edición
      this.editNote(note._id || note.id);
    };
    
    // Mostrar modal
    const viewNoteModal = new bootstrap.Modal(document.getElementById('viewNoteModal'));
    viewNoteModal.show();
  }
  
  /**
   * Formatea el contenido de la nota para mostrar en el modal
   * Convierte saltos de línea en <br> y mantiene el formato
   */
  formatNoteContent(content) {
    if (!content) return '';
    
    // Escapar HTML para evitar inyección de código
    const escapedContent = this.escapeHtml(content);
    
    // Convertir saltos de línea en <br>
    return escapedContent.replace(/\n/g, '<br>');
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Crear instancia global
  window.notesManager = new NotesManager();
}); 