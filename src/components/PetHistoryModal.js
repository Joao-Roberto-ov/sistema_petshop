import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './PetHistoryModal.css';

function PetHistoryModal({ pet, onClose }) {
    const [history, setHistory] = useState({ 
        consultas: [], 
        vacinas: [], 
        servicos: [],
        observacoes: [] // Novo estado para observações separadas
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState(null);
    const [isFuncionario, setIsFuncionario] = useState(false);
    const [expandedItem, setExpandedItem] = useState(null);

    const toggleDetails = (type, index) => {
        const key = `${type}-${index}`;
        setExpandedItem(expandedItem === key ? null : key);
    };

    // Função para parsear e organizar os detalhes médicos (MANTIDA COMPLETA)
    const parseMedicalDetails = (detalhes) => {
        if (!detalhes) return <p>Nenhum detalhe adicional</p>;

        const sections = {
            examesSolicitados: [],
            resultados: [],
            diagnostico: [],
            tratamento: [],
            medicamentos: [],
            observacoes: [],
            conclusao: []
        };

        const lines = detalhes.split('\n').filter(line => line.trim());

        let currentSection = 'observacoes';
        let sectionContent = [];

        lines.forEach(line => {
            const trimmedLine = line.trim();

            // Detectar seções por palavras-chave
            if (trimmedLine.match(/EXAMES? SOLICITADOS?|SOLICITAÇÕES?/i)) {
                if (sectionContent.length > 0) {
                    sections[currentSection] = [...sectionContent];
                    sectionContent = [];
                }
                currentSection = 'examesSolicitados';
            } else if (trimmedLine.match(/RESULTADOS?|RESULTADOS? OBTIDOS?/i)) {
                if (sectionContent.length > 0) {
                    sections[currentSection] = [...sectionContent];
                    sectionContent = [];
                }
                currentSection = 'resultados';
            } else if (trimmedLine.match(/DIAGNÓSTICO|DIAGNOSTICO/i)) {
                if (sectionContent.length > 0) {
                    sections[currentSection] = [...sectionContent];
                    sectionContent = [];
                }
                currentSection = 'diagnostico';
            } else if (trimmedLine.match(/TRATAMENTO|CONDUTA/i)) {
                if (sectionContent.length > 0) {
                    sections[currentSection] = [...sectionContent];
                    sectionContent = [];
                }
                currentSection = 'tratamento';
            } else if (trimmedLine.match(/MEDICAMENTOS?|POSOLOGIA/i)) {
                if (sectionContent.length > 0) {
                    sections[currentSection] = [...sectionContent];
                    sectionContent = [];
                }
                currentSection = 'medicamentos';
            } else if (trimmedLine.match(/CONCLUSÃO|CONCLUSAO|CONCLUSAO/i)) {
                if (sectionContent.length > 0) {
                    sections[currentSection] = [...sectionContent];
                    sectionContent = [];
                }
                currentSection = 'conclusao';
            } else if (trimmedLine.match(/^- |^• |^\* |^\d+\./)) {
                // É um item de lista
                sectionContent.push(trimmedLine.replace(/^(- |• |\* |\d+\.)/, '').trim());
            } else {
                sectionContent.push(trimmedLine);
            }
        });

        // Adicionar o último conteúdo
        if (sectionContent.length > 0) {
            sections[currentSection] = [...sectionContent];
        }

        return (
            <div className="medical-sections">
                {/* Exames Solicitados */}
                {sections.examesSolicitados.length > 0 && (
                    <div className="medical-subsection">
                        <h5>🧪 Exames Solicitados</h5>
                        <ul>
                            {sections.examesSolicitados.map((item, idx) => (
                                <li key={idx}>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Resultados */}
                {sections.resultados.length > 0 && (
                    <div className="medical-subsection">
                        <h5>📊 Resultados Obtidos</h5>
                        <div className="results-grid">
                            {sections.resultados.map((resultado, idx) => {
                                // Tentar extrair valores numéricos e referências
                                const match = resultado.match(/(.+?):\s*([\d.,]+)\s*(?:\(([^)]+)\))?/);
                                if (match) {
                                    const [, parametro, valor, referencia] = match;
                                    return (
                                        <div key={idx} className="result-item">
                                            <span className="parametro">{parametro.trim()}:</span>
                                            <span className="valor">{valor}</span>
                                            {referencia && (
                                                <span className="referencia">({referencia})</span>
                                            )}
                                        </div>
                                    );
                                }
                                return <div key={idx} className="result-text">{resultado}</div>;
                            })}
                        </div>
                    </div>
                )}

                {/* Diagnóstico */}
                {sections.diagnostico.length > 0 && (
                    <div className="medical-subsection">
                        <h5>🏥 Diagnóstico</h5>
                        <div className="diagnosis-content">
                            {sections.diagnostico.map((item, idx) => (
                                <p key={idx}>{item}</p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tratamento */}
                {sections.tratamento.length > 0 && (
                    <div className="medical-subsection">
                        <h5>💊 Tratamento Prescrito</h5>
                        <ul>
                            {sections.tratamento.map((item, idx) => (
                                <li key={idx}>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Medicamentos */}
                {sections.medicamentos.length > 0 && (
                    <div className="medical-subsection">
                        <h5>💊 Medicamentos</h5>
                        <ul>
                            {sections.medicamentos.map((item, idx) => (
                                <li key={idx}>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Conclusão */}
                {sections.conclusao.length > 0 && (
                    <div className="medical-subsection">
                        <h5>✅ Conclusão</h5>
                        <div className="conclusion-content">
                            {sections.conclusao.map((item, idx) => (
                                <p key={idx}>{item}</p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Observações Gerais (fallback) */}
                {sections.observacoes.length > 0 &&
                 sections.examesSolicitados.length === 0 &&
                 sections.resultados.length === 0 &&
                 sections.diagnostico.length === 0 &&
                 sections.tratamento.length === 0 &&
                 sections.medicamentos.length === 0 &&
                 sections.conclusao.length === 0 && (
                    <div className="medical-subsection">
                        <h5>📋 Detalhes</h5>
                        <div className="general-details">
                            {sections.observacoes.map((item, idx) => (
                                <p key={idx}>{item}</p>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    useEffect(() => {
        if (!pet) return;

        const fetchHistory = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');

                // Rota consolidada que agora deve retornar observacoes da nova tabela também
                const response = await axios.get(`/historico/completo/${pet.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (response.data.success) {
                    const data = response.data;
                    setHistory({
                        consultas: data.historico.filter(item =>
                            item.tipo_servico.includes('Consulta') ||
                            item.tipo_servico.includes('Exame')
                        ),
                        vacinas: data.vacinas || [],
                        // Filtra serviços que não são consulta
                        servicos: data.historico.filter(item =>
                            !item.tipo_servico.includes('Consulta') &&
                            !item.tipo_servico.includes('Exame')
                        ),
                        // Nova lista de observações vinda da tabela separada
                        observacoes: data.observacoes || []
                    });
                } else {
                    throw new Error(response.data.error || 'Erro ao carregar histórico');
                }
            } catch (err) {
                console.error('Erro ao carregar histórico:', err);
                setError('Não foi possível carregar o histórico.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [pet]);

    const getDonoNome = () => {
        if (isFuncionario && pet.dono?.nome) {
            return pet.dono.nome;
        }

        if (isFuncionario && !pet.dono?.nome) {
            return 'Cliente não identificado';
        }

        if (userData?.nome) {
            return userData.nome;
        }

        return 'Eu';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Data não informada';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.error('Erro ao formatar data:', e);
            return 'Data inválida';
        }
    };

    const formatDateShort = (dateString) => {
        if (!dateString) return 'Data não informada';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch (e) {
            console.error('Erro ao formatar data:', e);
            return 'Data inválida';
        }
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>&times;</button>
                <h2>Histórico de {pet.nome}</h2>

                <div className="pet-info">
                    <p><strong>Dono:</strong> {getDonoNome()}</p>
                    <p><strong>Espécie:</strong> {pet.tipo || 'N/A'}</p>
                    <p><strong>Raça:</strong> {pet.raca || 'N/A'}</p>
                    {pet.observacoes && (
                        <p className="pet-observations-modal">
                            <strong>Observações Gerais:</strong> {pet.observacoes}
                        </p>
                    )}
                </div>

                {loading && <div className="loading-message">Carregando histórico...</div>}
                {error && <div className="error-message">{error}</div>}

                {!loading && !error && (
                    <div className="history-sections">

                        {/* NOVA SEÇÃO: Observações Clínicas */}
                        <div className="history-section">
                            <h3>📝 Observações Clínicas</h3>
                            {history.observacoes && history.observacoes.length > 0 ? (
                                <div className="history-list">
                                    {history.observacoes.map((obs, index) => (
                                        <div key={`obs-${index}`} className="history-item observacao-item" style={{borderLeft: '4px solid #f1c40f', backgroundColor: '#fffdf0'}}>
                                            <div className="service-header">
                                                <strong className="service-name" style={{color: '#d35400'}}>{obs.titulo || 'Observação'}</strong>
                                                <span className="service-value" style={{color: '#7f8c8d', fontSize: '0.9rem'}}>
                                                    {formatDate(obs.data_criacao)}
                                                </span>
                                            </div>
                                            <div className="service-details">
                                                <p style={{margin: '0.5rem 0', whiteSpace: 'pre-wrap', color: '#333'}}>{obs.descricao}</p>
                                                <small style={{color: '#95a5a6'}}>Registrado por: {obs.funcionario_nome || 'Sistema'}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-data">Nenhuma observação registrada.</p>
                            )}
                        </div>

                        {/* Consultas Médicas */}
                        <div className="history-section">
                            <h3>📋 Consultas Médicas</h3>
                            {history.consultas && history.consultas.length > 0 ? (
                                <div className="history-list">
                                    {history.consultas.map((item, index) => {
                                        const isExpanded = expandedItem === `consulta-${index}`;
                                        return (
                                            <div key={`consulta-${index}`} className={`history-item consulta-item ${isExpanded ? 'expanded' : ''}`}>
                                                <div className="service-header">
                                                    <strong className="service-name">
                                                        {item.tipo_servico || 'Consulta'}
                                                    </strong>
                                                    <span className="service-value" onClick={() => toggleDetails('consulta', index)}>
                                                        {formatCurrency(item.valor)}
                                                        <span className="toggle-icon">{isExpanded ? '▲' : '▼'}</span>
                                                    </span>
                                                </div>
                                                <div className="service-details">
                                                    <span className="detail">
                                                        <strong>Profissional:</strong> {item.funcionario_nome || 'Não informado'}
                                                    </span>
                                                    <span className="detail">
                                                        <strong>Data:</strong> {formatDate(item.data_hora)}
                                                    </span>
                                                </div>
                                                {isExpanded && (
                                                    <div className="detailed-info">
                                                        <p><strong>Detalhes da Consulta:</strong></p>
                                                        <div className="consultation-details">
                                                            {/* Resumo Principal */}
                                                            {item.resumo && (
                                                                <div className="detail-section">
                                                                    <h4>📝 Resumo da Consulta</h4>
                                                                    <p>{item.resumo}</p>
                                                                </div>
                                                            )}

                                                            {/* Detalhes Expandidos com parsing inteligente */}
                                                            {item.detalhes && (
                                                                <div className="detail-section">
                                                                    <h4>🔍 Detalhes Completos</h4>
                                                                    <div className="medical-details">
                                                                        {parseMedicalDetails(item.detalhes)}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Informações Financeiras */}
                                                            {item.valor && (
                                                                <div className="detail-section">
                                                                    <h4>💰 Informações Financeiras</h4>
                                                                    <p><strong>Valor:</strong> {formatCurrency(item.valor)}</p>
                                                                </div>
                                                            )}

                                                            {/* Informações do Profissional */}
                                                            <div className="detail-section">
                                                                <h4>👨‍⚕️ Informações do Profissional</h4>
                                                                <p><strong>Responsável:</strong> {item.funcionario_nome || 'Não informado'}</p>
                                                                <p><strong>Data do Atendimento:</strong> {formatDate(item.data_hora)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="no-data">Nenhuma consulta médica registrada.</p>
                            )}
                        </div>

                        {/* Carteira de Vacinação */}
                        <div className="history-section">
                            <h3>💉 Carteira de Vacinação</h3>
                            {history.vacinas && history.vacinas.length > 0 ? (
                                <div className="history-list">
                                    {history.vacinas.map((vacina, index) => {
                                        const isExpanded = expandedItem === `vacina-${index}`;
                                        return (
                                            <div key={`vacina-${index}`} className={`history-item vacina-item ${isExpanded ? 'expanded' : ''}`}>
                                                <div className="service-header">
                                                    <strong className="service-name">
                                                        {vacina.nome_vacina}
                                                    </strong>
                                                    <span className="service-value vacina-status" onClick={() => toggleDetails('vacina', index)}>
                                                        Aplicada
                                                        <span className="toggle-icon">{isExpanded ? '▲' : '▼'}</span>
                                                    </span>
                                                </div>
                                                <div className="service-details">
                                                    <span className="detail">
                                                        <strong>Aplicação:</strong> {formatDateShort(vacina.data_aplicacao)}
                                                    </span>
                                                    <span className="detail">
                                                        <strong>Próxima Dose:</strong> {vacina.data_proxima_dose ? formatDateShort(vacina.data_proxima_dose) : 'Não Aplicável'}
                                                    </span>
                                                    {vacina.funcionario_nome && (
                                                        <span className="detail">
                                                            <strong>Aplicada por:</strong> {vacina.funcionario_nome}
                                                        </span>
                                                    )}
                                                </div>
                                                {isExpanded && (
                                                    <div className="detailed-info">
                                                        <p><strong>Detalhes da Vacina:</strong></p>
                                                        <ul>
                                                            <li><strong>Nome da Vacina:</strong> {vacina.nome_vacina}</li>
                                                            <li><strong>Data de Aplicação:</strong> {formatDateShort(vacina.data_aplicacao)}</li>
                                                            <li><strong>Próxima Dose:</strong> {vacina.data_proxima_dose ? formatDateShort(vacina.data_proxima_dose) : 'Vacina única'}</li>
                                                            {vacina.funcionario_nome && (
                                                                <li><strong>Aplicada por:</strong> {vacina.funcionario_nome}</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="no-data">Nenhuma vacina registrada.</p>
                            )}
                        </div>

                        {/* Serviços de Bem-Estar */}
                        <div className="history-section">
                            <h3>✨ Serviços de Bem-Estar</h3>
                            {history.servicos && history.servicos.length > 0 ? (
                                <div className="history-list">
                                    {history.servicos.map((item, index) => {
                                        const isExpanded = expandedItem === `servico-${index}`;
                                        return (
                                            <div key={`servico-${index}`} className={`history-item servico-item ${isExpanded ? 'expanded' : ''}`}>
                                                <div className="service-header">
                                                    <strong className="service-name">
                                                        {item.tipo_servico || 'Serviço'}
                                                    </strong>
                                                    <span className="service-value" onClick={() => toggleDetails('servico', index)}>
                                                        {formatCurrency(item.valor)}
                                                        <span className="toggle-icon">{isExpanded ? '▲' : '▼'}</span>
                                                    </span>
                                                </div>
                                                <div className="service-details">
                                                    <span className="detail">
                                                        <strong>Profissional:</strong> {item.funcionario_nome || 'Não informado'}
                                                    </span>
                                                    <span className="detail">
                                                        <strong>Data:</strong> {formatDate(item.data_hora)}
                                                    </span>
                                                </div>
                                                {isExpanded && (
                                                    <div className="detailed-info">
                                                        <p><strong>Detalhes do Serviço:</strong></p>
                                                        <ul>
                                                            <li><strong>Resumo:</strong> {item.resumo || 'Não informado'}</li>
                                                            <li><strong>Detalhes:</strong> {item.detalhes || 'Nenhum detalhe adicional'}</li>
                                                            {item.valor && (
                                                                <li><strong>Valor:</strong> {formatCurrency(item.valor)}</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="no-data">Nenhum serviço de bem-estar registrado.</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="modal-footer">
                    <button className="btn-close" onClick={onClose}>
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PetHistoryModal;