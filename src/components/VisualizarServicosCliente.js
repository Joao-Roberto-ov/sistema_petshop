// Crie este novo arquivo em: joao-roberto-ov/sistema_petshop/sistema_petshop-dev/src/components/VisualizarServicosCliente.js

import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import './VisualizarServicosCliente.css';

function VisualizarServicosCliente({ onBack }) {
    const [servicos, setServicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchServicos();
    }, []);

    const fetchServicos = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/servicos');
            setServicos(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao buscar serviços.');
        } finally {
            setLoading(false);
        }
    };

    const formatarDuracao = (minutos) => {
        const min = parseInt(minutos) || 0;
        if (min === 0) return 'Não informado';

        const horas = Math.floor(min / 60);
        const minutosRestantes = min % 60;

        if (horas === 0) {
            return `${minutosRestantes} min`;
        } else if (minutosRestantes === 0) {
            return `${horas}h`;
        } else {
            return `${horas}h ${minutosRestantes}min`;
        }
    };

    if (loading) {
        return <div className="loading-container">Carregando serviços...</div>;
    }

    if (error) {
        return <div className="error-container">{error}</div>;
    }

    return (
        <div>
            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">Nossos Serviços</h1>
                    <p className="animate-fade-in-up">
                        Conheça os cuidados que oferecemos para o seu pet.
                    </p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="servicos-lista-container">
                        <table className="servicos-tabela">
                            <thead>
                                <tr>
                                    <th>Serviço</th>
                                    <th>Descrição</th>
                                    <th>Duração</th>
                                    <th>Preço</th>
                                </tr>
                            </thead>
                            <tbody>
                                {servicos.map((servico) => (
                                    <tr key={servico.id}>
                                        <td data-label="Serviço">{servico.nome}</td>
                                        <td data-label="Descrição">{servico.descricao || 'N/A'}</td>
                                        <td data-label="Duração">{formatarDuracao(servico.duracao)}</td>
                                        <td data-label="Preço">R$ {servico.preco.toFixed(2).replace('.', ',')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default VisualizarServicosCliente;