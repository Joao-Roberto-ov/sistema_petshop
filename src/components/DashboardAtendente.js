import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './Dashboard.css';
import './DashboardGestor.css';

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

    // Função auxiliar para extrair dados com segurança
    const extrairDados = (response) => {
        if (response && Array.isArray(response.data)) {
            return response.data;
        }
        if (response && response.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        return [];
    };

    useEffect(() => {
        const carregarDados = async () => {
            // Só carrega se tiver o ID do usuário
            if (!userData || !userData.id) return;

            setLoading(true);
            setError('');

            try {
                // Executa as requisições em paralelo, mas trata erros individualmente
                const [resMinhas, resPendentes] = await Promise.all([
                    axios.get(`/vendas?funcionario_id=${userData.id}`)
                        .catch(err => {
                            console.warn("Erro ao carregar minhas vendas:", err);
                            return { data: [] };
                        }),
                    axios.get(`/vendas?status=Pendente`)
                        .catch(err => {
                            console.warn("Erro ao carregar vendas pendentes:", err);
                            return { data: [] };
                        })
                ]);

                // 1. Processa Minhas Vendas (Finalizadas)
                const dadosMinhas = extrairDados(resMinhas);
                const finalizadas = dadosMinhas.filter(v =>
                    v.status_pagamento && v.status_pagamento.toLowerCase() !== 'pendente'
                );
                setMinhasVendas(finalizadas);

                // 2. Processa Fila de Pendentes
                const dadosPendentes = extrairDados(resPendentes);
                setVendasPendentesGeral(dadosPendentes);

            } catch (err) {
                console.error("Erro crítico no Dashboard Atendente:", err);
                setError("Erro ao atualizar o painel. Tente recarregar a página.");
            } finally {
                setLoading(false);
            }
        };

        carregarDados();
    }, [userData]);

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-message">Carregando Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-gestor-header">
                <h1>Painel do Atendente</h1>
                <p>Olá, {userData?.nome || 'Colaborador'}. Aqui está o resumo das vendas.</p>
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
                                        <td>{v.cliente_nome || 'Não identificado'}</td>
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