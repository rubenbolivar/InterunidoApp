// Variables globales
let currentUserId = null;
let users = [];
let currentUser = null;

// Elementos del DOM
const userForm = document.getElementById('userForm');
const usersTableBody = document.getElementById('usersTableBody');
const formTitle = document.getElementById('formTitle');
const saveButton = document.getElementById('saveButton');
const cancelButton = document.getElementById('cancelButton');
const successAlert = document.getElementById('successAlert');
const errorAlert = document.getElementById('errorAlert');
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
const deleteUserName = document.getElementById('deleteUserName');
const confirmDeleteBtn = document.getElementById('confirmDelete');

// Obtener el token de autenticación
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

// Obtener datos del usuario actual
function getCurrentUser() {
    const userData = localStorage.getItem('user_data');
    if (userData) {
        return JSON.parse(userData);
    }
    return null;
}

// Verificar si el usuario es administrador
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// Redirigir si no es administrador
function checkAdminAccess() {
    if (!isAdmin()) {
        window.location.replace('dashboard.html');
    }
}

// Mostrar mensaje de éxito
function showSuccess(message) {
    successAlert.textContent = message;
    successAlert.classList.remove('d-none');
    setTimeout(() => {
        successAlert.classList.add('d-none');
    }, 3000);
}

// Mostrar mensaje de error
function showError(message) {
    errorAlert.textContent = message;
    errorAlert.classList.remove('d-none');
    setTimeout(() => {
        errorAlert.classList.add('d-none');
    }, 3000);
}

// Cargar usuarios desde el servidor
async function loadUsers() {
    try {
        const response = await fetch('/api/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar usuarios');
        }

        users = await response.json();
        renderUsersTable();
    } catch (error) {
        showError(error.message);
    }
}

// Renderizar tabla de usuarios
function renderUsersTable() {
    usersTableBody.innerHTML = '';
    
    if (users.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" class="text-center">No hay usuarios registrados</td>';
        usersTableBody.appendChild(row);
        return;
    }
    
    // Obtener el ID del usuario actual
    currentUser = getCurrentUser();
    const currentUserId = currentUser ? currentUser.id : null;
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        // Determinar si es el usuario actual
        const isCurrentUser = user._id === currentUserId;
        const userLabel = isCurrentUser ? `${user.username} (tú)` : user.username;
        
        row.innerHTML = `
            <td>${userLabel}</td>
            <td>${user.role === 'admin' ? 'Administrador' : 'Operador'}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-user" data-id="${user._id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                ${isCurrentUser ? '' : `
                <button class="btn btn-sm btn-danger delete-user" data-id="${user._id}" data-username="${user.username}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
                `}
            </td>
        `;
        
        usersTableBody.appendChild(row);
    });
    
    // Añadir event listeners a los botones
    document.querySelectorAll('.edit-user').forEach(btn => {
        btn.addEventListener('click', () => editUser(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-user').forEach(btn => {
        btn.addEventListener('click', () => showDeleteConfirmation(btn.dataset.id, btn.dataset.username));
    });
}

// Mostrar formulario para editar usuario
function editUser(userId) {
    const user = users.find(u => u._id === userId);
    if (!user) return;
    
    // Cambiar el formulario a modo edición
    formTitle.textContent = 'Editar Usuario';
    document.getElementById('userId').value = user._id;
    document.getElementById('username').value = user.username;
    document.getElementById('password').value = '';
    document.getElementById('role').value = user.role;
    
    // Mostrar botón de cancelar
    cancelButton.classList.remove('d-none');
    
    // Cambiar texto del botón de guardar
    saveButton.textContent = 'Actualizar Usuario';
    
    // Hacer scroll al formulario
    userForm.scrollIntoView({ behavior: 'smooth' });
}

// Resetear formulario a estado inicial
function resetForm() {
    formTitle.textContent = 'Crear Nuevo Usuario';
    userForm.reset();
    document.getElementById('userId').value = '';
    cancelButton.classList.add('d-none');
    saveButton.textContent = 'Guardar Usuario';
}

// Mostrar confirmación de eliminación
function showDeleteConfirmation(userId, username) {
    deleteUserName.textContent = username;
    confirmDeleteBtn.dataset.userId = userId;
    deleteModal.show();
}

// Guardar usuario (crear o actualizar)
async function saveUser(event) {
    event.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    const userData = { username, role };
    if (password) {
        userData.password = password;
    }
    
    try {
        let url = '/api/users';
        let method = 'POST';
        
        // Si hay ID, es una actualización
        if (userId) {
            url = `/api/users/${userId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar usuario');
        }
        
        // Mostrar mensaje de éxito
        showSuccess(userId ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
        
        // Resetear formulario y recargar usuarios
        resetForm();
        loadUsers();
    } catch (error) {
        showError(error.message);
    }
}

// Eliminar usuario
async function deleteUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar usuario');
        }
        
        // Mostrar mensaje de éxito
        showSuccess('Usuario eliminado exitosamente');
        
        // Recargar usuarios
        loadUsers();
    } catch (error) {
        showError(error.message);
    }
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si el usuario es administrador
    checkAdminAccess();
    
    // Cargar usuarios
    loadUsers();
    
    // Event listeners
    userForm.addEventListener('submit', saveUser);
    
    cancelButton.addEventListener('click', () => {
        resetForm();
    });
    
    confirmDeleteBtn.addEventListener('click', () => {
        const userId = confirmDeleteBtn.dataset.userId;
        deleteModal.hide();
        deleteUser(userId);
    });
}); 