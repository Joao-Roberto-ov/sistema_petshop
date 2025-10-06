import axios from 'axios';

const instance = axios.create({
    baseURL: '/api'
} );

instance.interceptors.response.use(
    (response) => response,
    (error) => {
        const { config, response } = error;


        if (response && response.status === 401) {

            const allowed401Urls = [
                '/users/me/request-password-change',
                '/login'
            ];


            if (!allowed401Urls.includes(config.url)) {
                console.log("Interceptador: Erro 401 inesperado. Deslogando usuário.");
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
