import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './NotificacoesScreen.css';

const IconBell = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);

const IconBox = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
);

function NotificacoesScreen({ onBack }) {
    const [notificacoesSistema, setNotificacoesSistema] = useState([]);
    const [estoqueBaixo, setEstoqueBaixo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDados = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            // Busca notificações do sistema (Agendamentos, etc)
            const resSistema = await axios.get("/notificacoes/", {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Busca alertas de estoque baixo
            const resEstoque = await axios.get("/produtos/estoque-baixo", {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotificacoesSistema(resSistema.data || []);
            setEstoqueBaixo(resEstoque.data || []);
        } catch (err) {
            console.error("Erro ao buscar notificações:", err);
            setError("Não foi possível carregar as notificações.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDados();
    }, []);

    const marcarComoLida = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/notificacoes/${id}/lida`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remove da lista visualmente
            setNotificacoesSistema(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error("Erro ao marcar como lida:", err);
        }
    };

    if (loading) return <div className="loading-message">Carregando notificações...</div>;

    return (
        <div className="notificacoes-container">
            <div className="notificacoes-header">
                <div className="header-title">
                    <h1>Central de Notificações</h1>
                    <p>Acompanhe alertas de agendamentos e status do estoque.</p>
                </div>
                <button className="btn-voltar" onClick={onBack}>Voltar</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="notificacoes-grid">
                {/* Coluna 1: Sistema / Agendamentos */}
                <div className="notificacao-coluna">
                    <div className="coluna-header">
                        <IconBell />
                        <h3>Agendamentos & Sistema</h3>
                        <span className="badge-count">{notificacoesSistema.length}</span>
                    </div>

                    <div className="lista-cards">
                        {notificacoesSistema.length === 0 ? (
                            <div className="empty-state">Nenhuma notificação nova.</div>
                        ) : (
                            notificacoesSistema.map(notif => (
                                <div key={notif.id} className="notif-card sistema">
                                    <div className="notif-content">
                                        <p>{notif.mensagem}</p>
                                        <small>{new Date(notif.criado_em).toLocaleString()}</small>
                                    </div>
                                    <button
                                        className="btn-lida"
                                        onClick={() => marcarComoLida(notif.id)}
                                        title="Marcar como lida"
                                    >
                                        ✓
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Coluna 2: Estoque Baixo */}
                <div className="notificacao-coluna">
                    <div className="coluna-header">
                        <IconBox />
                        <h3>Alertas de Estoque</h3>
                        <span className="badge-count alert">{estoqueBaixo.length}</span>
                    </div>

                    <div className="lista-cards">
                        {estoqueBaixo.length === 0 ? (
                            <div className="empty-state">Estoque regular.</div>
                        ) : (
                            estoqueBaixo.map(prod => (
                                <div key={prod.id} className="notif-card estoque">
                                    <div className="notif-content">
                                        <strong>{prod.nome}</strong>
                                        <p>
                                            Estoque Atual: <span className="text-danger">{prod.quantidade}</span>
                                            {' '}| Mínimo: {prod.estoque_minimo}
                                        </p>
                                    </div>
                                    <div className="estoque-indicador">
                                        ⚠️
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NotificacoesScreen;