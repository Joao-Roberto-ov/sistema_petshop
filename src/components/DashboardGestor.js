import React, { useState, useEffect, useMemo } from 'react';
import axios from '../api/axios';
import './Dashboard.css';
import './DashboardGestor.css'; // O CSS existente já é importado

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

// --- INÍCIO DA MODIFICAÇÃO (Helper de Classe CORRIGIDO) ---
const getStatusClass = (status) => {
    if (!status) return 'desconhecido';
    // Trata o caso especial "C/ Ausência"
    if (status.toLowerCase() === 'c/ ausência') {
        return 'c-ausencia';
    }
    // Trata os outros casos (ex: "pago", "pendente")
    return status.toLowerCase().replace(/[\s/]/g, '-');
};
// --- FIM DA MODIFICAÇÃO ---

function DashboardGestor({ userData, onLogout, onNavigateToHome }) {

    const [todosAgendamentos, setTodosAgendamentos] = useState([]);
    const [todasVendas, setTodasVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filtroTempo, setFiltroTempo] = useState('mes');
    const [filtroStatusAgendamento, setFiltroStatusAgendamento] = useState('todos');
    const [filtroStatusVenda, setFiltroStatusVenda] = useState('todos');
    const [filtroBuscaVendas, setFiltroBuscaVendas] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                if (!token) { throw new Error("Token não encontrado."); }

                const [respAgendamentos, respVendas] = await Promise.all([
                    axios.get('/agendamentos/todos-gestor', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    axios.get('/vendas/', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const agendamentosOrdenados = (respAgendamentos.data || []).sort((a, b) =>
                    new Date(b.data_hora_inicio) - new Date(a.data_hora_inicio)
                );
                setTodosAgendamentos(agendamentosOrdenados);

                const vendasOrdenadas = (respVendas.data || []).sort((a, b) =>
                    new Date(b.criado_em) - new Date(a.criado_em)
                );
                setTodasVendas(vendasOrdenadas);

            } catch (err) {
                console.error("Erro ao buscar dados do gestor:", err);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    setError('Sessão expirada ou acesso negado. Faça login novamente.');
                    onLogout();
                } else if (err.message === "Token não encontrado.") {
                     setError('Sessão inválida. Faça login novamente.');
                     onLogout();
                } else {
                    setError('Erro ao carregar os dados.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [onLogout]);

    // useMemo para Agendamentos
    const { agendamentosFiltrados, totalPrevisto, totalServicosRealizados } = useMemo(() => {
        const agora = new Date();
        const { inicio, fim } = getDataLimite(filtroTempo);

        let filtrados = todosAgendamentos;

        if (inicio && fim) {
             const inicioAjustado = filtroTempo === 'mes' ? inicio : new Date(inicio.setHours(0, 0, 0, 0));
             const fimAjustado = new Date(fim.setHours(23, 59, 59, 999));

             filtrados = todosAgendamentos.filter(ag => {
                  const dataAg = new Date(ag.data_hora_inicio);
                  return dataAg >= inicioAjustado && dataAg <= fimAjustado;
             });
        }

        if (filtroStatusAgendamento !== 'todos') {
             filtrados = filtrados.filter(ag => ag.status.toLowerCase() === filtroStatusAgendamento.toLowerCase());
        }

        let previsto = 0;
        let realizado = 0;

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

        return { agendamentosFiltrados: filtrados, totalPrevisto: previsto, totalServicosRealizados: realizado };

    }, [todosAgendamentos, filtroTempo, filtroStatusAgendamento]);

    // useMemo para Vendas
    const { vendasFiltradas, totalVendasPagas } = useMemo(() => {
        const { inicio, fim } = getDataLimite(filtroTempo);

        let vendasParaCalculo = todasVendas;

        if (inicio && fim) {
            const inicioAjustado = filtroTempo === 'mes' ? inicio : new Date(inicio.setHours(0, 0, 0, 0));
            const fimAjustado = new Date(fim.setHours(23, 59, 59, 999));

            vendasParaCalculo = todasVendas.filter(v => {
                const dataVenda = new Date(v.criado_em);
                return dataVenda >= inicioAjustado && dataVenda <= fimAjustado;
            });
        }

        const totalPagas = vendasParaCalculo
            .filter(v => v.status_pagamento === 'pago')
            .reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);

        const filtradas = vendasParaCalculo.filter(v => {
            if (filtroStatusVenda !== 'todos' && v.status_pagamento.toLowerCase() !== filtroStatusVenda.toLowerCase()) {
                return false;
            }
            if (filtroBuscaVendas) {
                const f = filtroBuscaVendas.toLowerCase();
                return (
                    (v.cliente_nome && v.cliente_nome.toLowerCase().includes(f)) ||
                    (v.funcionario_nome && v.funcionario_nome.toLowerCase().includes(f)) ||
                    (v.forma_pagamento && v.forma_pagamento.toLowerCase().includes(f))
                );
            }
            return true;
        });

        return { vendasFiltradas: filtradas, totalVendasPagas: totalPagas };

    }, [todasVendas, filtroTempo, filtroStatusVenda, filtroBuscaVendas]);


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
                    <h3>Serviços Previstos ({filtroTempo === 'todos' ? 'Total Futuro' : filtroTempo})</h3>
                    <p>{formatarValor(totalPrevisto)}</p>
                    <span>Agendamentos futuros</span>
                </div>
                <div className="card card-realizado">
                    <h3>Serviços Concluídos ({filtroTempo})</h3>
                    <p>{formatarValor(totalServicosRealizados)}</p>
                    <span>Agendamentos (status Realizado)</span>
                </div>
                <div className="card card-realizado">
                    <h3>Vendas Pagas ({filtroTempo})</h3>
                    <p>{formatarValor(totalVendasPagas)}</p>
                    <span>Checkout + Balcão (status Pago)</span>
                </div>
                 <div className="card card-total-agendamentos">
                    <h3>Agendamentos ({filtroTempo})</h3>
                    <p>{agendamentosFiltrados.length}</p>
                    <span>Listados abaixo ({filtroStatusAgendamento})</span>
                </div>
            </div>


            <div className="table-filters">
                 <div>
                    <label>Período (Geral):</label>
                    <select value={filtroTempo} onChange={(e) => setFiltroTempo(e.target.value)}>
                        <option value="7dias">Próximos 7 dias</option>
                        <option value="14dias">Próximos 14 dias</option>
                        <option value="mes">Mês Atual</option>
                        <option value="todos">Todos</option>
                    </select>
                </div>
            </div>

            {/* Tabela de Agendamentos */}
             <main className="dashboard-main" style={{ marginTop: '2rem' }}>
                <h2>Lista de Agendamentos ({filtroTempo})</h2>

                <div className="table-filters" style={{ maxWidth: '400px', marginTop: '1rem' }}>
                    <div>
                        <label>Status Agendamento:</label>
                        <select value={filtroStatusAgendamento} onChange={(e) => setFiltroStatusAgendamento(e.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="Agendado">Agendado</option>
                            <option value="Realizado">Realizado</option>
                            <option value="Cancelado">Cancelado</option>
                            <option value="C/ Ausência">C/ Ausência</option>
                        </select>
                    </div>
                </div>

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
                                    <tr key={ag.id} className={`status-${getStatusClass(ag.status)}`}>
                                        <td className="agendamento-data">
                                            {formatarDataHora(ag.data_hora_inicio)}
                                        </td>
                                        <td>{ag.cliente_nome}</td>
                                        <td>{ag.pet_nome}</td>
                                        <td className="agendamento-servico">{ag.servico_nome}</td>
                                        <td>{ag.funcionario_nome || <span style={{ fontStyle: 'italic', color: '#888' }}>N/A</span>}</td>
                                        <td className="agendamento-valor">{formatarValor(ag.servico_preco)}</td>
                                        <td>
                                            <span className={`agendamento-status ${getStatusClass(ag.status)}`}>
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

            {/* Tabela de Vendas */}
            <main className="dashboard-main" style={{ marginTop: '2rem' }}>
                <h2>Lista de Vendas e Compras ({filtroTempo})</h2>

                <div className="table-filters" style={{ maxWidth: '800px', display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ flex: '2 1 300px' }}>
                        <label>Buscar Vendas:</label>
                        <input
                            type="text"
                            placeholder="Cliente, funcionário, pgto..."
                            className="form-input"
                            value={filtroBuscaVendas}
                            onChange={(e) => setFiltroBuscaVendas(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <label>Status Venda:</label>
                        <select
                            value={filtroStatusVenda}
                            onChange={(e) => setFiltroStatusVenda(e.target.value)}
                            style={{ width: '100%' }}
                            className="form-input"
                        >
                            <option value="todos">Todos</option>
                            <option value="pago">Pago</option>
                            <option value="pendente">Pendente</option>
                        </select>
                    </div>
                </div>


                {vendasFiltradas.length === 0 ? (
                    <div className="no-agendamentos">
                        <p>Nenhuma venda encontrada para os filtros selecionados.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="agendamentos-table gestor-table">
                            <thead>
                                <tr>
                                    <th>Data / Hora</th>
                                    <th>Cliente</th>
                                    <th>Funcionário (Balcão)</th>
                                    <th>Forma Pgto.</th>
                                    <th>Total (R$)</th>
                                    <th>Status Pgto.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendasFiltradas.map(v => (
                                    <tr key={v.id} className={`status-${getStatusClass(v.status_pagamento)}`}>
                                        <td className="agendamento-data">
                                            {formatarDataHora(v.criado_em)}
                                        </td>
                                        <td>{v.cliente_nome}</td>
                                        <td>{v.funcionario_nome}</td>
                                        <td>{v.forma_pagamento}</td>
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

export default DashboardGestor;