document.addEventListener('DOMContentLoaded', function() {
    fetch('components/sidebar.html')
        .then(response => response.text())
        .then(data => {
            // Cargar en el sidebar original para desktop
            document.getElementById('sidebar-container').innerHTML = data;
            
            // Cargar en el offcanvas para móvil
            const offcanvasBody = document.querySelector('.offcanvas-body');
            if (offcanvasBody) {
                const sidebarContent = document.createElement('div');
                sidebarContent.innerHTML = data;
                
                // Remover la clase sidebar del contenedor principal en el offcanvas
                const sidebarDiv = sidebarContent.querySelector('.sidebar');
                if (sidebarDiv) {
                    sidebarDiv.classList.remove('sidebar');
                }
                
                offcanvasBody.appendChild(sidebarContent.firstChild);
            }
            
            // Configurar el cierre de sesión
            const logoutButtons = document.querySelectorAll('#cerrarSesion');
            logoutButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    Auth.logout();
                });
            });
            
            // Controlar visibilidad de enlaces según el rol
            controlAccessByRole();
        });
});

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