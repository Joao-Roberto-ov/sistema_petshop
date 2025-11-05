import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './PetHistoryModal.css';

function PetHistoryModal({ pet, onClose }) {
    const [history, setHistory] = useState({ consultas: [], servicos: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState(null);
    const [isFuncionario, setIsFuncionario] = useState(false);
    const [expandedItem, setExpandedItem] = useState(null);

    const toggleDetails = (type, index) => {
        const key = `${type}-${index}`;
        setExpandedItem(expandedItem === key ? null : key);
    };

    useEffect(() => {
        if (!pet) return;

        const fetchHistory = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`http://localhost:8000/teste-historico-direto/${pet.id}`);
                const data = await response.json();
                
                if (data.success) {
                    const historicoAdaptado = {
                        consultas: data.historico.filter(item => 
                            item.tipo_servico.includes('Consulta') || 
                            item.tipo_servico.includes('Exame')
                        ),
                        servicos: data.historico.filter(item => 
                            item.tipo_servico.includes('Banho') || 
                            item.tipo_servico.includes('Vacina')
                        )
                    };
                    setHistory(historicoAdaptado);
                } else {
                    throw new Error(data.error || 'Erro ao carregar histórico');
                }
            } catch (err) {
                console.error('Erro ao carregar histórico:', err);
                setError('Não foi possível carregar o histórico. Tente novamente.');
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
        
        return 'Meu pet';
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
                            <strong>Observações:</strong> {pet.observacoes}
                        </p>
                    )}
                </div>

                {loading && <div className="loading-message">Carregando histórico...</div>}
                {error && <div className="error-message">{error}</div>}

                {!loading && !error && (
                    <div className="history-sections">
                        <div className="history-section">
                            <h3>📋 Consultas Médicas</h3>
                            {history.consultas && history.consultas.length > 0 ? (
                                <div className="history-list">
                                    {history.consultas.map((item, index) => {
                                        const isExpanded = expandedItem === `consulta-${index}`;
                                        return (
                                            <div key={`consulta-${index}`} className={`history-item ${isExpanded ? 'expanded' : ''}`}>
                                                <div className="service-header">
                                                    <strong className="service-name">
                                                        {item.servico_realizado || 'Consulta'}
                                                    </strong>
                                                    <span className="service-value" onClick={() => toggleDetails('consulta', index)}>
                                                        {formatCurrency(item.valor)}
                                                        <span className="toggle-icon">{isExpanded ? '▲' : '▼'}</span>
                                                    </span>
                                                </div>
                                                <div className="service-details">
                                                    <span className="detail">
                                                        <strong>Profissional:</strong> {item.funcionario || 'Não informado'}
                                                    </span>
                                                    <span className="detail">
                                                        <strong>Data:</strong> {formatDate(item.data_hora)}
                                                    </span>
                                                </div>
                                                {isExpanded && (
                                                    <div className="detailed-info">
                                                        <p><strong>Detalhes da Consulta:</strong></p>
                                                        <ul>
                                                            <li><strong>Resumo/Descrição:</strong> {item.resumo || item.descricao_servico || 'Não informado'}</li>
                                                        <li><strong>Diagnóstico:</strong> {item.diagnostico || 'Não informado'}</li>
                                                            <li><strong>Tratamento:</strong> {item.tratamento || 'Não informado'}</li>
                                                            <li><strong>Medicamentos:</strong> {item.medicamentos || 'Nenhum'}</li>
                                                            <li><strong>Observações:</strong> {item.observacoes || 'Nenhuma'}</li>
                                                        </ul>
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

                        <div className="history-section">
                            <h3>✨ Serviços de Bem-Estar</h3>
                            {history.servicos && history.servicos.length > 0 ? (
                                <div className="history-list">
                                    {history.servicos.map((item, index) => {
                                        const isExpanded = expandedItem === `servico-${index}`;
                                        return (
                                            <div key={`servico-${index}`} className={`history-item ${isExpanded ? 'expanded' : ''}`}>
                                                <div className="service-header">
                                                    <strong className="service-name">
                                                        {item.servico_realizado || 'Serviço'}
                                                    </strong>
                                                    <span className="service-value" onClick={() => toggleDetails('servico', index)}>
                                                        {formatCurrency(item.valor)}
                                                        <span className="toggle-icon">{isExpanded ? '▲' : '▼'}</span>
                                                    </span>
                                                </div>
                                                <div className="service-details">
                                                    <span className="detail">
                                                        <strong>Profissional:</strong> {item.funcionario || 'Não informado'}
                                                    </span>
                                                    <span className="detail">
                                                        <strong>Data:</strong> {formatDate(item.data_hora)}
                                                    </span>
                                                </div>
                                                {isExpanded && (
                                                    <div className="detailed-info">
                                                        <p><strong>Detalhes do Serviço:</strong></p>
                                                        <ul>
                                                            <li><strong>Resumo/Descrição:</strong> {item.resumo || item.descricao || 'Não informado'}</li>
                                                            <li><strong>Produtos Utilizados:</strong> {item.produtos_utilizados || 'Nenhum'}</li>
                                                            <li><strong>Observações:</strong> {item.observacoes || 'Nenhuma'}</li>
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
