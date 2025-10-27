import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './AgendarServicoScreen.css';

//icones
const IconCalendar = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

function AgendarServicoScreen({ onBack, onNavigateToAgendamento }) {
    const [servicos, setServicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchServicos();
    }, []);

    const fetchServicos = async () => {
        setLoading(true);
        setError('');
        try {
            //rota publica para listar serviços
            const response = await axios.get('/servicos');
            setServicos(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao buscar serviços disponíveis.');
            console.error("Erro ao buscar serviços:", err);
        } finally {
            setLoading(false);
        }
    };

    //funçao para formatar preço em Real
    const formatarPreco = (preco) => {
        const valor = parseFloat(preco) || 0;
        return valor.toFixed(2).replace('.', ',');
    };

    //funçao para formatar duraçao
    const formatarDuracao = (minutos) => {
        const min = parseInt(minutos) || 0;
        if (min === 0) return 'Duração não informada';
        const horas = Math.floor(min / 60);
        const minutosRestantes = min % 60;
        let str = '';
        if (horas > 0) str += `${horas}h `;
        if (minutosRestantes > 0) str += `${minutosRestantes}min`;
        return str.trim();
    };

    if (loading) {
        return (
            <div className="agendamento-container">
                <div className="loading-message">Carregando serviços...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="agendamento-container">
                <div className="error-message">{error}</div>
                <button className="btn btn-secondary" onClick={onBack}>Voltar</button>
            </div>
        );
    }

    return (
        <>
            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">Agendar Serviço</h1>
                    <p className="animate-fade-in-up">
                        Escolha um dos nossos serviços para o seu pet.
                    </p>
                     <div className="hero-buttons">
                        <button className="btn btn-outline-white hover-lift" onClick={onBack}>
                            ← Voltar
                        </button>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                     <div className="servicos-disponiveis-grid">
                        {servicos.length === 0 ? (
                            <p>Nenhum serviço disponível no momento.</p>
                        ) : (
                            servicos.map((servico) => (
                                <div key={servico.id} className="servico-card-agendamento">
                                    <h3>{servico.nome}</h3>
                                    <p className="servico-descricao">{servico.descricao || 'Sem descrição adicional.'}</p>
                                    <div className="servico-detalhes">
                                        <span>Duração: {formatarDuracao(servico.duracao)}</span>
                                        <span>Preço: R$ {formatarPreco(servico.preco)}</span>
                                    </div>
                                    <button
                                        className="btn-agendar-servico"
                                        onClick={() => onNavigateToAgendamento(servico)} //envia o serviço selecionado
                                    >
                                        <IconCalendar /> Agendar Agora
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}

export default AgendarServicoScreen;