import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const HistoricoDetalhesModal = ({ historicoId, onClose }) => {
    const [registro, setRegistro] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (historicoId) {
            fetchDetalhes();
        }
    }, [historicoId]);

    const fetchDetalhes = async () => {
        try {
            setLoading(true);
            setError('');
            
            console.log('🔍 Buscando detalhes do registro:', historicoId);
            
            const response = await axios.get(`/historico/${historicoId}`);
            console.log('✅ Detalhes recebidos:', response.data);
            
            setRegistro(response.data);
            
        } catch (err) {
            console.error(' Erro ao buscar detalhes do histórico:', err);
            
            if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else if (err.response?.status === 403) {
                setError('Você não tem permissão para visualizar este registro.');
            } else if (err.response?.status === 404) {
                setError('Registro não encontrado.');
            } else if (err.code === 'NETWORK_ERROR') {
                setError('Erro de conexão. Verifique sua internet.');
            } else {
                setError(err.response?.data?.detail || 'Erro ao carregar os detalhes do registro.');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatarData = (dataString) => {
        try {
            return format(parseISO(dataString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
        } catch (e) {
            return dataString || 'Data não informada';
        }
    };

    const formatarValor = (valor) => {
        if (!valor) return 'Não informado';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    if (!historicoId) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <style>
                {`
                .modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    padding: 1rem;
                }

                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 700px;
                    max-height: 85vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    position: relative;
                    border: 2px solid var(--color-primary);
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #e1e8ed;
                    padding-bottom: 1rem;
                    margin-bottom: 1.5rem;
                }

                .modal-header h2 {
                    margin: 0;
                    color: var(--color-primary-dark);
                    font-size: 1.6rem;
                    font-weight: 600;
                }

                .modal-close-btn {
                    background: none;
                    border: none;
                    font-size: 2rem;
                    cursor: pointer;
                    color: #7f8c8d;
                    padding: 0.5rem;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }

                .modal-close-btn:hover {
                    background: #f5f5f5;
                    color: #e74c3c;
                    transform: rotate(90deg);
                }

                .loading-container {
                    text-align: center;
                    padding: 3rem;
                }

                .loading-spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid var(--color-primary);
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .error-container {
                    text-align: center;
                    padding: 2rem;
                    background: #fdf2f2;
                    border-radius: 12px;
                    border-left: 5px solid #e74c3c;
                }

                .error-container h3 {
                    color: #e74c3c;
                    margin-bottom: 1rem;
                }

                .retry-button {
                    background: var(--color-primary);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    margin-top: 1rem;
                    transition: background 0.3s ease;
                }

                .retry-button:hover {
                    background: var(--color-primary-dark);
                }

                .registro-info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .info-card {
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    padding: 1.25rem;
                    border-radius: 12px;
                    border-left: 4px solid var(--color-primary);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                .info-card h4 {
                    margin: 0 0 0.5rem 0;
                    color: #7f8c8d;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 600;
                }

                .info-card p {
                    margin: 0;
                    color: #2c3e50;
                    font-weight: 500;
                    font-size: 1rem;
                }

                .info-card .valor {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: var(--color-primary-dark);
                }

                .detail-section {
                    margin-bottom: 2rem;
                    background: #f8f9fa;
                    padding: 1.5rem;
                    border-radius: 12px;
                    border: 1px solid #e1e8ed;
                }

                .detail-section:last-child {
                    margin-bottom: 0;
                }

                .detail-section strong {
                    display: block;
                    color: var(--color-primary-dark);
                    margin-bottom: 0.75rem;
                    font-size: 1.1rem;
                    font-weight: 600;
                    border-bottom: 2px solid var(--color-primary-light);
                    padding-bottom: 0.5rem;
                }

                .detail-section p {
                    margin: 0;
                    color: #555;
                    white-space: pre-wrap;
                    line-height: 1.6;
                    font-size: 1rem;
                }

                .detail-section .empty-message {
                    color: #95a5a6;
                    font-style: italic;
                }

                .technical-info {
                    background: #e8f4fd;
                    border-left: 4px solid #3498db;
                }

                .technical-info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    margin-top: 0.5rem;
                }

                .technical-info-item {
                    background: white;
                    padding: 0.75rem;
                    border-radius: 6px;
                    font-size: 0.9rem;
                }

                .technical-info-item strong {
                    display: block;
                    color: #7f8c8d;
                    font-size: 0.8rem;
                    margin-bottom: 0.25rem;
                    border: none;
                    padding: 0;
                }

                .technical-info-item span {
                    color: #2c3e50;
                    font-weight: 500;
                }

                .servico-badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    background: var(--color-primary);
                    color: white;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                `}
            </style>
            
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📋 Detalhes do Registro Médico</h2>
                    <button className="modal-close-btn" onClick={onClose} title="Fechar">
                        &times;
                    </button>
                </div>

                {loading && (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Carregando detalhes do registro...</p>
                    </div>
                )}

                {error && (
                    <div className="error-container">
                        <h3>❌ Erro ao carregar</h3>
                        <p>{error}</p>
                        <button className="retry-button" onClick={fetchDetalhes}>
                            Tentar Novamente
                        </button>
                    </div>
                )}

                {registro && !loading && (
                    <div>
                        {/* Informações principais */}
                        <div className="registro-info-grid">
                            <div className="info-card">
                                <h4>Tipo de Serviço</h4>
                                <p><span className="servico-badge">{registro.tipo_servico}</span></p>
                            </div>
                            <div className="info-card">
                                <h4>Data e Hora</h4>
                                <p>{formatarData(registro.data_hora)}</p>
                            </div>
                            <div className="info-card">
                                <h4>Profissional</h4>
                                <p>{registro.funcionario_nome || 'Não Informado'}</p>
                            </div>
                            <div className="info-card">
                                <h4>Valor</h4>
                                <p className="valor">{formatarValor(registro.valor)}</p>
                            </div>
                        </div>

                        {/* Resumo */}
                        <div className="detail-section">
                            <strong>📝 Resumo do Serviço</strong>
                            <p>{registro.resumo || 'Nenhum resumo disponível.'}</p>
                        </div>

                        {/* Detalhes completos */}
                        <div className="detail-section">
                            <strong>📄 Detalhes Completos do Procedimento</strong>
                            <p>{registro.detalhes || <span className="empty-message">Nenhum detalhe adicional registrado.</span>}</p>
                        </div>

                        {/* Informações técnicas */}
                        <div className="detail-section technical-info">
                            <strong>🔧 Informações Técnicas</strong>
                            <div className="technical-info-grid">
                                <div className="technical-info-item">
                                    <strong>ID do Registro</strong>
                                    <span>#{registro.id}</span>
                                </div>
                                <div className="technical-info-item">
                                    <strong>ID do Pet</strong>
                                    <span>#{registro.pet_id}</span>
                                </div>
                                {registro.funcionario_id && (
                                    <div className="technical-info-item">
                                        <strong>ID do Profissional</strong>
                                        <span>#{registro.funcionario_id}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoricoDetalhesModal;