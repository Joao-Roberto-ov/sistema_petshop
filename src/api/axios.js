import axios from 'axios';

const instance = axios.create({
    baseURL: '/api'
} );

//interceptor de requisiçao (envia o token)
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            //adiciona o cabeçalho de autorizaçao em todas as requisiçoes
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        //faz algo com o erro da requisiçao
        return Promise.reject(error);
    }
);
//interceptor de resposta (trata erros 401)
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        const { config, response } = error;

        //se a resposta for 401 (nao autorizado)
        if (response && response.status === 401) {

            //urls que podem falhar com 401 (login, reset, etc.) e não devem causar logout
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

export default instance;