import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
// Reutilizaremos o CSS do Dashboard do cliente por enquanto
import './Dashboard.css';

function DashboardFuncionario({ userData, onLogout, onNavigateToHome }) {

    // Estado para guardar os agendamentos relevantes para este funcionário
    const [meusAgendamentos, setMeusAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Assume que userData.especialidades é um array de IDs [1, 5, ...]
    // Se não vier do App.js, precisaríamos buscar aqui com /funcionario/{userData.id}
    const minhasEspecialidades = userData?.especialidades || [];
    const meuId = userData?.id;

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

                // Busca TODOS os próximos agendamentos (a filtragem será feita no frontend)
                // Rota /proximos
                const response = await axios.get('/agendamentos/proximos', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const todosProximosAgendamentos = response.data || [];

                // --- FILTRAGEM (REQ 4) ---
                const agendamentosFiltrados = todosProximosAgendamentos.filter(ag => {
                    // Caso 1: Agendamento está diretamente atribuído a mim
                    if (ag.funcionario_id === meuId) {
                        return true;
                    }
                    // Caso 2: Agendamento NÃO tem funcionário E o serviço é minha especialidade
                    if (ag.funcionario_id === null || ag.funcionario_id === undefined) {
                        // Verifica se o ID do serviço do agendamento está na minha lista
                        if (minhasEspecialidades.includes(ag.servico_id)) {
                            return true;
                        }
                    }
                    // Caso 3: Funcionário "Serviços Gerais" (sem especialidades)?
                    // Se o funcionário não tem especialidades E o agendamento está sem funcionário
                    // Mostra o agendamento? (Vamos implementar isso)
                    if (ag.funcionario_id === null || ag.funcionario_id === undefined) {
                         if (minhasEspecialidades.length === 0) {
                              // Se eu sou "Serviços Gerais", vejo todos os agendamentos não atribuídos
                              return true;
                         }
                    }

                    // Se não caiu em nenhum caso acima, não mostra
                    return false;
                });
                // --- FIM DA FILTRAGEM ---

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
    // Depende do ID do usuário e do comprimento das especialidades (caso mudem)
    }, [meuId, minhasEspecialidades.length, onLogout]);

    // Função para formatar a data (igual ao Dashboard do cliente)
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

    if (loading) {
        return <div className="loading-message">Carregando seus agendamentos...</div>;
    }

    if (error && !loading) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="dashboard-container"> {/* Reutiliza o container principal */}

            {/* Poderíamos ter uma sidebar aqui também, se necessário */}

            {/* Conteúdo Principal */}
            <main className="dashboard-main" style={{ gridColumn: '1 / -1' }}> {/* Ocupa toda a largura */}
                 <div className="agendamentos-header">
                    <h2>Meus Próximos Agendamentos</h2>
                    <p>Agendamentos atribuídos a você ou de suas especialidades.</p>
                    {/* Poderíamos adicionar filtros de data aqui também, se útil */}
                 </div>

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
                                    <th>Atribuído</th> {/* Mostra se foi direto ou por especialidade */}
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
                                            {/* Idealmente teríamos link para detalhes do cliente */}
                                            {ag.cliente_nome}
                                        </td>
                                        <td>
                                            <span className="agendamento-pet">{ag.pet_nome}</span>
                                        </td>
                                        <td>
                                            {ag.funcionario_id === meuId
                                                ? <span style={{color: 'green', fontWeight: 'bold'}}>Sim (Direto)</span>
                                                : <span style={{color: 'orange'}}>Não (Especialidade/Geral)</span>
                                            }
                                        </td>
                                        {/* Funcionários não têm botões de ação aqui */}
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