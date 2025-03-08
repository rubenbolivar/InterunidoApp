document.addEventListener('DOMContentLoaded', function() {
  // Variables globales
  let currentNoteId = null;
  
  // Obtener el token
  function getAuthToken() {
    return localStorage.getItem('auth_token');
  }
  
  // Formatear fecha
  function formatDate(dateString) {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  }
  
  // Cargar notas desde el backend
  function fetchNotes(queryParams = '') {
    const token = getAuthToken();
    
    fetch('/api/notes' + queryParams, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(response => response.json())
    .then(notes => {
      displayNotes(notes);
    })
    .catch(error => {
      console.error('Error al cargar notas:', error);
      showAlert('Error al cargar las notas. Por favor, intente nuevamente.');
    });
  }
  
  // Mostrar notas en la interfaz
  function displayNotes(notes) {
    const notesContainer = document.getElementById('notesList');
    notesContainer.innerHTML = '';
    
    if (notes.length === 0) {
      notesContainer.innerHTML = `
        <div class="col-12 text-center my-5">
          <p class="text-muted">No hay notas disponibles. ¡Crea una nueva nota!</p>
        </div>
      `;
      return;
    }
    
    notes.forEach(note => {
      const tags = note.tags ? note.tags.split(',').map(tag => tag.trim()) : [];
      const tagsHtml = tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('');
      
      const noteCard = document.createElement('div');
      noteCard.className = 'col-md-6 col-lg-4 mb-4';
      noteCard.innerHTML = `
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">${note.title}</h5>
            <div class="dropdown">
              <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item edit-note" href="#" data-id="${note.id}"><i class="fas fa-edit me-2"></i>Editar</a></li>
                <li><a class="dropdown-item delete-note" href="#" data-id="${note.id}"><i class="fas fa-trash-alt me-2"></i>Eliminar</a></li>
              </ul>
            </div>
          </div>
          <div class="card-body">
            <p class="card-text">${note.content}</p>
            <div class="mt-3">
              ${tagsHtml}
            </div>
          </div>
          <div class="card-footer text-muted">
            <small>${formatDate(note.created_at)}</small>
          </div>
        </div>
      `;
      
      notesContainer.appendChild(noteCard);
    });
    
    // Configurar eventos para editar y eliminar
    document.querySelectorAll('.edit-note').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const noteId = this.getAttribute('data-id');
        editNote(noteId);
      });
    });
    
    document.querySelectorAll('.delete-note').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const noteId = this.getAttribute('data-id');
        confirmDeleteNote(noteId);
      });
    });
  }
  
  // Abrir modal para editar nota
  function editNote(noteId) {
    currentNoteId = noteId;
    const token = getAuthToken();
    
    fetch(`/api/notes/${noteId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(response => response.json())
    .then(note => {
      document.getElementById('noteId').value = note.id;
      document.getElementById('noteTitle').value = note.title;
      document.getElementById('noteContent').value = note.content;
      document.getElementById('noteTags').value = note.tags || '';
      
      document.getElementById('noteModalLabel').textContent = 'Editar Nota';
      
      const noteModal = new bootstrap.Modal(document.getElementById('noteModal'));
      noteModal.show();
    })
    .catch(error => {
      console.error('Error al cargar la nota:', error);
      showAlert('Error al cargar la nota. Por favor, intente nuevamente.');
    });
  }
  
  // Confirmar eliminación de nota
  function confirmDeleteNote(noteId) {
    currentNoteId = noteId;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteNoteModal'));
    deleteModal.show();
  }
  
  // Eliminar nota
  function deleteNote() {
    const token = getAuthToken();
    
    fetch(`/api/notes/${currentNoteId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(response => {
      if (response.ok) {
        // Cerrar modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteNoteModal'));
        deleteModal.hide();
        
        // Recargar notas
        fetchNotes();
        
        // Mostrar mensaje de éxito
        showAlert('Nota eliminada correctamente.', 'success');
      } else {
        throw new Error('Error al eliminar la nota');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showAlert('Error al eliminar la nota. Por favor, intente nuevamente.');
    });
  }
  
  // Guardar nota (crear o actualizar)
  function saveNote() {
    const token = getAuthToken();
    const noteId = document.getElementById('noteId').value;
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const tags = document.getElementById('noteTags').value;
    
    const noteData = {
      title,
      content,
      tags
    };
    
    const url = noteId ? `/api/notes/${noteId}` : '/api/notes';
    const method = noteId ? 'PUT' : 'POST';
    
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(noteData)
    })
    .then(response => {
      if (response.ok) {
        // Cerrar modal
        const noteModal = bootstrap.Modal.getInstance(document.getElementById('noteModal'));
        noteModal.hide();
        
        // Recargar notas
        fetchNotes();
        
        // Mostrar mensaje de éxito
        const message = noteId ? 'Nota actualizada correctamente.' : 'Nota creada correctamente.';
        showAlert(message, 'success');
      } else {
        throw new Error('Error al guardar la nota');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showAlert('Error al guardar la nota. Por favor, intente nuevamente.');
    });
  }
  
  // Mostrar alerta
  function showAlert(message, type = 'danger') {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show`;
    alertContainer.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insertar alerta antes del contenido principal
    const mainContent = document.querySelector('.dashboard-content');
    mainContent.insertBefore(alertContainer, mainContent.firstChild);
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      alertContainer.classList.remove('show');
      setTimeout(() => alertContainer.remove(), 150);
    }, 5000);
  }
  
  // Configurar eventos
  document.addEventListener('DOMContentLoaded', function() {
    // Cargar notas al iniciar
    fetchNotes();
    
    // Evento para nueva nota
    document.getElementById('newNoteBtn').addEventListener('click', function() {
      // Limpiar formulario
      document.getElementById('noteId').value = '';
      document.getElementById('noteTitle').value = '';
      document.getElementById('noteContent').value = '';
      document.getElementById('noteTags').value = '';
      
      document.getElementById('noteModalLabel').textContent = 'Nueva Nota';
      
      const noteModal = new bootstrap.Modal(document.getElementById('noteModal'));
      noteModal.show();
    });
    
    // Evento para guardar nota
    document.getElementById('saveNoteBtn').addEventListener('click', saveNote);
    
    // Evento para confirmar eliminación
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteNote);
    
    // Evento para filtrar notas
    document.getElementById('filterForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const startDate = document.getElementById('filterStartDate').value;
      const endDate = document.getElementById('filterEndDate').value;
      const tags = document.getElementById('filterTags').value;
      const search = document.getElementById('filterSearch').value;
      
      let queryParams = '?';
      if (startDate) queryParams += `start_date=${startDate}&`;
      if (endDate) queryParams += `end_date=${endDate}&`;
      if (tags) queryParams += `tags=${encodeURIComponent(tags)}&`;
      if (search) queryParams += `search=${encodeURIComponent(search)}&`;
      
      // Eliminar el último '&' o '?' si no hay parámetros
      queryParams = queryParams.endsWith('&') 
        ? queryParams.slice(0, -1) 
        : (queryParams === '?' ? '' : queryParams);
      
      fetchNotes(queryParams);
    });
  });
}); 