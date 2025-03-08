document.addEventListener('DOMContentLoaded', function() {
    fetch('components/sidebar.html')
        .then(response => response.text())
        .then(data => {
            // Cargar en el sidebar original para desktop
            document.getElementById('sidebar-container').innerHTML = data;
            
            // Cargar en el offcanvas para móvil - VERSIÓN CORREGIDA
            const offcanvasBody = document.querySelector('.offcanvas-body');
            if (offcanvasBody) {
                // Crear una versión simplificada del sidebar para el offcanvas
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const sidebarContent = doc.querySelector('.sidebar');
                
                // Extraer los elementos necesarios
                const headerContent = sidebarContent.querySelector('.sidebar-header').innerHTML;
                const navContent = sidebarContent.querySelector('.sidebar-nav').innerHTML;
                const footerContent = sidebarContent.querySelector('.sidebar-footer').innerHTML;
                
                // Construir el HTML para el offcanvas
                offcanvasBody.innerHTML = `
                    <div class="sidebar-header">${headerContent}</div>
                    <nav class="sidebar-nav">${navContent}</nav>
                    <div class="sidebar-footer">${footerContent}</div>
                `;
            }
            
            // Configurar el cierre de sesión
            const logoutButtons = document.querySelectorAll('#cerrarSesion');
            logoutButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    // Usar una función de cierre de sesión más robusta
                    logoutUser();
                });
            });
            
            // Controlar visibilidad de enlaces según el rol
            controlAccessByRole();
        });
});

// Función para cerrar sesión de forma segura
function logoutUser() {
    console.log('Cerrando sesión...');
    // Guardar el tema actual
    const theme = localStorage.getItem('theme');
    
    // Limpiar localStorage
    localStorage.clear();
    
    // Restaurar el tema
    if (theme) {
        localStorage.setItem('theme', theme);
    }
    
    // Redirigir al login
    window.location.replace('index.html');
}

// Función para controlar acceso según el rol
function controlAccessByRole() {
    // Obtener datos del usuario
    const userData = localStorage.getItem('user_data');
    if (!userData) return;
    
    const user = JSON.parse(userData);
    const isAdmin = user.role === 'admin';
    
    // Seleccionar todos los contenedores de enlaces de admin
    const adminLinks = document.querySelectorAll('#admin-links');
    
    // Mostrar u ocultar según el rol
    adminLinks.forEach(container => {
        if (isAdmin) {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    });
    
    // Verificar la página actual y redirigir si no tiene acceso
    const currentPath = window.location.pathname;
    
    // Si no es admin y está intentando acceder a páginas de admin
    if (!isAdmin && (currentPath.includes('admin.html') || currentPath.includes('dashboard.html'))) {
        window.location.replace('operaciones.html');
    }
} 