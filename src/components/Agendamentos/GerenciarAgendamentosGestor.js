import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import '../Dashboards/Dashboard.css';
import '../Dashboards/DashboardGestor.css';

// Ícones
const IconTrash = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);
const IconPencil = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

// Função helper para formatar data
const formatarDataHora = (isoString) => {
    if (!isoString) return '-';
    const data = new Date(isoString);
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
    });
};

function GerenciarAgendamentosGestor({ userData, onNavigateToHome, onIniciarReagendamento }) {

    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtro, setFiltro] = useState(''); // Filtro de busca

    useEffect(() => {
        fetchAgendamentos();
    }, []);

    const fetchAgendamentos = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            if (!token) { throw new Error("Token não encontrado."); }

            // Usamos a rota /proximos que já busca agendamentos futuros e ativos
            const response = await axios.get('/agendamentos/proximos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Ordena por data (mais próximos primeiro)
            const agendamentosOrdenados = (response.data || []).sort((a, b) =>
                new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio)
            );
            setAgendamentos(agendamentosOrdenados);

        } catch (err) {
            console.error("Erro ao buscar agendamentos:", err);
            setError(err.response?.data?.detail || 'Erro ao carregar agendamentos.');
        } finally {
            setLoading(false);
        }
    };

    // Lógica de Cancelamento (Chama a nova rota de admin)
    const handleCancelar = async (agendamento) => {
        if (window.confirm(`Tem certeza que deseja cancelar o agendamento de "${agendamento.servico_nome}" para ${agendamento.cliente_nome}?`)) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.put(
                    `/agendamentos/admin/${agendamento.id}/cancelar`,
                    {},
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                alert(response.data.message || "Agendamento cancelado pelo gestor.");

                // Remove da lista local
                setAgendamentos(prev => prev.filter(ag => ag.id !== agendamento.id));

            } catch (err) {
                console.error("Erro ao cancelar (gestor):", err);
                alert(err.response?.data?.detail || "Não foi possível cancelar o agendamento.");
            }
        }
    };

    // Lógica de Reagendamento
    const handleReagendar = (agendamento) => {
        onIniciarReagendamento(agendamento);
    };

    const agendamentosFiltrados = agendamentos.filter(ag => {
        if (!filtro) return true;
        const f = filtro.toLowerCase();
        return (
            ag.cliente_nome.toLowerCase().includes(f) ||
            ag.pet_nome.toLowerCase().includes(f) ||
            ag.servico_nome.toLowerCase().includes(f) ||
            ag.funcionario_nome.toLowerCase().includes(f)
        );
    });

    if (loading) return <div className="loading-message">Carregando agendamentos...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="dashboard-container">
            <main className="dashboard-main" style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
                <div className="agendamentos-header">
                    <h2>Gerenciar Agendamentos Futuros</h2>
                    <p>Todos os agendamentos ativos no sistema.</p>
                </div>

                {/* Filtro de Busca */}
                <div className="table-filters" style={{ maxWidth: '600px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por cliente, pet, serviço ou funcionário..."
                        className="form-input"
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                </div>

                {/* Tabela de Agendamentos */}
                {agendamentosFiltrados.length === 0 ? (
                    <div className="no-agendamentos">
                        <p>{filtro ? 'Nenhum agendamento encontrado.' : 'Nenhum agendamento futuro.'}</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="agendamentos-table gestor-table">
                            <thead>
                                <tr>
                                    <th>Data / Hora</th>
                                    <th>Cliente</th>
                                    <th>Pet</th>
                                    <th>Serviço</th>
                                    <th>Funcionário</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agendamentosFiltrados.map(ag => (
                                    <tr key={ag.id}>
                                        <td className="agendamento-data">{formatarDataHora(ag.data_hora_inicio)}</td>
                                        <td>{ag.cliente_nome}</td>
                                        <td>{ag.pet_nome}</td>
                                        <td className="agendamento-servico">{ag.servico_nome}</td>
                                        <td>{ag.funcionario_nome}</td>
                                        {/* Ações do Gestor */}
                                        <td className="cell-actions">
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn btn-cancelar"
                                                    onClick={() => handleCancelar(ag)}
                                                    title="Cancelar Agendamento">
                                                    <IconTrash />
                                                </button>
                                                <button
                                                    className="action-btn btn-reagendar"
                                                    onClick={() => handleReagendar(ag)}
                                                    title="Reagendar">
                                                    <IconPencil />
                                                </button>
                                            </div>
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

export default GerenciarAgendamentosGestor;