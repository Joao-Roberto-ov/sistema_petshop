import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import VendaDetalhesModal from './VendaDetalhesModal';
import './Dashboard.css';
import './DashboardGestor.css';

// Ícone de Olho (Visualizar)
const IconEye = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

// --- MODAL DE RECIBO/SUCESSO (Transferido para o Caixa) ---
const ModalReciboCaixa = ({ isOpen, vendaId, onClose }) => {
    if (!isOpen) return null;

    const handleVisualizarPDF = () => {
        const backendBaseURL = 'http://localhost:8000/api';
        const url = `${backendBaseURL}/vendas/${vendaId}/recibo`;
        window.open(url, '_blank');
    };

    const handleEnviarEmail = async () => {
        try {
            const res = await axios.post(`/vendas/${vendaId}/recibo/enviar-email`);
            const email = res.data.email_enviado || 'do cliente';
            alert(`✅ Sucesso! O recibo da venda #${vendaId} foi enviado para ${email}.`);
        } catch (error) {
            console.error("Erro ao enviar e-mail:", error);
            let errorMessage = "Erro desconhecido ao tentar enviar o recibo.";
            if (error.response) {
                const detail = error.response.data.detail;
                if (detail) {
                    errorMessage = `Falha no envio: ${detail}`;
                } else if (error.response.status === 400) {
                    errorMessage = "Falha no envio: O cliente não tem um e-mail válido registrado ou o envio falhou."
                }
            }
            alert(`❌ Erro no envio de e-mail: ${errorMessage}`);
        }
    };

    return (
        <div className="modal-overlay-venda" style={{zIndex: 1200}}> {/* Z-index alto para sobrepor tudo */}
            <div className="modal-container-venda" style={{ textAlign: 'center', maxWidth: '400px', border: '2px solid #27ae60' }}>
                <div style={{ color: '#27ae60', marginBottom: '15px' }}>
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h3 style={{marginBottom: '10px'}}>Pagamento Confirmado!</h3>
                <p style={{color: '#666', marginBottom: '25px'}}>A venda #{vendaId} foi finalizada. <br/>O que deseja fazer?</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button className="btn-confirmar-venda" onClick={handleVisualizarPDF} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem' }}>
                        <span>📄</span> Visualizar / Imprimir Recibo
                    </button>

                    <button className="btn-cancelar-venda" onClick={handleEnviarEmail} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', background: 'white', border: '1px solid #ccc' }}>
                        <span>✉️</span> Enviar Recibo por E-mail
                    </button>
                </div>

                <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}>
                        Fechar e voltar para a lista
                    </button>
                </div>
            </div>
        </div>
    );
};

function GerenciarVendasPendentes({ onBack }) {
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loadingAction, setLoadingAction] = useState(null);

    // Estado para o Modal de Detalhes
    const [vendaSelecionada, setVendaSelecionada] = useState(null);

    // Estado para o Modal de Recibo (Novo)
    const [vendaPagaId, setVendaPagaId] = useState(null);

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
        if (!window.confirm(`Tem certeza que deseja "${acao}" para a Venda #${vendaId}?`)) return;

        setLoadingAction(vendaId);
        setError('');

        try {
            await axios.put(`/vendas/${vendaId}/status`, { status: novoStatus });

            // Remove da lista visualmente
            setVendas(prev => prev.filter(v => v.id !== vendaId));

            if (novoStatus === 'Pago') {
                // Abre o modal de recibo
                setVendaPagaId(vendaId);
            } else {
                alert(`Venda #${vendaId} cancelada com sucesso.`);
            }

        } catch (err) {
            setError(err.response?.data?.detail || "Erro ao atualizar status da venda.");
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="dashboard-container">
            {/* Modal de Detalhes */}
            <VendaDetalhesModal
                venda={vendaSelecionada}
                onClose={() => setVendaSelecionada(null)}
            />

            {/* Modal de Recibo (Pós-pagamento) */}
            <ModalReciboCaixa
                isOpen={!!vendaPagaId}
                vendaId={vendaPagaId}
                onClose={() => setVendaPagaId(null)}
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
                                    <th style={{textAlign: 'center'}}>Itens</th>
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