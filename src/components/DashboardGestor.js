import React, { useState, useEffect, useMemo } from 'react';
import axios from '../api/axios';
import './Dashboard.css';
import './DashboardGestor.css';

const formatarValor = (valor) => {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatarDataHora = (isoString) => {
    if (!isoString) return '-';
    const data = new Date(isoString);
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
    });
};

const getDataLimite = (filtro) => {
    const agora = new Date();
    const dataLimite = new Date();

    switch (filtro) {
        case '7dias':
            dataLimite.setDate(agora.getDate() + 7);
            return { inicio: agora, fim: dataLimite };
        case '14dias':
            dataLimite.setDate(agora.getDate() + 14);
            return { inicio: agora, fim: dataLimite };
        case 'mes':
            const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
            const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
             return { inicio: inicioMes, fim: fimMes };
        case 'todos':
        default:
            return { inicio: null, fim: null };
    }
};

function DashboardGestor({ userData, onLogout, onNavigateToHome }) {

    const [todosAgendamentos, setTodosAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtroTempo, setFiltroTempo] = useState('mes'); // Filtro padrão: Mês atual
    const [filtroStatus, setFiltroStatus] = useState('todos'); // Filtro de status

    useEffect(() => {
        const fetchAgendamentos = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                if (!token) { throw new Error("Token não encontrado."); }

                //
                const response = await axios.get('/agendamentos/todos-gestor', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const agendamentosOrdenados = (response.data || []).sort((a, b) =>
                    new Date(b.data_hora_inicio) - new Date(a.data_hora_inicio)
                );
                setTodosAgendamentos(agendamentosOrdenados);

            } catch (err) {
                console.error("Erro ao buscar agendamentos do gestor:", err);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    setError('Sessão expirada ou acesso negado. Faça login novamente.');
                    onLogout();
                } else if (err.message === "Token não encontrado.") {
                     setError('Sessão inválida. Faça login novamente.');
                     onLogout();
                } else {
                    setError('Erro ao carregar os agendamentos.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAgendamentos();
    }, [onLogout]);

    //calcula o total e filtra a lista para exibição
    const { agendamentosFiltrados, totalPrevisto, totalRealizado } = useMemo(() => {
        const agora = new Date();
        const { inicio, fim } = getDataLimite(filtroTempo);

        let filtrados = todosAgendamentos;

        //filtra por tempo
        if (inicio && fim) {
             const inicioAjustado = filtroTempo === 'mes' ? inicio : new Date(inicio.setHours(0, 0, 0, 0));
             const fimAjustado = new Date(fim.setHours(23, 59, 59, 999));

             filtrados = todosAgendamentos.filter(ag => {
                  const dataAg = new Date(ag.data_hora_inicio);
                  return dataAg >= inicioAjustado && dataAg <= fimAjustado;
             });
        }

        //filtra por status
        if (filtroStatus !== 'todos') {
             filtrados = filtrados.filter(ag => ag.status.toLowerCase() === filtroStatus.toLowerCase());
        }

        //calcula o total com base nos agendamentos filtrados por tempo
        let previsto = 0;
        let realizado = 0;

        //determina a base de calculo
        const agendamentosParaCalculo = (inicio && fim)
             ? todosAgendamentos.filter(ag => {
                   const dataAg = new Date(ag.data_hora_inicio);
                   const inicioAjustado = filtroTempo === 'mes' ? inicio : new Date(inicio.setHours(0, 0, 0, 0));
                   const fimAjustado = new Date(fim.setHours(23, 59, 59, 999));
                   return dataAg >= inicioAjustado && dataAg <= fimAjustado;
                })
             : todosAgendamentos;

        agendamentosParaCalculo.forEach(ag => {
            const dataAg = new Date(ag.data_hora_inicio);
            if (ag.status === 'Agendado' && dataAg > agora) {
                previsto += ag.servico_preco || 0;
            } else if (ag.status === 'Realizado') {
                realizado += ag.servico_preco || 0;
            }
        });

        return { agendamentosFiltrados: filtrados, totalPrevisto: previsto, totalRealizado: realizado };

    }, [todosAgendamentos, filtroTempo, filtroStatus]);

    if (loading) {
        return <div className="loading-message">Carregando Dashboard do Gestor...</div>;
    }

    if (error && !loading) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-gestor-header">
                <h1>Painel do Gestor</h1>
                <p>Visão geral dos agendamentos e performance.</p>
            </div>

            <div className="summary-cards">
                <div className="card card-previsto">
                    <h3>Valor Previsto ({filtroTempo === 'todos' ? 'Total Futuro' : filtroTempo})</h3>
                    <p>{formatarValor(totalPrevisto)}</p>
                    <span>Agendamentos futuros</span>
                </div>
                <div className="card card-realizado">
                    <h3>Valor Realizado ({filtroTempo})</h3>
                    <p>{formatarValor(totalRealizado)}</p>
                    <span>Agendamentos concluídos</span>
                </div>
                 <div className="card card-total-agendamentos">
                    <h3>Agendamentos ({filtroTempo})</h3>
                    <p>{agendamentosFiltrados.length}</p>
                    <span>Listados abaixo ({filtroStatus})</span>
                </div>
            </div>

            {/* Filtros da Tabela */}
            <div className="table-filters">
                 <div>
                    <label>Período:</label>
                    <select value={filtroTempo} onChange={(e) => setFiltroTempo(e.target.value)}>
                        <option value="7dias">Próximos 7 dias</option>
                        <option value="14dias">Próximos 14 dias</option>
                        <option value="mes">Mês Atual</option>
                        <option value="todos">Todos</option>
                    </select>
                </div>
                 <div>
                    <label>Status:</label>
                    <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                        <option value="todos">Todos</option>
                        <option value="Agendado">Agendado</option>
                        <option value="Realizado">Realizado</option>
                        <option value="Cancelado">Cancelado</option>
                    </select>
                </div>
            </div>

            {/* Tabela de Agendamentos (Req 6) */}
             <main className="dashboard-main" style={{ marginTop: '2rem' }}>
                <h2>Lista de Agendamentos ({filtroTempo})</h2>
                {agendamentosFiltrados.length === 0 ? (
                    <div className="no-agendamentos">
                        <p>Nenhum agendamento encontrado para os filtros selecionados.</p>
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
                                    <th>Valor (R$)</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agendamentosFiltrados.map(ag => (
                                    <tr key={ag.id} className={`status-${ag.status.toLowerCase()}`}>
                                        <td className="agendamento-data">
                                            {formatarDataHora(ag.data_hora_inicio)}
                                        </td>
                                        <td>{ag.cliente_nome}</td>
                                        <td>{ag.pet_nome}</td>
                                        <td className="agendamento-servico">{ag.servico_nome}</td>
                                        <td>{ag.funcionario_nome || <span style={{ fontStyle: 'italic', color: '#888' }}>N/A</span>}</td>
                                        <td className="agendamento-valor">{formatarValor(ag.servico_preco)}</td>
                                        <td>
                                            <span className={`agendamento-status ${ag.status.toLowerCase()}`}>
                                                {ag.status}
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

export default DashboardGestor;