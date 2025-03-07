class Auth {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.errorMessage = document.getElementById('errorMessage');

        if (!this.form) {
            console.warn('No es una página de login, omitiendo inicialización de Auth.');
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

            // Redirigir según el rol del usuario
            if (data.user.role === 'admin') {
                window.location.replace('dashboard.html');
            } else {
                window.location.replace('operaciones.html');
            }
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
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
            setTimeout(() => {
                this.errorMessage.style.display = 'none';
            }, 3000);
        }
    }

    static checkAuth() {
        const token = localStorage.getItem('auth_token');
        const currentPath = window.location.pathname;

        // Si estamos en index.html y hay token, ir a la página correspondiente según el rol
        if (currentPath.includes('index.html') && token) {
            const userData = localStorage.getItem('user_data');
            if (userData) {
                const user = JSON.parse(userData);
                if (user.role === 'admin') {
                    window.location.replace('dashboard.html');
                } else {
                    window.location.replace('operaciones.html');
                }
            } else {
                window.location.replace('operaciones.html');
            }
            return true;
        }

        // Si no estamos en index.html y no hay token, forzar login
        if (!currentPath.includes('index.html') && !token) {
            window.location.replace('index.html');
            return false;
        }

        return true;
    }

    static checkRole(requiredRole) {
        const userData = localStorage.getItem('user_data');
        if (!userData) return false;
        
        const user = JSON.parse(userData);
        return user.role === requiredRole;
    }

    static logout() {
        const theme = localStorage.getItem('theme');
        localStorage.clear();
        if (theme) {
            localStorage.setItem('theme', theme);
        }

        // Forzar redirección al login
        window.location.replace('index.html');
    }
}

// Solo inicializar Auth si estamos en una página de login
document.addEventListener('DOMContentLoaded', () => {
    console.log('Verificando autenticación');
    if (!Auth.checkAuth()) {
        console.log('Usuario no autenticado, redirigiendo a login.');
    } else {
        console.log('Usuario autenticado.');
    }

    if (document.getElementById('loginForm')) {
        console.log('Inicializando Auth en página de login');
        new Auth();
    }
});
