import axios from 'axios';

// Instância para APIs que precisam de autenticação (com baseURL /api)
const instance = axios.create({
    baseURL: '/api'
});

const publicInstance = axios.create({
    // Sem baseURL - usa URLs completas
});

//interceptor de requisiçao (envia o token)
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

//interceptor de resposta (trata erros 401)
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        const { config, response } = error;

        if (response && response.status === 401) {
            const allowed401Urls = [
                '/login',
                '/forgot-password',
                '/reset-password',
                '/forgot-password-funcionario',
                '/reset-password-funcionario',
                '/users/me/request-password-change'
            ];

            if (!allowed401Urls.includes(config.url)) {
                console.warn(`Interceptador Axios: Sessão expirada (401) em ${config.url}. Deslogando.`);
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                window.location.href = '/';
                alert("Sua sessão expirou. Por favor, faça login novamente.");
            }
        }
        return Promise.reject(error);
    }
);

export { publicInstance };
export default instance;