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
export const obterRelatorioServicosMaisSolicitados = async (dataInicio, dataFim) => {
    try {
        const token = localStorage.getItem('token');
        const response = await instance.get('/vendas/relatorio/servicos-mais-solicitados', {
            params: {
                data_inicio: dataInicio,
                data_fim: dataFim
            },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao obter relatório de serviços mais solicitados:", error);
        throw error;
    }
};

export const exportarRelatorioServicosCSV = async (dataInicio, dataFim) => {
    try {
        const token = localStorage.getItem('token');
        const response = await instance.get('/vendas/relatorio/servicos-mais-solicitados/csv', {
            params: {
                data_inicio: dataInicio,
                data_fim: dataFim
            },
            headers: { 'Authorization': `Bearer ${token}` },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao exportar CSV do relatório de serviços:", error);
        throw error;
    }
};

export const exportarRelatorioServicosPDF = async (dataInicio, dataFim) => {
    try {
        const token = localStorage.getItem('token');
        const response = await instance.get('/vendas/relatorio/servicos-mais-solicitados/pdf', {
            params: {
                data_inicio: dataInicio,
                data_fim: dataFim
            },
            headers: { 'Authorization': `Bearer ${token}` },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao exportar PDF do relatório de serviços:", error);
        throw error;
    }
};

export const obterRelatorioProdutosMaisVendidos = async (dataInicio, dataFim) => {
    try {
        const token = localStorage.getItem('token');
        const response = await instance.get('/vendas/relatorio/produtos-mais-vendidos', {
            params: {
                data_inicio: dataInicio,
                data_fim: dataFim
            },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao obter relatório de produtos mais vendidos:", error);
        throw error;
    }
};

export const exportarRelatorioProdutosCSV = async (dataInicio, dataFim) => {
    try {
        const token = localStorage.getItem('token');
        const response = await instance.get('/vendas/relatorio/produtos-mais-vendidos/csv', {
            params: {
                data_inicio: dataInicio,
                data_fim: dataFim
            },
            headers: { 'Authorization': `Bearer ${token}` },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao exportar CSV do relatório de produtos:", error);
        throw error;
    }
};

export const exportarRelatorioProdutosPDF = async (dataInicio, dataFim) => {
    try {
        const token = localStorage.getItem('token');
        const response = await instance.get('/vendas/relatorio/produtos-mais-vendidos/pdf', {
            params: {
                data_inicio: dataInicio,
                data_fim: dataFim
            },
            headers: { 'Authorization': `Bearer ${token}` },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao exportar PDF do relatório de produtos:", error);
        throw error;
    }
};

export default instance;