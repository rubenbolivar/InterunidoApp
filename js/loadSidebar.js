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
        });
}); 