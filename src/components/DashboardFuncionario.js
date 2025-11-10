import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './Dashboard.css';

function DashboardFuncionario({ userData, onLogout, onNavigateToHome }) {

    // Estado para guardar os agendamentos relevantes para este funcionário
    const [meusAgendamentos, setMeusAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const minhasEspecialidades = userData?.especialidades || [];
    const meuId = userData?.id;
    // --- INÍCIO DA MODIFICAÇÃO ---
    const [loadingAction, setLoadingAction] = useState(null); // Para desabilitar o botão
    // --- FIM DA MODIFICAÇÃO ---


    useEffect(() => {
        const fetchAgendamentos = async () => {
            setLoading(true);
            setError('');
            if (!meuId) {
                 setError("Não foi possível identificar o funcionário logado.");
                 setLoading(false);
                 return;
            }

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error("Token não encontrado.");
                }

                //procura todos os proximos agendamentos
                //rota /proximos
                const response = await axios.get('/agendamentos/proximos', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const todosProximosAgendamentos = response.data || [];
                const agendamentosFiltrados = todosProximosAgendamentos.filter(ag => {
                    //agendamento está diretamente atribuído ao funcionario
                    if (ag.funcionario_id === meuId) {
                        return true;
                    }
                    //agendamento nao tem funcionário e o serviço é minha especialidade
                    if (ag.funcionario_id === null || ag.funcionario_id === undefined) {
                        // Verifica se o ID do serviço do agendamento está na minha lista
                        if (minhasEspecialidades.includes(ag.servico_id)) {
                            return true;
                        }
                    }
                    //funcionário "Serviços Gerais"
                    if (ag.funcionario_id === null || ag.funcionario_id === undefined) {
                         if (minhasEspecialidades.length === 0) {
                              return true;
                         }
                    }
                    return false;
                });

                setMeusAgendamentos(agendamentosFiltrados);

            } catch (err) {
                console.error("Erro ao buscar agendamentos do funcionário:", err);
                 if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    setError('Sessão expirada ou acesso negado. Faça login novamente.');
                    // Força logout se der erro de autorização
                    onLogout();
                } else if (err.message === "Token não encontrado.") {
                     setError('Sessão inválida. Faça login novamente.');
                     onLogout();
                }
                else {
                    setError('Erro ao carregar seus próximos agendamentos.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAgendamentos();
    }, [meuId, minhasEspecialidades.length, onLogout]);

    // Função para formatar a data
    const formatarDataHora = (isoString) => {
        const data = new Date(isoString);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
        });
    };

    // Helper para nome do cargo
    const getCargoNome = (cargoId) => {
        const cargos = { 1: 'Gestor', 2: 'Funcionário', 3: 'Veterinário', 4: 'Atendente' };
        return cargos[cargoId] || 'Desconhecido';
    };

    // --- INÍCIO DA NOVA FUNÇÃO ---
    const handleAssumir = async (agendamentoId) => {
        setLoadingAction(agendamentoId);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `/agendamentos/${agendamentoId}/assumir`,
                {}, // Corpo vazio
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            // Atualiza o estado local para refletir a mudança imediatamente
            setMeusAgendamentos(prevAgendamentos =>
                prevAgendamentos.map(ag => {
                    if (ag.id === agendamentoId) {
                        return {
                            ...ag,
                            funcionario_id: response.data.funcionario_id,
                            funcionario_nome: response.data.funcionario_nome,
                        };
                    }
                    return ag;
                })
            );

        } catch (err) {
            console.error("Erro ao assumir agendamento:", err);
            // Mostra o erro de conflito (se outro funcionário assumiu)
            if (err.response?.status === 409) {
                 setError(err.response.data.detail || "Este agendamento já foi assumido.");
                 // Remove o item da lista, pois não pertence mais a este funcionário
                 setMeusAgendamentos(prev => prev.filter(ag => ag.id !== agendamentoId));
            } else {
                 setError(err.response?.data?.detail || "Erro ao assumir o agendamento.");
            }
        } finally {
            setLoadingAction(null);
        }
    };
    // --- FIM DA NOVA FUNÇÃO ---

    if (loading) {
        return <div className="loading-message">Carregando seus agendamentos...</div>;
    }

    if (error && !loading) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="dashboard-container">

            {/* Conteúdo Principal */}
            <main className="dashboard-main" style={{ gridColumn: '1 / -1' }}> {/* Ocupa toda a largura */}
                 <div className="agendamentos-header">
                    <h2>Meus Próximos Agendamentos</h2>
                    <p>Agendamentos atribuídos a você ou de suas especialidades.</p>
                 </div>

                 {/* Mensagem de erro (para o 'Assumir') */}
                 {error && <div className="error-message">{error}</div>}

                 {/* Tabela de Agendamentos */}
                 {meusAgendamentos.length === 0 ? (
                    <div className="no-agendamentos">
                        <p>Você não tem agendamentos próximos.</p>
                    </div>
                 ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="agendamentos-table">
                            <thead>
                                <tr>
                                    <th>Data / Hora</th>
                                    <th>Serviço</th>
                                    <th>Cliente</th>
                                    <th>Pet</th>
                                    <th>Atribuído</th>
                                    {/* --- INÍCIO DA MODIFICAÇÃO (TH) --- */}
                                    <th>Ações</th>
                                    {/* --- FIM DA MODIFICAÇÃO (TH) --- */}
                                </tr>
                            </thead>
                            <tbody>
                                {meusAgendamentos.map(ag => (
                                    <tr key={ag.id}>
                                        <td className="agendamento-data">
                                            {formatarDataHora(ag.data_hora_inicio)}
                                        </td>
                                        <td>
                                            <span className="agendamento-servico">{ag.servico_nome}</span>
                                        </td>
                                         <td>
                                            {ag.cliente_nome}
                                        </td>
                                        <td>
                                            <span className="agendamento-pet">{ag.pet_nome}</span>
                                        </td>
                                        <td>
                                            {/* --- LÓGICA ATUALIZADA AQUI --- */}
                                            {ag.funcionario_id === meuId ? (
                                                <span style={{color: 'green', fontWeight: 'bold'}}>Sim (Direto)</span>
                                            ) : ag.funcionario_id === null ? (
                                                <span style={{color: 'orange'}}>Não (Vago)</span>
                                            ) : (
                                                <span style={{color: '#888', fontStyle: 'italic'}}>Outro</span>
                                            )}
                                        </td>
                                        {/* --- INÍCIO DA MODIFICAÇÃO (TD) --- */}
                                        <td className="cell-actions">
                                            {ag.funcionario_id === null ? (
                                                <button
                                                    className="btn-submit"
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        fontSize: '0.8rem',
                                                        backgroundColor: '#27ae60', // Um verde
                                                        width: '100px',
                                                        minWidth: '100px'
                                                    }}
                                                    onClick={() => handleAssumir(ag.id)}
                                                    disabled={loadingAction === ag.id}
                                                >
                                                    {loadingAction === ag.id ? '...' : 'Assumir'}
                                                </button>
                                            ) : (
                                                <span>—</span>
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
    );
}

export default DashboardFuncionario;