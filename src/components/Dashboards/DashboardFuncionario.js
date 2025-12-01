import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import './Dashboard.css';

function DashboardFuncionario({ userData, onLogout, onNavigateToHome }) {

    const [meusAgendamentos, setMeusAgendamentos] = useState([]);
    const [meusAtendimentos, setMeusAtendimentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filtros de data para o histórico
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    const minhasEspecialidades = userData?.especialidades || [];
    const meuId = userData?.id;
    const [loadingAction, setLoadingAction] = useState(null);

    // Identifica se é veterinário
    const isVeterinario = userData?.cargo_id === 3 || userData?.cargo === 'Veterinário';

    const fetchDados = async () => {
        setLoading(true);
        setError('');
        if (!meuId) {
             setError("Não foi possível identificar o funcionário logado.");
             setLoading(false);
             return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Token não encontrado.");

            const config = { headers: { 'Authorization': `Bearer ${token}` } };

            // LÓGICA CONDICIONAL BASEADA NO CARGO

            if (isVeterinario) {
                // VETERINÁRIO: Busca APENAS o histórico (com filtros se houver)
                let url = '/historico/meus-atendimentos';
                if (dataInicio && dataFim) {
                    url += `?data_inicio=${dataInicio}&data_fim=${dataFim}`;
                }

                const resHistorico = await axios.get(url, config);
                setMeusAtendimentos(resHistorico.data || []);
                setMeusAgendamentos([]); // Limpa agendamentos futuros para garantir

            } else {
                // OUTROS FUNCIONÁRIOS (ex: Banho e Tosa): Busca Próximos Agendamentos
                const response = await axios.get('/agendamentos/proximos', config);
                const todosProximosAgendamentos = response.data || [];

                const agendamentosFiltrados = todosProximosAgendamentos.filter(ag => {
                    if (ag.funcionario_id === meuId) return true;
                    if (!ag.funcionario_id && minhasEspecialidades.includes(ag.servico_id)) return true;
                    if (!ag.funcionario_id && minhasEspecialidades.length === 0) return true;
                    return false;
                });
                setMeusAgendamentos(agendamentosFiltrados);
                setMeusAtendimentos([]); // Limpa histórico
            }

        } catch (err) {
            console.error("Erro ao buscar dados:", err);
             if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                onLogout();
            } else {
                setError('Erro ao carregar dados do painel.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Inicialização: Define datas padrão para o mês atual se for veterinário
    useEffect(() => {
        if (isVeterinario) {
            const hoje = new Date();
            const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

            setDataInicio(primeiroDia.toISOString().split('T')[0]);
            setDataFim(ultimoDia.toISOString().split('T')[0]);
        }
    }, [isVeterinario]);

    useEffect(() => {
        // Só busca quando tivermos o ID e (se for vet) as datas iniciais definidas
        if (meuId && (!isVeterinario || (isVeterinario && dataInicio))) {
            fetchDados();
        }
    }, [meuId, isVeterinario, dataInicio, dataFim]); // Recarrega se mudar datas

    const formatarDataHora = (isoString) => {
        if (!isoString) return '-';
        const data = new Date(isoString);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const handleAssumir = async (agendamentoId) => {
        setLoadingAction(agendamentoId);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`/agendamentos/${agendamentoId}/assumir`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMeusAgendamentos(prev => prev.map(ag => ag.id === agendamentoId ? { ...ag, funcionario_id: response.data.funcionario_id } : ag));
        } catch (err) {
            alert(err.response?.data?.detail || "Erro ao assumir.");
        } finally {
            setLoadingAction(null);
        }
    };

    const handleMudarStatus = async (agendamentoId, novoStatus) => {
        if (!window.confirm(`Confirmar status "${novoStatus}"?`)) return;
        setLoadingAction(agendamentoId);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/agendamentos/${agendamentoId}/status-manual`,
                { status: novoStatus },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            fetchDados();
        } catch (err) {
            alert(err.response?.data?.detail || "Erro ao atualizar status.");
        } finally {
            setLoadingAction(null);
        }
    };

    if (loading && !meusAtendimentos.length && !meusAgendamentos.length) {
        return <div className="loading-message">Carregando painel...</div>;
    }

    return (
        <div className="dashboard-container">
            <main className="dashboard-main" style={{ gridColumn: '1 / -1' }}>
                 <div className="agendamentos-header">
                    <h2>Painel do {isVeterinario ? 'Veterinário' : 'Funcionário'}</h2>
                    <p>{isVeterinario
                        ? 'Consulte o histórico de consultas realizadas.'
                        : 'Gerencie seus próximos agendamentos.'}
                    </p>
                 </div>

                 {error && <div className="error-message">{error}</div>}

                 {/* --- VISÃO PARA VETERINÁRIO: Apenas Histórico --- */}
                 {isVeterinario && (
                    <>
                        <div className="table-filters" style={{
                            display: 'flex', gap: '1rem', alignItems: 'center',
                            background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem'
                        }}>
                            <div>
                                <label style={{fontWeight: 'bold', marginRight: '0.5rem'}}>De:</label>
                                <input
                                    type="date"
                                    value={dataInicio}
                                    onChange={(e) => setDataInicio(e.target.value)}
                                    className="form-input"
                                    style={{padding: '0.4rem'}}
                                />
                            </div>
                            <div>
                                <label style={{fontWeight: 'bold', marginRight: '0.5rem'}}>Até:</label>
                                <input
                                    type="date"
                                    value={dataFim}
                                    onChange={(e) => setDataFim(e.target.value)}
                                    className="form-input"
                                    style={{padding: '0.4rem'}}
                                />
                            </div>
                            <button
                                className="btn-submit"
                                onClick={fetchDados}
                                style={{width: 'auto', padding: '0.5rem 1.5rem', marginTop: '0'}}
                            >
                                Filtrar
                            </button>
                        </div>

                        <h3>✅ Consultas Realizadas</h3>
                        {meusAtendimentos.length === 0 ? (
                            <div className="no-agendamentos">
                                <p>Nenhum atendimento encontrado no período selecionado.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="agendamentos-table gestor-table">
                                    <thead>
                                        <tr>
                                            <th>Data/Hora</th>
                                            <th>Pet</th>
                                            <th>Tutor</th>
                                            <th>Serviço</th>
                                            <th>Resumo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {meusAtendimentos.map(hist => (
                                            <tr key={hist.id}>
                                                <td className="agendamento-data">{formatarDataHora(hist.data_hora)}</td>
                                                <td style={{fontWeight: 'bold'}}>{hist.pet_nome}</td>
                                                <td>{hist.cliente_nome}</td>
                                                <td>{hist.tipo_servico}</td>
                                                <td>{hist.resumo}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                 )}

                 {/* --- VISÃO PARA OUTROS FUNCIONÁRIOS: Agendamentos Futuros --- */}
                 {!isVeterinario && (
                    <>
                        <h3>📅 Próximos Agendamentos</h3>
                        {meusAgendamentos.length === 0 ? (
                            <div className="no-agendamentos">
                                <p>Você não tem agendamentos pendentes no momento.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                                <table className="agendamentos-table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Serviço</th>
                                            <th>Cliente / Pet</th>
                                            <th>Atribuído</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {meusAgendamentos.map(ag => (
                                            <tr key={ag.id}>
                                                <td className="agendamento-data">{formatarDataHora(ag.data_hora_inicio)}</td>
                                                <td>{ag.servico_nome}</td>
                                                <td>{ag.cliente_nome} / {ag.pet_nome}</td>
                                                <td>
                                                    {ag.funcionario_id === meuId
                                                        ? <span style={{color: 'green'}}>Sim (Você)</span>
                                                        : <span style={{color: 'orange'}}>Disponível</span>}
                                                </td>
                                                <td className="cell-actions">
                                                    <div style={{display: 'flex', gap: '5px'}}>
                                                        {ag.funcionario_id === null ? (
                                                            <button className="btn-submit" style={{padding: '5px 10px', fontSize: '0.8rem', background: '#27ae60', width: 'auto'}}
                                                                onClick={() => handleAssumir(ag.id)} disabled={loadingAction === ag.id}>
                                                                Assumir
                                                            </button>
                                                        ) : ag.funcionario_id === meuId ? (
                                                            <>
                                                                <button className="btn-submit" style={{padding: '5px 10px', fontSize: '0.8rem', background: '#3498db', width: 'auto'}}
                                                                    onClick={() => handleMudarStatus(ag.id, 'Realizado')} disabled={loadingAction === ag.id} title="Marcar como Realizado">
                                                                    ✓
                                                                </button>
                                                                <button className="btn-submit" style={{padding: '5px 10px', fontSize: '0.8rem', background: '#e67e22', width: 'auto'}}
                                                                    onClick={() => handleMudarStatus(ag.id, 'C/ Ausência')} disabled={loadingAction === ag.id} title="Marcar como Ausente">
                                                                    ⚠
                                                                </button>
                                                            </>
                                                        ) : (<span>—</span>)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                 )}
            </main>
        </div>
    );
}

export default DashboardFuncionario;