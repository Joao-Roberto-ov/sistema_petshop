import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import HistoricoDetalhesModal from './HistoricoDetalhesModal';

// Ícones SVG utilizados
const IconStethoscope = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 .2.3V4a6 6 0 0 0-6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1"></path><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"></path><circle cx="12" cy="9" r="1"></circle></svg>
);
const IconScissors = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>
);
const IconSyringe = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"></path><path d="m17 7 3-3"></path><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"></path><path d="m9 11 4 4"></path><path d="m5 19-3 3"></path><path d="m14 4 6 6"></path></svg>
);
const IconShoppingCart = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
);
const IconInfo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
);
const IconRuler = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0l12.6 12.6z"></path><line x1="14.5" y1="5.5" x2="18.5" y2="9.5"></line><line x1="11.5" y1="8.5" x2="15.5" y2="12.5"></line><line x1="8.5" y1="11.5" x2="12.5" y2="15.5"></line></svg>
);
const IconGender = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8v0"></path></svg>
);
const IconCalendar = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
const IconWeight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 12h-4"></path><path d="M12 16v-4"></path></svg>
);
const IconUser = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const IconStickyNote = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);


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

    // Polling para atualizar em tempo real
    useEffect(() => {
        if (!petId) return;
        const interval = setInterval(() => {
            fetchPetProfile();
        }, 30000);
        return () => clearInterval(interval);
    }, [petId]);

    const fetchPetProfile = async () => {
    try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');

        // Realiza requisições paralelas: Pet, Histórico Médico (Antigo) e Observações (Novo)
        const [petResponse, histResponse, obsResponse] = await Promise.all([
            axios.get(`/pets/${petId}`),
            axios.get(`/historico/pet/${petId}`),
            // Busca da nova tabela de observações
            axios.get(`/observacoes/pet/${petId}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: [] })) // Fallback se falhar
        ]);

        // Processar Histórico Médico (Consultas/Serviços)
        const historicoMedico = histResponse.data.map(item => ({
            ...item,
            origem: 'medico',
            sortDate: new Date(item.data_hora)
        }));

        // Processar Novas Observações
        const observacoes = obsResponse.data.map(item => ({
            id: item.id,
            tipo_servico: 'Observação', // Identificador visual
            resumo: item.titulo || 'Observação',
            detalhes: item.descricao,
            data_hora: item.data_criacao,
            funcionario_nome: item.funcionario_nome,
            valor: 0,
            origem: 'observacao',
            sortDate: new Date(item.data_criacao)
        }));

        // Mesclar tudo e ordenar
        const timelineCompleta = [...historicoMedico, ...observacoes].sort((a, b) => b.sortDate - a.sortDate);

        setPetData({
            dados_pet: petResponse.data,
            historico: timelineCompleta
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
            case 'Observação': // Novo tipo
                return <IconStickyNote />;
            default:
                return <IconInfo />;
        }
    };

    const getColorForType = (type) => {
        switch (type) {
            case 'Consulta':
                return '#2c3e50'; // Dark Blue
            case 'Banho e Tosa':
                return '#3498db'; // Blue
            case 'Vacinação':
                return '#2ecc71'; // Green
            case 'Observação':
                return '#f1c40f'; // Yellow
            case 'Compra':
                return '#f39c12'; // Orange
            default:
                return '#95a5a6'; // Grey
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
                    background: #4a9b8e;
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
                    color: #4a9b8e;
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
                    border-left: 4px solid #a2d2ca;
                }

                .detail-card-icon {
                    color: #2c7a6f;
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
                    color: #2c7a6f;
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
                    color: '#4a9b8e',
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
                <h2 className="timeline-title">Histórico Completo</h2>
                <div className="timeline">
                    {historico && historico.length > 0 ? (
                        historico.map((item, index) => {
                            const itemColor = getColorForType(item.tipo_servico);
                            const itemIcon = getIconForType(item.tipo_servico);
                            const dataFormatada = format(parseISO(item.data_hora), 'dd/MM/yyyy HH:mm', { locale: ptBR });

                            return (
                                <div key={`${item.origem}-${item.id || index}`} className="timeline-item">
                                    <div className="timeline-icon" style={{ borderColor: itemColor, background: itemColor }}>
                                        {itemIcon}
                                    </div>
                                    <div className="timeline-content" style={{ borderLeftColor: itemColor }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <h4 style={{ margin: 0, flex: 1 }}>{item.tipo_servico}</h4>
                                            {item.valor > 0 && (
                                                <span style={{
                                                    background: itemColor,
                                                    color: 'white',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    R$ {item.valor.toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        <p style={{ margin: '0.5rem 0', fontWeight: 'bold', color: '#2c3e50' }}>
                                            {item.resumo}
                                        </p>

                                        <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#7f8c8d', whiteSpace: 'pre-wrap' }}>
                                            {item.detalhes ? item.detalhes.substring(0, 200) + (item.detalhes.length > 200 ? '...' : '') : 'Nenhum detalhe.'}
                                        </p>

                                        {/* Botão Ver Detalhes (apenas se for histórico médico real, não observação) */}
                                        {item.origem === 'medico' && (
                                            <div style={{
                                                margin: '1rem 0',
                                                display: 'flex',
                                                justifyContent: 'center'
                                            }}>
                                                <button
                                                    onClick={() => setSelectedHistoricoId(item.id)}
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
                                                >
                                                    🔍 Ver Detalhes
                                                </button>
                                            </div>
                                        )}

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
                                                {item.funcionario_nome || 'Sistema'}
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