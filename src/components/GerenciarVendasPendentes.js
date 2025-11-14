import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import VendaDetalhesModal from './VendaDetalhesModal'; // <--- IMPORTAR O MODAL
import './Dashboard.css';
import './DashboardGestor.css';

// Ícone de Olho (Visualizar)
const IconEye = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

function GerenciarVendasPendentes({ onBack }) {
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loadingAction, setLoadingAction] = useState(null);

    // Estado para o Modal de Detalhes
    const [vendaSelecionada, setVendaSelecionada] = useState(null);

    const formatarValor = (valor) => {
        return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatarDataHora = (isoString) => {
        if (!isoString) return '-';
        const data = new Date(isoString);
        return data.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const carregarVendas = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('/vendas/?status=Pendente');
            let lista = [];
            if (Array.isArray(res.data)) {
                lista = res.data;
            } else if (res.data && Array.isArray(res.data.data)) {
                lista = res.data.data;
            }
            setVendas(lista);
        } catch (err) {
            console.error("Erro ao carregar vendas:", err);
            setError("Erro ao carregar vendas pendentes. Verifique sua conexão.");
            setVendas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarVendas();
    }, []);

    const atualizarStatus = async (vendaId, novoStatus) => {
        const acao = novoStatus === 'Pago' ? 'Confirmar Pagamento' : 'Cancelar Venda';
        if (!window.confirm(`Tem certeza que deseja "${acao}" para a Venda #${vendaId}? Esta ação não pode ser desfeita.`)) return;

        setLoadingAction(vendaId);
        setError('');

        try {
            await axios.put(`/vendas/${vendaId}/status`, { status: novoStatus });
            alert(`Venda #${vendaId} atualizada para ${novoStatus} com sucesso!`);
            setVendas(prev => prev.filter(v => v.id !== vendaId));
        } catch (err) {
            setError(err.response?.data?.detail || "Erro ao atualizar status da venda.");
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="dashboard-container">
            {/* Renderiza o Modal se houver venda selecionada */}
            <VendaDetalhesModal
                venda={vendaSelecionada}
                onClose={() => setVendaSelecionada(null)}
            />

            <div className="dashboard-gestor-header">
                <h1>Caixa - Vendas Pendentes</h1>
                <p>Confirme o pagamento ou cancele as vendas registradas no balcão.</p>
            </div>

            <button className="btn-submit" onClick={onBack} style={{width: 'auto', background: '#6c757d', marginBottom: '1rem'}}>
                ← Voltar ao Dashboard
            </button>

            {error && <div className="error-message" style={{marginBottom: '1rem'}}>{error}</div>}

            <main className="dashboard-main">
                <h2>Fila de Vendas Aguardando Ação</h2>
                {loading ? <div className="loading-message">Carregando...</div> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="agendamentos-table gestor-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Data</th>
                                    <th>Cliente</th>
                                    <th>Atendente</th>
                                    <th style={{textAlign: 'center'}}>Itens</th> {/* Centralizado */}
                                    <th>Total</th>
                                    <th>Pgto</th>
                                    <th style={{width: '240px'}}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(!vendas || vendas.length === 0) ? (
                                    <tr><td colSpan="8" style={{textAlign: 'center', padding: '2rem'}}>Nenhuma venda pendente no momento.</td></tr>
                                ) : (
                                    vendas.map(v => (
                                        <tr key={v.id}>
                                            <td style={{fontWeight: 'bold'}}>#{v.id}</td>
                                            <td className="agendamento-data">{formatarDataHora(v.criado_em)}</td>
                                            <td>{v.cliente_nome || 'N/A'}</td>
                                            <td>{v.funcionario_nome || 'N/A'}</td>

                                            {/* Coluna de Itens agora é um botão */}
                                            <td style={{textAlign: 'center'}}>
                                                <button
                                                    className="action-btn"
                                                    style={{background: '#e0f2fe', color: '#0284c7', margin: '0 auto'}}
                                                    onClick={() => setVendaSelecionada(v)}
                                                    title="Ver lista de produtos"
                                                >
                                                    <IconEye />
                                                </button>
                                            </td>

                                            <td className="agendamento-valor">{formatarValor(v.total)}</td>
                                            <td>{v.forma_pagamento}</td>
                                            <td className="cell-actions">
                                                <div className="action-buttons" style={{justifyContent: 'center'}}>
                                                    <button
                                                        className="btn-submit"
                                                        style={{padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#27ae60'}}
                                                        onClick={() => atualizarStatus(v.id, 'Pago')}
                                                        disabled={loadingAction === v.id}
                                                    >
                                                        Confirmar
                                                    </button>
                                                    <button
                                                        className="btn-submit"
                                                        style={{padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#c0392b'}}
                                                        onClick={() => atualizarStatus(v.id, 'Cancelado')}
                                                        disabled={loadingAction === v.id}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}

export default GerenciarVendasPendentes;