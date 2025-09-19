// Arquivo completo e corrigido para: src/api/axios.js

import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8000/api', // Garanta que a base URL esteja correta
} );

// Interceptador de respostas para lidar com erros de autenticação
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        const { config, response } = error;

        // --- LÓGICA CORRIGIDA AQUI ---
        // Verifica se o erro é 401 (Não Autorizado)
        if (response && response.status === 401) {
            // Define as URLs que podem retornar 401 intencionalmente sem deslogar
            const allowed401Urls = [
                '/users/me/request-password-change', // Erro de "senha atual incorreta"
                '/login' // Erro de credenciais na tela de login
            ];

            // Se a URL do erro NÃO ESTÁ na lista de exceções, então desloga o usuário.
            // Isso cobre o caso principal de um token JWT expirado.
            if (!allowed401Urls.includes(config.url)) {
                console.log("Interceptador: Erro 401 inesperado. Deslogando usuário.");
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                // Redireciona para a tela de login
                window.location.href = '/login'; 
                alert("Sua sessão expirou. Por favor, faça login novamente.");
            }
        }
        
        // Retorna o erro para que o componente que fez a chamada (ex: MeuPerfilScreen) possa tratá-lo.
        return Promise.reject(error);
    }
);

export default instance;
