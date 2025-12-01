import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import './VacinaModal.css';

function VacinaModal({ pet, onClose }) {
    const [vacinas, setVacinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('todas');

    useEffect(() => {
        if (!pet) return;

        const fetchVacinas = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                
                const response = await axios.get(`/vacinas/pet/${pet.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                
                // Processar vacinas
                const vacinasProcessadas = response.data.map(vacina => {
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    
                    const dataAplicacao = vacina.data_aplicacao ? new Date(vacina.data_aplicacao) : null;
                    const dataProxima = vacina.data_proxima_dose ? new Date(vacina.data_proxima_dose) : null;
                    
                    let status = 'pendente';
                    
                    if (!dataProxima) {
                        status = 'concluida';
                    } else {
                        dataProxima.setHours(0, 0, 0, 0);
                        if (dataProxima < hoje) {
                            status = 'atrasada';
                        } else if (dataProxima >= hoje) {
                            status = 'pendente';
                        }
                    }
                    
                    return {
                        ...vacina,
                        status: status
                    };
                });
                
                setVacinas(vacinasProcessadas);
                
            } catch (err) {
                setError('Não foi possível carregar a carteira de vacinação. Tente novamente.');
            } finally {
                setLoading(false);
            }
        };

        fetchVacinas();
    }, [pet]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Não aplicável';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch (e) {
            return 'Data inválida';
        }
    };

    const getStatusText = (vacina) => {
        switch (vacina.status) {
            case 'pendente':
                return 'Próxima dose pendente';
            case 'atrasada':
                return 'Dose em atraso';
            case 'concluida':
                return 'Vacinação em dia';
            default:
                return 'Status indefinido';
        }
    };

    const getStatusClass = (vacina) => {
        return `vacina-status ${vacina.status}`;
    };

    const getVacinasFiltradas = () => {
        switch (filter) {
            case 'pendentes':
                return vacinas.filter(v => v.status === 'pendente');
            case 'atrasadas':
                return vacinas.filter(v => v.status === 'atrasada');
            case 'concluidas':
                return vacinas.filter(v => v.status === 'concluida');
            default:
                return vacinas;
        }
    };

    const getInformacoesVacina = (vacina) => {
        const nome = vacina.nome_vacina?.toLowerCase() || '';
        const especie = pet.tipo?.toLowerCase() || '';
        
        // 🐶 VACINAS PARA CÃES
        if (especie.includes('cão') || especie.includes('cachorro') || especie.includes('cao')) {
            if (nome.includes('polivalente') || nome.includes('v8') || nome.includes('v10')) {
                return {
                    descricao: 'Protege contra: cinomose, hepatite, leptospirose, parvovirose, parainfluenza, adenovirose',
                    esquema: 'Reforço anual obrigatório'
                };
            }
            else if (nome.includes('antirrábica') || nome.includes('raiva')) {
                return {
                    descricao: 'Protege contra raiva (fatal e transmissível para humanos)',
                    esquema: 'Reforço anual obrigatório'
                };
            }
            else if (nome.includes('gripe') || nome.includes('tosse') || nome.includes('bordetella')) {
                return {
                    descricao: 'Protege contra Bordetella bronchiseptica e parainfluenza canina',
                    esquema: 'Reforço anual recomendado'
                };
            }
            else if (nome.includes('giárdia') || nome.includes('giardia')) {
                return {
                    descricao: 'Protege contra Giardíase (infecção intestinal)',
                    esquema: 'Reforço anual opcional'
                };
            }
        }
        
        // 🐱 VACINAS PARA GATOS
        else if (especie.includes('gato') || especie.includes('felino')) {
            if (nome.includes('polivalente') || nome.includes('v3') || nome.includes('v4') || nome.includes('v5')) {
                return {
                    descricao: 'Protege contra: rinotraqueíte, calicivirose, panleucopenia',
                    esquema: 'Reforço anual obrigatório'
                };
            }
            else if (nome.includes('antirrábica') || nome.includes('raiva')) {
                return {
                    descricao: 'Protege contra raiva',
                    esquema: 'Reforço anual obrigatório'
                };
            }
            else if (nome.includes('leucemia') || nome.includes('felv')) {
                return {
                    descricao: 'Protege contra Leucemia Felina (recomendada para gatos que saem de casa)',
                    esquema: 'Reforço anual recomendado'
                };
            }
        }
        
        return {
            descricao: 'Vacina de proteção geral',
            esquema: 'Consulte o veterinário para reforço'
        };
    };

    const vacinasFiltradas = getVacinasFiltradas();

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content vaccine-modal" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>&times;</button>
                
                <div className="vaccine-header">
                    <h2>💉 Carteira de Vacinação</h2>
                    <div className="pet-vaccine-info">
                        <h3>{pet.nome} (ID: {pet.id})</h3>
                        <p><strong>Espécie:</strong> {pet.tipo || 'N/A'} | <strong>Raça:</strong> {pet.raca || 'N/A'}</p>
                    </div>
                </div>

                {/* Informações de debug */}
                <div className="debug-info" style={{
                    background: '#f0f8ff',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    marginBottom: '1rem',
                    fontSize: '0.8rem',
                    color: '#333'
                }}>
                    <strong>Debug:</strong> Pet ID: {pet.id} | Vacinas carregadas: {vacinas.length} | 
                    Concluídas: {vacinas.filter(v => v.status === 'concluida').length} | 
                    Pendentes: {vacinas.filter(v => v.status === 'pendente').length} | 
                    Atrasadas: {vacinas.filter(v => v.status === 'atrasada').length}
                </div>

                {/* Filtros */}
                <div className="vaccine-filters">
                    <button 
                        className={`filter-btn ${filter === 'todas' ? 'active' : ''}`}
                        onClick={() => setFilter('todas')}
                    >
                        Todas ({vacinas.length})
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'pendentes' ? 'active' : ''}`}
                        onClick={() => setFilter('pendentes')}
                    >
                        Pendentes ({vacinas.filter(v => v.status === 'pendente').length})
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'atrasadas' ? 'active' : ''}`}
                        onClick={() => setFilter('atrasadas')}
                    >
                        Atrasadas ({vacinas.filter(v => v.status === 'atrasada').length})
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'concluidas' ? 'active' : ''}`}
                        onClick={() => setFilter('concluidas')}
                    >
                        Concluídas ({vacinas.filter(v => v.status === 'concluida').length})
                    </button>
                </div>

                {loading && (
                    <div className="loading-message">
                        <div className="loading-spinner"></div>
                        Carregando carteira de vacinação...
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                {!loading && !error && (
                    <div className="vaccine-content">
                        {vacinasFiltradas.length > 0 ? (
                            <div className="vaccine-list">
                                {vacinasFiltradas.map((vacina, index) => {
                                    const infoVacina = getInformacoesVacina(vacina);
                                    return (
                                        <div key={vacina.id || index} className="vaccine-card">
                                            <div className="vaccine-header-info">
                                                <div className="vaccine-title">
                                                    <h4 className="vaccine-name">{vacina.nome_vacina}</h4>
                                                    <span className="vacina-id">ID: {vacina.id}</span>
                                                </div>
                                                <span className={getStatusClass(vacina)}>
                                                    {getStatusText(vacina)}
                                                </span>
                                            </div>
                                            
                                            <div className="vaccine-details">
                                                <div className="vaccine-detail-item">
                                                    <span className="detail-label">📅 Data da Aplicação:</span>
                                                    <span className="detail-value">
                                                        {formatDate(vacina.data_aplicacao)}
                                                    </span>
                                                </div>
                                                
                                                <div className="vaccine-detail-item">
                                                    <span className="detail-label">🔄 Próxima Dose:</span>
                                                    <span className={`detail-value ${!vacina.data_proxima_dose ? 'nao-aplicavel' : ''}`}>
                                                        {formatDate(vacina.data_proxima_dose)}
                                                    </span>
                                                </div>
                                                
                                                {vacina.funcionario_nome && (
                                                    <div className="vaccine-detail-item">
                                                        <span className="detail-label">👨‍⚕️ Aplicada por:</span>
                                                        <span className="detail-value">{vacina.funcionario_nome}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status específicos */}
                                            {vacina.status === 'pendente' && (
                                                <div className="vaccine-alert pendente">
                                                    <span className="alert-icon">📅</span>
                                                    <span className="alert-text">
                                                        Próxima dose em {formatDate(vacina.data_proxima_dose)}
                                                    </span>
                                                </div>
                                            )}

                                            {vacina.status === 'atrasada' && (
                                                <div className="vaccine-alert atrasada">
                                                    <span className="alert-icon">⚠️</span>
                                                    <span className="alert-text">
                                                        Dose em atraso! Vencida em {formatDate(vacina.data_proxima_dose)}
                                                    </span>
                                                </div>
                                            )}

                                            {vacina.status === 'concluida' && (
                                                <div className="vaccine-success">
                                                    <span className="success-icon">✅</span>
                                                    <span className="success-text">
                                                        Vacinação concluída
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="no-vaccines">
                                <div className="no-vaccines-icon">💉</div>
                                <h3>Nenhuma vacina {filter !== 'todas' ? `com status "${filter}"` : 'registrada'}</h3>
                                <p>Não há vacinas para exibir com o filtro selecionado.</p>
                            </div>
                        )}
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

export default VacinaModal;