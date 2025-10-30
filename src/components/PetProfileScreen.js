import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

// Ícones SVG
const IconPaw = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13v7l2-4 2 4v-7"></path>
        <path d="M5 20l2-4 2 4"></path>
        <path d="M19 20l-2-4-2 4"></path>
        <path d="M12 4a3 3 0 0 0-3 3v2a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3z"></path>
    </svg>
);

const IconStethoscope = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
        <path d="M12 15v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4"></path>
        <path d="M12 15h-3a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3"></path>
        <path d="M17 12h-5"></path>
        <path d="M12 15h-5"></path>
    </svg>
);

const IconScissors = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3"></circle>
        <circle cx="6" cy="18" r="3"></circle>
        <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
        <line x1="14.47" y1="14.48" x2="2.52" y2="2.52"></line>
        <line x1="8.12" y1="8.12" x2="20" y2="20"></line>
    </svg>
);

const IconShoppingCart = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
);

const IconSyringe = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m14 20-3.5-3.5a2 2 0 0 1 0-2.83l4.69-4.69a2 2 0 0 1 2.83 0L21 9l-4 4-2.5-2.5"></path>
        <path d="m4 12 8.5-8.5"></path>
        <path d="m5 17 4-4"></path>
    </svg>
);

const IconCalendar = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const IconUser = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const IconInfo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

const IconWeight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
        <path d="M12 15v7"></path>
        <path d="M9 18h6"></path>
    </svg>
);

const IconRuler = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3l4 4-13 13-4-4 13-13z"></path>
        <line x1="12" y1="12" x2="16" y2="16"></line>
        <line x1="15" y1="15" x2="19" y2="19"></line>
    </svg>
);

const IconGender = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);


function PetProfileScreen({ petId, onBack }) {
    const [petData, setPetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (petId) {
            fetchPetProfile();
        }
    }, [petId]);

    const fetchPetProfile = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            
            // Nova rota para o perfil completo do pet (dados + histórico)
            const response = await axios.get(`/api/funcionario/pets/${petId}/perfil`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setPetData(response.data);
            
        } catch (err) {
            console.error('Erro ao buscar perfil do pet:', err);
            setError(err.response?.data?.detail || 'Erro ao carregar o perfil do pet. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'Consulta':
                return <IconStethoscope />;
            case 'Serviço':
                return <IconScissors />; // Ex: Banho e Tosa
            case 'Vacina':
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
            case 'Serviço':
                return '#3498db'; // Azul para serviços gerais
            case 'Vacina':
                return '#2ecc71'; // Verde para saúde/vacinas
            case 'Compra':
                return '#f39c12'; // Laranja para compras
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
                </div>
            </div>
        );
    }

    const { dados_pet, historico } = petData;

    return (
        <div className="pet-profile-screen">
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
                    left: 30px; /* Posição da linha central */
                    margin-left: -2px;
                }

                .timeline-item {
                    margin-bottom: 2rem;
                    position: relative;
                    padding-left: 60px; /* Espaço para o ícone e a linha */
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
                    border: 4px solid; /* Cor da borda será dinâmica */
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
                    border-left: 5px solid; /* Cor da borda lateral será dinâmica */
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

            <div className="timeline-container">
                <h3 className="timeline-title">Histórico Cronológico</h3>
                <div className="timeline">
                    {historico.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Nenhum registro de histórico encontrado.</p>
                    ) : (
                        historico.map((item, index) => {
                            const itemColor = getColorForType(item.tipo);
                            const itemDate = format(parseISO(item.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

                            return (
                                <div className="timeline-item" key={index}>
                                    <div 
                                        className="timeline-icon"
                                        style={{ 
                                            borderColor: itemColor,
                                            backgroundColor: itemColor
                                        }}
                                        title={item.tipo}
                                    >
                                        {getIconForType(item.tipo)}
                                    </div>
                                    <div className="timeline-content" style={{ borderLeftColor: itemColor }}>
                                        <h4>{item.tipo}: {item.descricao}</h4>
                                        
                                        {item.detalhes && item.tipo === 'Compra' && (
                                            <p style={{ color: '#2c3e50', fontWeight: '500', marginTop: '0.5rem' }}>
                                                Itens: {item.detalhes}
                                            </p>
                                        )}
                                        
                                        <div className="meta">
                                            <span>
                                                <IconCalendar />
                                                {itemDate}
                                            </span>
                                            <span>
                                                <IconUser />
                                                {item.realizado_por}
                                            </span>
                                            <span>
                                                Valor: R$ {item.valor.toFixed(2).replace('.', ',')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

export default PetProfileScreen;
