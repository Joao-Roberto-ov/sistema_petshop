import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './Dashboard.css';

const IconTrash = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

// Ícone de Lápis
const IconPencil = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);


function Dashboard({
    userData,
    onLogout,
    onNavigateToHome,
    onIniciarReagendamento
}) {
    const [pets, setPets] = useState([]);
    const [agendamentos, setAgendamentos] = useState([]);
    const [filtroAgendamento, setFiltroAgendamento] = useState('7dias');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    onLogout();
                    return;
                }

                const [petsRes, agendamentosRes] = await Promise.all([
                    axios.get('/pets', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    axios.get('/agendamentos/meus', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const petsOrdenados = petsRes.data.sort((a, b) => a.nome.localeCompare(b.nome));
                setPets(petsOrdenados);

                const agendamentosOrdenados = agendamentosRes.data.sort((a, b) =>
                    new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio)
                );
                setAgendamentos(agendamentosOrdenados);

            } catch (err) {
                console.error("Erro ao buscar dados do dashboard:", err);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    setError('Sua sessão expirou. Por favor, faça login novamente.');
                    onLogout();
                } else {
                    setError('Erro ao carregar dados do dashboard.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    //adicionado agendamentos.length para recarregar se um item for cancelado
    }, [onLogout, agendamentos.length]);

    const formatarDataHora = (isoString) => {
        const data = new Date(isoString);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
        });
    };

    const filtrarAgendamentos = () => {
        const agora = new Date();
        let futuros = agendamentos.filter(ag =>
            new Date(ag.data_hora_inicio) > agora && ag.status === 'Agendado'
        );

        if (filtroAgendamento === 'todos') {
            return futuros;
        }
        const dataLimite = new Date(agora);
        if (filtroAgendamento === '7dias') {
            dataLimite.setDate(agora.getDate() + 7);
        } else if (filtroAgendamento === '14dias') {
            dataLimite.setDate(agora.getDate() + 14);
        } else if (filtroAgendamento === 'mes') {
            dataLimite.setMonth(agora.getMonth() + 1);
            dataLimite.setDate(0);
        }
        return futuros.filter(ag => new Date(ag.data_hora_inicio) <= dataLimite);
    };

    const agendamentosFiltrados = filtrarAgendamentos();
    const handleCancelar = async (agendamento) => {
        const agora = new Date();
        const dataInicio = new Date(agendamento.data_hora_inicio);
        const diffHoras = (dataInicio.getTime() - agora.getTime()) / (1000 * 60 * 60);

        let aviso = "Tem certeza que deseja cancelar este agendamento?";
        if (diffHoras <= 24) {
            aviso += "\n\nAtenção: O cancelamento está a menos de 24h do horário. O estorno do valor não será automático.";
        } else {
            aviso += "\n\nVocê está cancelando com mais de 24h de antecedência e é elegível para estorno.";
        }

        if (window.confirm(aviso)) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.put(
                    `/agendamentos/${agendamento.id}/cancelar`,
                    {},
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                alert(response.data.message || "Agendamento cancelado.");
                setAgendamentos(prev =>
                    prev.map(ag =>
                        ag.id === agendamento.id ? { ...ag, status: 'Cancelado', status_motivo: response.data.motivo } : ag
                    )
                );
            } catch (err) {
                console.error("Erro ao cancelar:", err);
                alert(err.response?.data?.detail || "Não foi possível cancelar o agendamento.");
            }
        }
    };

    const handleReagendar = (agendamento) => {
        onIniciarReagendamento(agendamento);
    };

    if (loading) {
        return (
             <div className="dashboard-container">
                 <div className="loading-message">Carregando Dashboard...</div>
             </div>
        );
    }

    if (error && !loading) {
         return (
             <div className="dashboard-container">
                 <div className="error-message">{error}</div>
             </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-grid">

                <aside className="dashboard-sidebar">
                    <div className="info-card">
                        <h2>Olá, {userData?.nome ? userData.nome.split(' ')[0] : 'Usuário'}!</h2>
                        <p>{userData?.email}</p>
                        <h3>Meus Pets</h3>
                        {pets.length > 0 ? (
                            <ul className="pets-list">
                                {pets.map(pet => (
                                    <li key={pet.id}>
                                        <strong>{pet.nome}</strong> <span>({pet.raca})</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Nenhum pet cadastrado.</p>
                        )}
                    </div>
                </aside>

                <main className="dashboard-main">
                    <div className="agendamentos-header">
                        <h2>Próximos Agendamentos</h2>
                        <div className="filter-buttons">
                            <button
                                className={`filter-btn ${filtroAgendamento === '7dias' ? 'active' : ''}`}
                                onClick={() => setFiltroAgendamento('7dias')}>
                                Próximos 7 dias
                            </button>
                            <button
                                className={`filter-btn ${filtroAgendamento === '14dias' ? 'active' : ''}`}
                                onClick={() => setFiltroAgendamento('14dias')}>
                                Próximos 14 dias
                            </button>
                            <button
                                className={`filter-btn ${filtroAgendamento === 'mes' ? 'active' : ''}`}
                                onClick={() => setFiltroAgendamento('mes')}>
                                No Mês
                            </button>
                            <button
                                className={`filter-btn ${filtroAgendamento === 'todos' ? 'active' : ''}`}
                                onClick={() => setFiltroAgendamento('todos')}>
                                Todos
                            </button>
                        </div>
                    </div>

                    {agendamentosFiltrados.length === 0 ? (
                        <div className="no-agendamentos">
                            <p>Sem agendamentos próximos para o período selecionado.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="agendamentos-table">
                                <thead>
                                    <tr>
                                        <th>Data / Hora</th>
                                        <th>Serviço</th>
                                        <th>Pet</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agendamentosFiltrados.map(ag => (
                                        <tr key={ag.id}>
                                            <td className="agendamento-data">
                                                {formatarDataHora(ag.data_hora_inicio)}
                                            </td>
                                            <td>
                                                <span className="agendamento-servico">{ag.servico_nome}</span>
                                            </td>
                                            <td>
                                                <span className="agendamento-pet">{ag.pet_nome}</span>
                                            </td>
                                            <td>
                                                <span className={`agendamento-status ${ag.status.toLowerCase()}`}>
                                                    {ag.status}
                                                </span>
                                            </td>
                                            <td>
                                                {ag.status === 'Agendado' && (
                                                    <div className="action-buttons">
                                                        <button
                                                            className="action-btn btn-cancelar"
                                                            onClick={() => handleCancelar(ag)}
                                                            title="Cancelar Agendamento"
                                                        >
                                                            <IconTrash />
                                                        </button>
                                                        <button
                                                            className="action-btn btn-reagendar"
                                                            onClick={() => handleReagendar(ag)}
                                                            title="Reagendar"
                                                        >
                                                            <IconPencil />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default Dashboard;