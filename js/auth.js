class Auth {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.errorMessage = document.getElementById('errorMessage');
        
        if (!this.form) {
            console.error('No se encontró el formulario de login');
            return;
        }
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            console.log('Formulario enviado');
            this.handleLogin(e);
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value;
        console.log('Intentando login con:', { username });

        try {
            // Realiza la petición al backend para autenticar al usuario
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error en la autenticación');
            }

            const data = await response.json();
            console.log('Login exitoso:', data);
            // Guardar token y datos de usuario
            this.setAuthToken(data.token);
            this.setUserData(data.user);
            // Redirigir al dashboard
            window.location.replace('dashboard.html');
        } catch (error) {
            console.error('Error en login:', error);
            this.showError(error.message);
        }
    }

    setAuthToken(token) {
        localStorage.setItem('auth_token', token);
    }

    setUserData(userData) {
        localStorage.setItem('user_data', JSON.stringify(userData));
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.add('show');
        setTimeout(() => {
            this.errorMessage.classList.remove('show');
        }, 3000);
    }

    static checkAuth() {
        const token = localStorage.getItem('auth_token');
        const currentPath = window.location.pathname;
        
        // Si estamos en index.html y hay token, ir al dashboard
        if (currentPath.includes('index.html') && token) {
            window.location.replace('dashboard.html');
            return true;
        }
        
        // Si no estamos en index.html y no hay token, forzar login
        if (!currentPath.includes('index.html') && !token) {
            window.location.replace('index.html');
            return false;
        }
        
        return true;
    }

    static logout() {
        // Limpiar todo el localStorage excepto el tema
        const theme = localStorage.getItem('theme');
        localStorage.clear();
        if (theme) {
            localStorage.setItem('theme', theme);
        }
        
        // Forzar redirección al login
        window.location.replace('index.html');
    }
}

// Verificar autenticación inmediatamente
if (!Auth.checkAuth()) {
    window.location.replace('index.html');
}

// Inicializar Auth cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando Auth');
    const auth = new Auth();
});
