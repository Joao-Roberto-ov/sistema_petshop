import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './PetHistoryModal.css';

function PetHistoryModal({ pet, onClose }) {
    const [history, setHistory] = useState({ consultas: [], servicos: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState(null);
    const [isFuncionario, setIsFuncionario] = useState(false);

    useEffect(() => {
        // Carregar dados do usuário do localStorage
        const userDataFromStorage = localStorage.getItem('userData');
        if (userDataFromStorage) {
            try {
                const parsedUserData = JSON.parse(userDataFromStorage);
                setUserData(parsedUserData);
                
                // Verificar se é funcionário (gestor ou veterinário)
                const userIsFuncionario = parsedUserData.tipo === 'funcionario' || 
                                        parsedUserData.cargo_id || 
                                        parsedUserData.cargo;
                setIsFuncionario(userIsFuncionario);
                
            } catch (e) {
                console.error('Erro ao parse userData:', e);
            }
        }

        if (!pet) return;

        const fetchHistory = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                const userData = JSON.parse(localStorage.getItem('userData'));
                
                // Decidir qual endpoint usar baseado no tipo de usuário
                let endpoint;
                const userIsFuncionario = userData?.tipo === 'funcionario' || 
                                        userData?.cargo_id || 
                                        userData?.cargo;
                
                if (userIsFuncionario) {
                    endpoint = `/admin/pets/${pet.id}/history`;
                } else {
                    endpoint = `/pets/${pet.id}/history`;
                }

                const response = await axios.get(endpoint, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setHistory(response.data);
            } catch (err) {
                console.error('Erro ao carregar histórico:', err);
                if (err.response?.status === 403) {
                    setError('Acesso negado: Você não tem permissão para visualizar o histórico deste pet.');
                } else if (err.response?.status === 404) {
                    setError('Histórico não encontrado para este pet.');
                } else {
                    setError('Não foi possível carregar o histórico. Tente novamente.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [pet]);

    // Função para obter o nome do dono CORRETAMENTE
    const getDonoNome = () => {
        // Se é funcionário (gestor/veterinário) E o pet tem informação do dono
        if (isFuncionario && pet.dono?.nome) {
            return pet.dono.nome;
        }
        
        // Se é funcionário mas o pet não tem info do dono
        if (isFuncionario && !pet.dono?.nome) {
            return 'Cliente não identificado';
        }
        
        // Se é cliente, mostrar o próprio nome
        if (userData?.nome) {
            return userData.nome;
        }
        
        // Fallback
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
                
                {/* Informações do Pet */}
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
                                    {history.consultas.map((item, index) => (
                                        <div key={`consulta-${index}`} className="history-item">
                                            <div className="service-header">
                                                <strong className="service-name">
                                                    {item.servico_realizado || 'Consulta'}
                                                </strong>
                                                <span className="service-value">
                                                    {formatCurrency(item.valor)}
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
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-data">Nenhuma consulta médica registrada.</p>
                            )}
                        </div>

                        <div className="history-section">
                            <h3>✨ Serviços de Bem-Estar</h3>
                            {history.servicos && history.servicos.length > 0 ? (
                                <div className="history-list">
                                    {history.servicos.map((item, index) => (
                                        <div key={`servico-${index}`} className="history-item">
                                            <div className="service-header">
                                                <strong className="service-name">
                                                    {item.servico_realizado || 'Serviço'}
                                                </strong>
                                                <span className="service-value">
                                                    {formatCurrency(item.valor)}
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
                                        </div>
                                    ))}
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