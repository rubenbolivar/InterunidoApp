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
      renderNotesList(notes);
    })
    .catch(error => {
      console.error('Error al obtener notas:', error);
      showAlert('Error al cargar las notas. Por favor, intente nuevamente.', 'danger');
    });
  }
  
  // Renderizar lista de notas
  function renderNotesList(notes) {
    const notesContainer = document.getElementById('notesList');
    notesContainer.innerHTML = '';
    
    if (notes.length === 0) {
      notesContainer.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fas fa-sticky-note fa-3x text-muted mb-3"></i>
          <h4 class="text-muted">No hay notas disponibles</h4>
          <p>Crea una nueva nota haciendo clic en el botón "Nueva Nota".</p>
        </div>
      `;
      return;
    }
    
    notes.forEach(note => {
      // Crear tarjeta para cada nota
      const noteCard = document.createElement('div');
      noteCard.className = 'col-md-6 col-lg-4 mb-4';
      
      // Formatear etiquetas
      const tagsHtml = note.tags && note.tags.length > 0 
        ? note.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('')
        : '';
      
      // Truncar contenido si es muy largo
      const truncatedContent = note.content.length > 150 
        ? note.content.substring(0, 150) + '...' 
        : note.content;
      
      noteCard.innerHTML = `
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">${note.title}</h5>
            <div class="dropdown">
              <button class="btn btn-sm btn-link" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item edit-note" href="#" data-id="${note._id}"><i class="fas fa-edit me-2"></i>Editar</a></li>
                <li><a class="dropdown-item delete-note" href="#" data-id="${note._id}"><i class="fas fa-trash-alt me-2"></i>Eliminar</a></li>
              </ul>
            </div>
          </div>
          <div class="card-body">
            <p class="card-text">${truncatedContent}</p>
            <div class="mt-2">
              ${tagsHtml}
            </div>
          </div>
          <div class="card-footer text-muted">
            <small>${formatDate(note.createdAt)}</small>
          </div>
        </div>
      `;
      
      notesContainer.appendChild(noteCard);
    });
    
    // Añadir event listeners para editar y eliminar
    document.querySelectorAll('.edit-note').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const noteId = this.getAttribute('data-id');
        openNoteForEditing(noteId);
      });
    });
    
    document.querySelectorAll('.delete-note').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const noteId = this.getAttribute('data-id');
        openDeleteConfirmation(noteId);
      });
    });
  }
  
  // Abrir nota para edición
  function openNoteForEditing(noteId) {
    const token = getAuthToken();
    
    fetch(`/api/notes/${noteId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(response => response.json())
    .then(note => {
      // Llenar el formulario con los datos de la nota
      document.getElementById('noteId').value = note._id;
      document.getElementById('noteTitle').value = note.title;
      document.getElementById('noteContent').value = note.content;
      document.getElementById('noteTags').value = note.tags ? note.tags.join(', ') : '';
      
      // Actualizar título del modal
      document.getElementById('noteModalLabel').textContent = 'Editar Nota';
      
      // Abrir el modal
      const noteModal = new bootstrap.Modal(document.getElementById('noteModal'));
      noteModal.show();
      
      // Guardar el ID de la nota actual
      currentNoteId = note._id;
    })
    .catch(error => {
      console.error('Error al obtener nota para edición:', error);
      showAlert('Error al cargar la nota. Por favor, intente nuevamente.', 'danger');
    });
  }
  
  // Abrir confirmación de eliminación
  function openDeleteConfirmation(noteId) {
    currentNoteId = noteId;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteNoteModal'));
    deleteModal.show();
  }
  
  // Guardar nota (crear o actualizar)
  function saveNote() {
    const token = getAuthToken();
    const noteId = document.getElementById('noteId').value;
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const tagsInput = document.getElementById('noteTags').value;
    
    // Procesar etiquetas
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
    
    const noteData = {
      title,
      content,
      tags
    };
    
    const isUpdate = noteId !== '';
    const url = isUpdate ? `/api/notes/${noteId}` : '/api/notes';
    const method = isUpdate ? 'PUT' : 'POST';
    
    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(noteData)
    })
    .then(response => response.json())
    .then(data => {
      // Cerrar el modal
      const noteModal = bootstrap.Modal.getInstance(document.getElementById('noteModal'));
      noteModal.hide();
      
      // Limpiar el formulario
      document.getElementById('noteForm').reset();
      document.getElementById('noteId').value = '';
      
      // Recargar las notas
      applyFilters();
      
      // Mostrar mensaje de éxito
      showAlert(`Nota ${isUpdate ? 'actualizada' : 'creada'} correctamente`, 'success');
    })
    .catch(error => {
      console.error('Error al guardar nota:', error);
      showAlert('Error al guardar la nota. Por favor, intente nuevamente.', 'danger');
    });
  }
  
  // Eliminar nota
  function deleteNote() {
    if (!currentNoteId) return;
    
    const token = getAuthToken();
    
    fetch(`/api/notes/${currentNoteId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(response => response.json())
    .then(data => {
      // Cerrar el modal
      const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteNoteModal'));
      deleteModal.hide();
      
      // Recargar las notas
      applyFilters();
      
      // Mostrar mensaje de éxito
      showAlert('Nota eliminada correctamente', 'success');
    })
    .catch(error => {
      console.error('Error al eliminar nota:', error);
      showAlert('Error al eliminar la nota. Por favor, intente nuevamente.', 'danger');
    });
  }
  
  // Aplicar filtros
  function applyFilters() {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    const tags = document.getElementById('filterTags').value;
    const search = document.getElementById('filterSearch').value;
    
    let queryParams = '?';
    if (startDate) queryParams += `startDate=${startDate}&`;
    if (endDate) queryParams += `endDate=${endDate}&`;
    if (tags) queryParams += `tags=${tags}&`;
    if (search) queryParams += `search=${search}&`;
    
    // Eliminar el último '&' o '?' si no hay parámetros
    queryParams = queryParams === '?' ? '' : queryParams.slice(0, -1);
    
    fetchNotes(queryParams);
  }
  
  // Mostrar alerta
  function showAlert(message, type) {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertContainer.setAttribute('role', 'alert');
    alertContainer.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertContainer);
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      const alert = bootstrap.Alert.getOrCreateInstance(alertContainer);
      alert.close();
    }, 5000);
  }
  
  // Event Listeners
  
  // Botón para crear nueva nota
  document.getElementById('newNoteBtn').addEventListener('click', function() {
    // Limpiar el formulario
    document.getElementById('noteForm').reset();
    document.getElementById('noteId').value = '';
    
    // Actualizar título del modal
    document.getElementById('noteModalLabel').textContent = 'Nueva Nota';
    
    // Abrir el modal
    const noteModal = new bootstrap.Modal(document.getElementById('noteModal'));
    noteModal.show();
    
    // Resetear el ID de la nota actual
    currentNoteId = null;
  });
  
  // Botón para guardar nota
  document.getElementById('saveNoteBtn').addEventListener('click', saveNote);
  
  // Botón para confirmar eliminación
  document.getElementById('confirmDeleteBtn').addEventListener('click', deleteNote);
  
  // Formulario de filtros
  document.getElementById('filterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    applyFilters();
  });
  
  // Cargar notas al iniciar
  fetchNotes();
}); 