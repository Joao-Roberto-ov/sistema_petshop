import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './Dashboard.css'; // Reutilizando estilos
import './DashboardGestor.css'; // Reutilizando estilos dos cards

function DashboardAtendente({ userData, onNavigateToHome }) {
    const [minhasVendas, setMinhasVendas] = useState([]);
    const [vendasPendentesGeral, setVendasPendentesGeral] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const formatarValor = (valor) => {
        return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatarDataHora = (isoString) => {
        if (!isoString) return '-';
        const data = new Date(isoString);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusClass = (status) => {
        if (!status) return 'desconhecido';
        return status.toLowerCase().replace(/[\s/]/g, '-');
    };

    const carregarDados = async () => {
        setLoading(true);
        setError('');
        try {
            // 1. Minhas vendas (Concluídas/Canceladas)
            const resMinhas = await axios.get(`/vendas?funcionario_id=${userData.id}`);
            const finalizadas = (resMinhas.data || []).filter(v => v.status_pagamento !== 'Pendente');
            setMinhasVendas(finalizadas);

            // 2. Todas as vendas pendentes (Visível para todos os atendentes)
            const resPendentes = await axios.get(`/vendas?status=Pendente`);
            setVendasPendentesGeral(resPendentes.data || []);

        } catch (err) {
            console.error(err);
            setError("Erro ao carregar dados do dashboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, [userData.id]);

    if (loading) {
        return <div className="loading-message">Carregando Dashboard...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-gestor-header">
                <h1>Painel do Atendente</h1>
                <p>Olá, {userData.nome}. Aqui está o resumo das vendas.</p>
            </div>

            {error && <div className="error-message" style={{marginBottom: '1rem'}}>{error}</div>}

            <div className="summary-cards">
                <div className="card card-previsto" style={{borderColor: '#f39c12'}}>
                    <h3>Vendas Pendentes (Fila)</h3>
                    <p>{vendasPendentesGeral.length}</p>
                    <span>Aguardando pagamento/confirmação</span>
                </div>
                <div className="card card-realizado">
                    <h3>Minhas Vendas Finalizadas</h3>
                    <p>{minhasVendas.length}</p>
                    <span>(Pagas ou Canceladas por você)</span>
                </div>
                <button
                    className="btn-fluxo-caixa"
                    style={{backgroundColor: '#f39c12'}}
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'gerenciar-vendas-pendentes' }))}
                >
                    Gerenciar Fila de Pendentes
                </button>
            </div>

            <main className="dashboard-main" style={{ marginTop: '2rem' }}>
                <h2>Meu Histórico de Vendas (Finalizadas)</h2>
                {minhasVendas.length === 0 ? (
                    <div className="no-agendamentos">
                        <p>Você ainda não finalizou nenhuma venda.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="agendamentos-table gestor-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Cliente</th>
                                    <th>Valor Total</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {minhasVendas.map(v => (
                                    <tr key={v.id} className={`status-${getStatusClass(v.status_pagamento)}`}>
                                        <td className="agendamento-data">{formatarDataHora(v.criado_em)}</td>
                                        <td>{v.cliente_nome}</td>
                                        <td className="agendamento-valor">{formatarValor(v.total)}</td>
                                        <td>
                                            <span className={`agendamento-status ${getStatusClass(v.status_pagamento)}`}>
                                                {v.status_pagamento}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}

export default DashboardAtendente;