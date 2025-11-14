import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './Dashboard.css'; // Reutilizando estilos
import './DashboardGestor.css';

function GerenciarVendasPendentes({ onBack }) {
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loadingAction, setLoadingAction] = useState(null); // ID da venda sendo processada

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
            // (Req 6) Busca apenas vendas Pendentes
            const res = await axios.get('/vendas?status=Pendente');
            setVendas(res.data);
        } catch (err) {
            setError("Erro ao carregar vendas pendentes.");
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

        setLoadingAction(vendaId); // Desabilita botões da linha
        setError('');

        try {
            await axios.put(`/vendas/${vendaId}/status`, { status: novoStatus });

            // (Req 3) Se foi 'Pago', o backend deu baixa no estoque e criou agendamentos
            alert(`Venda #${vendaId} atualizada para ${novoStatus} com sucesso!`);

            // Remove da lista local (pois não está mais pendente)
            setVendas(vendas.filter(v => v.id !== vendaId));

        } catch (err) {
            setError(err.response?.data?.detail || "Erro ao atualizar status da venda.");
        } finally {
            setLoadingAction(null); // Reabilita botões
        }
    };

    return (
        <div className="dashboard-container">
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
                {loading ? <p>Carregando...</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="agendamentos-table gestor-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Data</th>
                                    <th>Cliente</th>
                                    <th>Atendente</th>
                                    <th>Total</th>
                                    <th>Pgto</th>
                                    <th style={{width: '240px'}}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendas.length === 0 ? (
                                    <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>Nenhuma venda pendente no momento.</td></tr>
                                ) : (
                                    vendas.map(v => (
                                        <tr key={v.id}>
                                            <td style={{fontWeight: 'bold'}}>#{v.id}</td>
                                            <td className="agendamento-data">{formatarDataHora(v.criado_em)}</td>
                                            <td>{v.cliente_nome || 'N/A'}</td>
                                            <td>{v.funcionario_nome || 'N/A'}</td>
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
                                                        Confirmar Pagamento
                                                    </button>
                                                    <button
                                                        className="btn-submit"
                                                        style={{padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#c0392b'}}
                                                        onClick={() => atualizarStatus(v.id, 'Cancelado')}
                                                        disabled={loadingAction === v.id}
                                                    >
                                                        Cancelar Venda
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