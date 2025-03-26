document.addEventListener('DOMContentLoaded', function() {
    fetch('components/sidebar.html')
        .then(response => response.text())
        .then(data => {
            // Cargar en el sidebar original para desktop
            document.getElementById('sidebar-container').innerHTML = data;
            
            // Cargar en el offcanvas para móvil - SOLUCIÓN RADICAL
            const offcanvasBody = document.querySelector('.offcanvas-body');
            if (offcanvasBody) {
                // Extraer solo el contenido interno del sidebar
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const sidebarContent = doc.querySelector('.sidebar');
                
                if (sidebarContent) {
                    // Crear una versión simplificada del sidebar
                    const headerContent = sidebarContent.querySelector('.sidebar-header');
                    const navContent = sidebarContent.querySelector('.sidebar-nav');
                    const footerContent = sidebarContent.querySelector('.sidebar-footer');
                    
                    // Limpiar el offcanvas body
                    offcanvasBody.innerHTML = '';
                    
                    // Añadir solo la navegación y el footer, omitiendo el header para evitar duplicar el logo
                    if (navContent) {
                        const navClone = navContent.cloneNode(true);
                        offcanvasBody.appendChild(navClone);
                    }
                    
                    if (footerContent) {
                        const footerClone = footerContent.cloneNode(true);
                        offcanvasBody.appendChild(footerClone);
                    }
                    
                    // Aplicar control de acceso específicamente al menú móvil
                    applyAccessControlToMobileMenu();
                }
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
            
            // Controlar visibilidad de enlaces según el rol para el sidebar desktop
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

// Función para aplicar control de acceso específicamente al menú móvil
function applyAccessControlToMobileMenu() {
    // Obtener datos del usuario
    const userData = localStorage.getItem('user_data');
    if (!userData) return;
    
    const user = JSON.parse(userData);
    const isAdmin = user.role === 'admin';
    
    // Seleccionar específicamente el contenedor de enlaces de admin en el menú móvil
    const mobileAdminLinks = document.querySelector('.offcanvas-body #admin-links');
    
    // Mostrar u ocultar según el rol
    if (mobileAdminLinks) {
        if (isAdmin) {
            mobileAdminLinks.style.display = 'block';
        } else {
            mobileAdminLinks.style.display = 'none';
        }
    }
}

// Función para controlar acceso según el rol
function controlAccessByRole() {
    // Obtener datos del usuario
    const userData = localStorage.getItem('user_data');
    if (!userData) return;
    
    const user = JSON.parse(userData);
    const isAdmin = user.role === 'admin';
    
    // Seleccionar los contenedores de enlaces de admin en el sidebar desktop
    const desktopAdminLinks = document.querySelector('#sidebar-container #admin-links');
    
    // Mostrar u ocultar según el rol
    if (desktopAdminLinks) {
        if (isAdmin) {
            desktopAdminLinks.style.display = 'block';
        } else {
            desktopAdminLinks.style.display = 'none';
        }
    }
    
    // Verificar la página actual y redirigir si no tiene acceso
    const currentPath = window.location.pathname;
    
    // Si no es admin y está intentando acceder a páginas de admin
    if (!isAdmin && (currentPath.includes('admin.html') || currentPath.includes('dashboard.html'))) {
        window.location.replace('operaciones.html');
    }
} 