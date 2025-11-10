import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import HistoricoDetalhesModal from './HistoricoDetalhesModal';

// Ícones SVG utilizados

function PetProfileScreen({ petId, onBack }) {
    const [petData, setPetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedHistoricoId, setSelectedHistoricoId] = useState(null);

    useEffect(() => {
        if (petId) {
            fetchPetProfile();
        }
    }, [petId]);

    useEffect(() => {
        if (!petId) return;

        // Atualizar a cada 30 segundos para pegar novos registros
        const interval = setInterval(() => {
            console.log('🔄 Atualização automática do histórico...');
            fetchPetProfile();
        }, 30000); // 30 segundos

        // Limpar intervalo quando o componente desmontar
        return () => clearInterval(interval);
    }, [petId]);

    const fetchPetProfile = async () => {
    try {
        setLoading(true);
        setError('');
        
        console.log('🐕 Buscando perfil do pet ID:', petId);

        const url = `/historico/pet/${petId}`;
        console.log('🌐 URL do histórico:', url);
        
        const response = await axios.get(url);
        
        console.log('✅ Histórico recebido:', response.data);
        
        // Buscar dados básicos do pet separadamente
        const petResponse = await axios.get(`/pets/${petId}`);
        console.log('✅ Dados do pet recebidos:', petResponse.data);
        
        setPetData({
            dados_pet: petResponse.data,
            historico: response.data
        });
        
    } catch (err) {
        console.error('❌ Erro ao buscar perfil do pet:', err);
        
        if (err.response?.status === 403) {
            setError('Você não tem permissão para acessar o histórico deste pet.');
        } else if (err.response?.status === 404) {
            setError('Pet não encontrado.');
        } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
            setError('Erro de conexão. Verifique se o servidor está rodando.');
        } else {
            setError(err.response?.data?.detail || 'Erro ao carregar o perfil do pet. Tente novamente.');
        }
    } finally {
        setLoading(false);
    }
};

    // Mover funções auxiliares para fora do render
    const getIconForType = (type) => {
        switch (type) {
            case 'Consulta':
                return <IconStethoscope />;
            case 'Banho e Tosa':
                return <IconScissors />;
            case 'Vacinação':
                return <IconSyringe />;
            case 'Compra':
                return <IconShoppingCart />;
            default:
                return <IconInfo />;
        }
    };

    const getColorForType = (type) => {
        switch (type) {
            case 'Consulta':
                return 'var(--color-primary-dark)';
            case 'Banho e Tosa':
                return '#3498db';
            case 'Vacinação':
                return '#2ecc71';
            case 'Compra':
                return '#f39c12';
            default:
                return '#95a5a6';
        }
    };

    if (loading) {
        return (
            <div className="login-container">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <h2>Carregando perfil do pet...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="error-message">{error}</div>
                    <button className="btn-submit" onClick={onBack}>Voltar</button>
                    <button 
                        className="btn-submit" 
                        onClick={fetchPetProfile}
                        style={{ marginLeft: '10px', background: '#6c757d' }}
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    // Verificar se petData existe antes de desestruturar
    if (!petData) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="error-message">Dados do pet não disponíveis.</div>
                    <button className="btn-submit" onClick={onBack}>Voltar</button>
                </div>
            </div>
        );
    }

    const { dados_pet, historico } = petData;

    return (
        <div className="pet-profile-screen">
            {selectedHistoricoId && (
                <HistoricoDetalhesModal 
                    historicoId={selectedHistoricoId} 
                    onClose={() => setSelectedHistoricoId(null)} 
                />
            )}
            
            <style>
                {`
                .pet-profile-screen {
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .profile-header {
                    background: var(--color-primary);
                    color: white;
                    padding: 2rem;
                    border-radius: 16px;
                    margin-bottom: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                }

                .profile-avatar {
                    background: white;
                    color: var(--color-primary);
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: bold;
                    flex-shrink: 0;
                }

                .profile-info h1 {
                    margin: 0 0 0.5rem 0;
                    font-size: 2.5rem;
                }

                .profile-info p {
                    margin: 0;
                    font-size: 1.1rem;
                    opacity: 0.9;
                }

                .profile-details {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .detail-card {
                    background: white;
                    padding: 1rem;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    border-left: 4px solid var(--color-primary-light);
                }

                .detail-card-icon {
                    color: var(--color-primary-dark);
                    flex-shrink: 0;
                }

                .detail-card-content p {
                    margin: 0;
                    font-size: 0.8rem;
                    color: #7f8c8d;
                    font-weight: 500;
                }

                .detail-card-content strong {
                    display: block;
                    font-size: 1rem;
                    color: #2c3e50;
                }

                .timeline-container {
                    background: white;
                    padding: 2rem;
                    border-radius: 16px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
                }

                .timeline-title {
                    font-size: 1.8rem;
                    color: var(--color-primary-dark);
                    margin-bottom: 1.5rem;
                    border-bottom: 2px solid #ecf0f1;
                    padding-bottom: 0.5rem;
                }

                .timeline {
                    position: relative;
                    padding: 1rem 0;
                }

                .timeline::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: #ecf0f1;
                    left: 30px;
                    margin-left: -2px;
                }

                .timeline-item {
                    margin-bottom: 2rem;
                    position: relative;
                    padding-left: 60px;
                }

                .timeline-icon {
                    position: absolute;
                    left: 30px;
                    top: 0;
                    transform: translateX(-50%);
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: white;
                    border: 4px solid;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    box-shadow: 0 0 0 4px white;
                }

                .timeline-content {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    border-left: 5px solid;
                }

                .timeline-content h4 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.1rem;
                    color: #2c3e50;
                }

                .timeline-content p {
                    margin: 0 0 0.25rem 0;
                    font-size: 0.9rem;
                    color: #7f8c8d;
                }

                .timeline-content .meta {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.85rem;
                    color: #95a5a6;
                    margin-top: 0.5rem;
                    padding-top: 0.5rem;
                    border-top: 1px dashed #ecf0f1;
                }

                .timeline-content .meta span {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                }
                `}
            </style>

            <button 
                onClick={onBack}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary-dark)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}
            >
                ← Voltar para a lista de Pets
            </button>

            <div className="profile-header">
                <div className="profile-avatar">
                    {dados_pet.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                    <h1>{dados_pet.nome}</h1>
                    <p>{dados_pet.tipo} ({dados_pet.raca})</p>
                </div>
            </div>

            <div className="profile-details">
                <div className="detail-card">
                    <div className="detail-card-icon"><IconRuler /></div>
                    <div className="detail-card-content">
                        <p>Raça</p>
                        <strong>{dados_pet.raca || 'Não informado'}</strong>
                    </div>
                </div>
                <div className="detail-card">
                    <div className="detail-card-icon"><IconGender /></div>
                    <div className="detail-card-content">
                        <p>Sexo Biológico</p>
                        <strong>{dados_pet.sexo_biologico || 'Não informado'}</strong>
                    </div>
                </div>
                <div className="detail-card">
                    <div className="detail-card-icon"><IconCalendar /></div>
                    <div className="detail-card-content">
                        <p>Idade</p>
                        <strong>{dados_pet.idade ? `${dados_pet.idade} anos` : 'Não informado'}</strong>
                    </div>
                </div>
                <div className="detail-card">
                    <div className="detail-card-icon"><IconWeight /></div>
                    <div className="detail-card-content">
                        <p>Peso</p>
                        <strong>{dados_pet.peso ? `${dados_pet.peso} kg` : 'Não informado'}</strong>
                    </div>
                </div>
            </div>

            {dados_pet.observacoes && (
                <div className="timeline-container" style={{ marginBottom: '2rem' }}>
                    <h3 className="timeline-title">Observações Gerais</h3>
                    <p style={{ whiteSpace: 'pre-wrap', color: '#555' }}>{dados_pet.observacoes}</p>
                </div>
            )}

            {/* TIMELINE */}
<div className="timeline-container">
    <h2 className="timeline-title">Histórico Médico</h2>
    <div className="timeline">
        {historico && historico.length > 0 ? (
            historico.map((item, index) => {
                const itemColor = getColorForType(item.tipo_servico);
                const itemIcon = getIconForType(item.tipo_servico);
                const dataFormatada = format(parseISO(item.data_hora), 'dd/MM/yyyy HH:mm', { locale: ptBR });

                return (
                    <div key={item.id || index} className="timeline-item">
                        <div className="timeline-icon" style={{ borderColor: itemColor, background: itemColor }}>
                            {itemIcon}
                        </div>
                        <div className="timeline-content" style={{ borderLeftColor: itemColor }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0, flex: 1 }}>{item.tipo_servico}</h4>
                                <span style={{ 
                                    background: itemColor, 
                                    color: 'white', 
                                    padding: '0.25rem 0.5rem', 
                                    borderRadius: '12px', 
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                }}>
                                    {item.valor ? `R$ ${item.valor.toFixed(2)}` : 'Grátis'}
                                </span>
                            </div>
                            
                            <p style={{ margin: '0.5rem 0', fontWeight: 'bold', color: '#2c3e50' }}>
                                {item.resumo}
                            </p>
                            
                            <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#7f8c8d' }}>
                                {item.detalhes ? item.detalhes.substring(0, 120) + '...' : 'Nenhum detalhe registrado.'}
                            </p>

                            {/* 🔥 BOTÃO DESTACADO - SEM FALHAS */}
                            <div style={{ 
                                margin: '1rem 0', 
                                display: 'flex', 
                                justifyContent: 'center'
                            }}>
                                <button 
                                    onClick={() => {
                                        console.log('🎯 Clicando em Ver Detalhes - ID:', item.id);
                                        setSelectedHistoricoId(item.id);
                                    }}
                                    style={{
                                        background: itemColor,
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        width: '100%',
                                        maxWidth: '200px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#2c3e50';
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = itemColor;
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                                    }}
                                >
                                    🔍 Ver Detalhes Completos
                                </button>
                            </div>

                            <div className="meta" style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                fontSize: '0.85rem',
                                color: '#95a5a6',
                                marginTop: '1rem',
                                paddingTop: '0.75rem',
                                borderTop: '1px dashed #ecf0f1',
                                flexWrap: 'wrap',
                                gap: '0.5rem'
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <IconCalendar />
                                    {dataFormatada}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <IconUser />
                                    {item.funcionario_nome || 'Não Informado'}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })
        ) : (
            <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
                Nenhum registro no histórico médico para este pet.
            </p>
        )}
    </div>
</div>
        </div>
    );
}

export default PetProfileScreen;