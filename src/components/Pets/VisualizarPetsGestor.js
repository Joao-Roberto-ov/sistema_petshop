import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import PetHistoryModal from './PetHistoryModal';

// Ícones SVG
const IconEdit = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const IconSave = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const IconCancel = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const IconSearch = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
    </svg>
);

const IconPaw = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="4" r="2"></circle>
        <circle cx="18" cy="8" r="2"></circle>
        <circle cx="20" cy="16" r="2"></circle>
        <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"></path>
    </svg>
);

const IconCheckCircle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const IconTransfer = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 10l5 5-5 5"/>
        <path d="M4 4v7a4 4 0 0 0 4 4h12"/>
    </svg>
);

const IconHistory = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v10l4 4"/>
        <path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z"/>
    </svg>
);

const IconAlertCircle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);

function VisualizarPetsGestor({ onBack }) {
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [petToTransfer, setPetToTransfer] = useState(null);
    const [searchClientTerm, setSearchClientTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedNewOwner, setSelectedNewOwner] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [transferError, setTransferError] = useState('');
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPets, setFilteredPets] = useState([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedPetForHistory, setSelectedPetForHistory] = useState(null);

    // notificaçoes toasts
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Formulário de edição
    const [formData, setFormData] = useState({
        nome: '',
        tipo: '',
        raca: '',
        idade: '',
        peso: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const handleTransferClick = (pet) => {
        setPetToTransfer(pet);
        setSearchClientTerm('');
        setSearchResults([]);
        setSelectedNewOwner(null);
        setTransferError('');
        setIsTransferModalOpen(true);
    };

    const handleCloseTransferModal = () => {
        setIsTransferModalOpen(false);
        setPetToTransfer(null);
        setSearchClientTerm('');
        setSearchResults([]);
        setSelectedNewOwner(null);
        setTransferError('');
    };

    const handleShowHistory = (pet) => {
        setSelectedPetForHistory(pet);
        setShowHistoryModal(true);
    };

    const handleCloseHistoryModal = () => {
        setShowHistoryModal(false);
        setSelectedPetForHistory(null);
    };

    const handleSearchClient = async () => {
        if (searchClientTerm.length < 3) {
            setTransferError('O termo de busca deve ter pelo menos 3 caracteres.');
            setSearchResults(response.data.filter(c => c.is_ativo !== false));
            return;
        }
        
        setIsSearching(true);
        setTransferError('');
        setSearchResults([]);
        setSelectedNewOwner(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/cliente/buscar?termo=${searchClientTerm}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchResults(response.data);
            if (response.data.length === 0) {
                setTransferError('Nenhum cliente encontrado com o termo fornecido.');
            }
        } catch (err) {
            console.error('Erro ao buscar clientes:', err);
            setTransferError(err.response?.data?.detail || 'Erro ao buscar clientes. Tente novamente.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleConfirmTransfer = async () => {
        if (!petToTransfer || !selectedNewOwner) {
            setTransferError('Selecione um pet e um novo dono para continuar.');
            return;
        }

        if (petToTransfer.cliente_id === selectedNewOwner.id) {
            setTransferError('O novo dono não pode ser o dono atual do pet.');
            return;
        }

        setFormLoading(true);
        setTransferError('');

        try {
            const token = localStorage.getItem('token');
            await axios.post('/admin/pets/transferir', {
                pet_id: petToTransfer.id,
                novo_cliente_id: selectedNewOwner.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showToast(`Pet "${petToTransfer.nome}" transferido com sucesso para ${selectedNewOwner.nome}!`, 'success');
            handleCloseTransferModal();
            fetchAllPets(); // Recarregar a lista de pets
        } catch (err) {
            console.error('Erro ao transferir pet:', err);
            setTransferError(err.response?.data?.detail || 'Erro ao transferir pet. Tente novamente.');
        } finally {
            setFormLoading(false);
        }
    };

    useEffect(() => {
        fetchAllPets();
    }, []);

    useEffect(() => {
        // Filtrar pets baseado no termo de busca
        const filtered = pets.filter(pet =>
            pet.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pet.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pet.raca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pet.dono?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pet.dono?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPets(filtered);
    }, [pets, searchTerm]);

    const fetchAllPets = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            
            const response = await axios.get('/admin/pets', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('Dados dos pets recebidos:', response.data); // DEBUG
            setPets(response.data);
        } catch (err) {
            console.error('Erro ao buscar pets:', err);
            setError(err.response?.data?.detail || 'Erro ao carregar pets. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3000);
    };

    const handleEditClick = (pet) => {
        setEditingId(pet.id);
        setFormData({
            nome: pet.nome || '',
            tipo: pet.tipo || '',
            raca: pet.raca || '',
            idade: pet.idade?.toString() || '',
            peso: pet.peso?.toString() || ''
        });
        setFormError('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ nome: '', tipo: '', raca: '', idade: '', peso: '' });
        setFormError('');
    };

    const handleSave = async (petId) => {
        if (!formData.nome.trim() || !formData.tipo.trim() || !formData.raca.trim() || !formData.idade.trim()) {
            setFormError('Nome, tipo, raça e idade são obrigatórios.');
            return;
        }

        if (parseInt(formData.idade) < 0) {
            setFormError('A idade não pode ser negativa.');
            return;
        }

        if (formData.peso && parseFloat(formData.peso) < 0) {
            setFormError('O peso não pode ser negativo.');
            return;
        }

        try {
            setFormLoading(true);
            setFormError('');
            const token = localStorage.getItem('token');
            
            const dataToUpdate = {
                nome: formData.nome.trim(),
                tipo: formData.tipo.trim(),
                raca: formData.raca.trim(),
                idade: parseInt(formData.idade),
                peso: formData.peso ? parseFloat(formData.peso) : null
            };

            const response = await axios.put(`/admin/pets/${petId}`, dataToUpdate, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Atualizar a lista local
            setPets(prevPets => 
                prevPets.map(pet => 
                    pet.id === petId 
                        ? { ...pet, ...response.data }
                        : pet
                )
            );

            showToast(`Pet "${formData.nome}" editado com sucesso!`, 'success');
            setEditingId(null);
            setFormData({ nome: '', tipo: '', raca: '', idade: '', peso: '' });

        } catch (err) {
            console.error('Erro ao atualizar pet:', err);
            const errorMessage = err.response?.data?.detail || 'Erro ao atualizar pet. Tente novamente.';
            showToast(errorMessage, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const avatarColor = (nome) => {
        let hash = 0;
        for (let i = 0; i < (nome?.length || 0); i++) {
            hash = nome.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return "#" + "00000".substring(0, 6 - c.length) + c;
    };

    if (loading) {
        return (
            <div className="login-container">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <h2>Carregando pets...</h2>
                </div>
            </div>
        );
    }

    if (error && pets.length === 0) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="error-message">{error}</div>
                    <button className="btn-submit" onClick={onBack}>Voltar</button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Modal de Transferência de Pet */}
            {isTransferModalOpen && petToTransfer && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '600px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                        position: 'relative'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>Transferir Pet: {petToTransfer.nome}</h2>
                        <p style={{ marginBottom: '1rem', color: '#7f8c8d' }}>
                            Dono Atual: <strong>{petToTransfer.dono?.nome || petToTransfer.cliente_nome || 'Não informado'}</strong>
                        </p>

                        {transferError && (
                            <div style={{
                                padding: '0.75rem',
                                background: '#fdd',
                                color: '#c33',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                marginBottom: '1rem'
                            }}>
                                {transferError}
                            </div>
                        )}

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                                Buscar Novo Dono (Nome ou CPF)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={searchClientTerm}
                                    onChange={(e) => setSearchClientTerm(e.target.value)}
                                    placeholder="Digite nome ou CPF do novo cliente"
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '8px',
                                        fontSize: '1rem'
                                    }}
                                    disabled={isSearching || formLoading}
                                />
                                <button
                                    onClick={handleSearchClient}
                                    disabled={isSearching || formLoading || searchClientTerm.length < 3}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        backgroundColor: '#4a9b8e',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s',
                                        opacity: (isSearching || formLoading || searchClientTerm.length < 3) ? 0.6 : 1
                                    }}
                                >
                                    {isSearching ? 'Buscando...' : 'Buscar'}
                                </button>
                            </div>
                        </div>

                        {searchResults.length > 0 && (
                            <div style={{ marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', padding: '0.5rem' }}>
                                <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Resultados da Busca:</p>
                                {searchResults.map(client => (
                                    <div
                                        key={client.id}
                                        onClick={() => setSelectedNewOwner(client)}
                                        style={{
                                            padding: '0.75rem',
                                            margin: '0.25rem 0',
                                            backgroundColor: selectedNewOwner?.id === client.id ? '#e8f6f3' : 'white',
                                            border: selectedNewOwner?.id === client.id ? '1px solid #4a9b8e' : '1px solid #f0f0f0',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <strong>{client.nome}</strong> ({client.email})
                                            <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#7f8c8d' }}>
                                                CPF: {client.cpf || 'Não informado'}
                                            </span>
                                        </div>
                                        {!client.is_ativo && (
                                            <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>INATIVO</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedNewOwner && (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '2px solid #4a9b8e', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
                                <p style={{ margin: 0, fontWeight: 'bold', color: '#2c3e50' }}>Novo Dono Selecionado:</p>
                                <p style={{ margin: '0.5rem 0 0 0' }}>
                                    {selectedNewOwner.nome} ({selectedNewOwner.email})
                                    {selectedNewOwner.is_ativo === false && (
                                        <span style={{ color: '#e74c3c', fontWeight: 'bold', marginLeft: '1rem' }}> (INATIVO - Não pode receber o pet)</span>
                                    )}
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                onClick={handleCloseTransferModal}
                                disabled={formLoading}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#ccc',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    opacity: formLoading ? 0.6 : 1
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmTransfer}
                                disabled={formLoading || !selectedNewOwner || selectedNewOwner.is_ativo === false || petToTransfer.cliente_id === selectedNewOwner.id}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#e67e22',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    opacity: (formLoading || !selectedNewOwner || selectedNewOwner.is_ativo === false || petToTransfer.cliente_id === selectedNewOwner.id) ? 0.6 : 1
                                }}
                            >
                                {formLoading ? 'Transferindo...' : 'Confirmar Transferência'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Histórico do Pet */}
            {showHistoryModal && selectedPetForHistory && (
                <PetHistoryModal 
                    pet={selectedPetForHistory}
                    onClose={handleCloseHistoryModal}
                />
            )}

            {/* notificaçoes toasts */}
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    top: '2rem',
                    right: '2rem',
                    zIndex: 9999,
                    background: toast.type === 'success' ? '#27ae60' : '#e74c3c',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    minWidth: '300px',
                    maxWidth: '500px',
                    animation: 'slideInRight 0.3s ease-out'
                }}>
                    {toast.type === 'success' ? <IconCheckCircle /> : <IconAlertCircle />}
                    <span style={{ 
                        fontSize: '0.9375rem', 
                        fontWeight: '500',
                        flex: 1
                    }}>
                        {toast.message}
                    </span>
                </div>
            )}

            <style>
                {`
                    @keyframes slideInRight {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `}
            </style>

            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">Gerenciar Pets</h1>
                    <p className="animate-fade-in-up">
                        Visualize e edite as informações de todos os pets cadastrados no sistema.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn btn-outline-white hover-lift" onClick={onBack}>
                            ← Voltar
                        </button>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="text-center" style={{marginBottom: '2rem'}}>
                        <h2 className="section-title">Pets Cadastrados</h2>
                        <p className="section-description">
                            Total de {filteredPets.length} pet{filteredPets.length !== 1 ? 's' : ''} encontrado{filteredPets.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Campo de busca */}
                    <div style={{
                        marginBottom: '2rem',
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '600px'
                        }}>
                            <div style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#95a5a6'
                            }}>
                                <IconSearch />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por nome do pet, tipo, raça ou cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '1rem 1rem 1rem 3rem',
                                    fontSize: '1rem',
                                    border: '2px solid #ecf0f1',
                                    borderRadius: '12px',
                                    outline: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#4a9b8e';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(74, 155, 142, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#ecf0f1';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>

                    {/* Cards de pets */}
                    {filteredPets.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '4rem 2rem',
                            background: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                        }}>
                            <div style={{ color: '#4a9b8e', marginBottom: '1rem' }}>
                                <IconPaw />
                            </div>
                            <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>Nenhum pet encontrado</h3>
                            <p style={{ color: '#7f8c8d' }}>
                                {searchTerm 
                                    ? 'Nenhum pet corresponde aos critérios de busca.' 
                                    : 'Não há pets cadastrados no sistema.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {filteredPets.map(pet => (
                                <div 
                                    key={pet.id}
                                    style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {/* Header do card */}
                                    <div style={{
                                        padding: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        borderBottom: '1px solid #f0f0f0'
                                    }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            backgroundColor: avatarColor(pet.nome),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem',
                                            fontWeight: '600',
                                            color: 'white',
                                            flexShrink: 0
                                        }}>
                                            {pet.nome?.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{
                                                color: '#2c3e50',
                                                fontSize: '1.125rem',
                                                fontWeight: '600',
                                                margin: '0 0 0.25rem 0',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {pet.nome}
                                            </h3>
                                            <p style={{
                                                color: '#7f8c8d',
                                                fontSize: '0.875rem',
                                                margin: 0,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                Cliente: {pet.dono?.nome || pet.cliente_nome || 'Não informado'}
                                            </p>
                                        </div>
                                        
                                        {/* Botões de ação */}
                                        {editingId === pet.id ? (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleSave(pet.id)}
                                                    disabled={formLoading}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: '#27ae60',
                                                        color: 'white',
                                                        cursor: formLoading ? 'not-allowed' : 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s ease',
                                                        opacity: formLoading ? 0.6 : 1
                                                    }}
                                                    onMouseEnter={(e) => !formLoading && (e.target.style.background = '#229954')}
                                                    onMouseLeave={(e) => (e.target.style.background = '#27ae60')}
                                                    title="Salvar alterações"
                                                >
                                                    <IconSave />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={formLoading}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: '#e74c3c',
                                                        color: 'white',
                                                        cursor: formLoading ? 'not-allowed' : 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s ease',
                                                        opacity: formLoading ? 0.6 : 1
                                                    }}
                                                    onMouseEnter={(e) => !formLoading && (e.target.style.background = '#c0392b')}
                                                    onMouseLeave={(e) => (e.target.style.background = '#e74c3c')}
                                                    title="Cancelar edição"
                                                >
                                                    <IconCancel />
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {/* Botão Histórico */}
                                                <button
                                                    onClick={() => handleShowHistory(pet)}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: '#9b59b6',
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = '#8e44ad';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = '#9b59b6';
                                                    }}
                                                    title="Ver Histórico"
                                                >
                                                    <IconHistory />
                                                </button>

                                                {/* Botão Transferir */}
                                                <button
                                                    onClick={() => handleTransferClick(pet)}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: '#3498db',
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = '#2980b9';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = '#3498db';
                                                    }}
                                                    title="Transferir Pet"
                                                >
                                                    <IconTransfer />
                                                </button>

                                                {/* Botão Editar */}
                                                <button
                                                    onClick={() => handleEditClick(pet)}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: '#c66611ff',
                                                        color: '#ffffffff',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = '#b0550eff';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = '#c66611ff';
                                                    }}
                                                    title="Editar pet"
                                                >
                                                    <IconEdit />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Body do card */}
                                    <div style={{ padding: '1.5rem' }}>
                                        {editingId === pet.id ? (
                                            // Modo de edição
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {formError && (
                                                    <div style={{
                                                        padding: '0.75rem',
                                                        background: '#fee',
                                                        color: '#c33',
                                                        borderRadius: '8px',
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {formError}
                                                    </div>
                                                )}
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                    <div>
                                                        <label style={{
                                                            display: 'block',
                                                            fontSize: '0.875rem',
                                                            fontWeight: '500',
                                                            color: '#495057',
                                                            marginBottom: '0.5rem'
                                                        }}>
                                                            Nome *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.nome}
                                                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                            disabled={formLoading}
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.625rem',
                                                                border: '1px solid #dee2e6',
                                                                borderRadius: '6px',
                                                                fontSize: '0.9375rem',
                                                                outline: 'none',
                                                                transition: 'border-color 0.2s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#4a9b8e'}
                                                            onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label style={{
                                                            display: 'block',
                                                            fontSize: '0.875rem',
                                                            fontWeight: '500',
                                                            color: '#495057',
                                                            marginBottom: '0.5rem'
                                                        }}>
                                                            Tipo *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.tipo}
                                                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                                            disabled={formLoading}
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.625rem',
                                                                border: '1px solid #dee2e6',
                                                                borderRadius: '6px',
                                                                fontSize: '0.9375rem',
                                                                outline: 'none',
                                                                transition: 'border-color 0.2s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#4a9b8e'}
                                                            onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                                                        />
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                    <div>
                                                        <label style={{
                                                            display: 'block',
                                                            fontSize: '0.875rem',
                                                            fontWeight: '500',
                                                            color: '#495057',
                                                            marginBottom: '0.5rem'
                                                        }}>
                                                            Raça *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.raca}
                                                            onChange={(e) => setFormData({ ...formData, raca: e.target.value })}
                                                            disabled={formLoading}
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.625rem',
                                                                border: '1px solid #dee2e6',
                                                                borderRadius: '6px',
                                                                fontSize: '0.9375rem',
                                                                outline: 'none',
                                                                transition: 'border-color 0.2s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#4a9b8e'}
                                                            onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label style={{
                                                            display: 'block',
                                                            fontSize: '0.875rem',
                                                            fontWeight: '500',
                                                            color: '#495057',
                                                            marginBottom: '0.5rem'
                                                        }}>
                                                            Idade (anos) *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={formData.idade}
                                                            onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                                                            disabled={formLoading}
                                                            min="0"
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.625rem',
                                                                border: '1px solid #dee2e6',
                                                                borderRadius: '6px',
                                                                fontSize: '0.9375rem',
                                                                outline: 'none',
                                                                transition: 'border-color 0.2s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#4a9b8e'}
                                                            onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label style={{
                                                        display: 'block',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '500',
                                                        color: '#495057',
                                                        marginBottom: '0.5rem'
                                                    }}>
                                                        Peso (kg)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={formData.peso}
                                                        onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                                                        disabled={formLoading}
                                                        step="0.1"
                                                        min="0"
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.625rem',
                                                            border: '1px solid #dee2e6',
                                                            borderRadius: '6px',
                                                            fontSize: '0.9375rem',
                                                            outline: 'none',
                                                            transition: 'border-color 0.2s'
                                                        }}
                                                        onFocus={(e) => e.target.style.borderColor = '#4a9b8e'}
                                                        onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            // Modo de visualização
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{
                                                        color: '#7f8c8d',
                                                        fontSize: '0.9375rem',
                                                        fontWeight: '500'
                                                    }}>Tipo:</span>
                                                    <span style={{
                                                        color: '#2c3e50',
                                                        fontSize: '0.9375rem',
                                                        fontWeight: '400'
                                                    }}>{pet.tipo || 'Não informado'}</span>
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{
                                                        color: '#7f8c8d',
                                                        fontSize: '0.9375rem',
                                                        fontWeight: '500'
                                                    }}>Raça:</span>
                                                    <span style={{
                                                        color: '#2c3e50',
                                                        fontSize: '0.9375rem',
                                                        fontWeight: '400'
                                                    }}>{pet.raca || 'Não informado'}</span>
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{
                                                        color: '#7f8c8d',
                                                        fontSize: '0.9375rem',
                                                        fontWeight: '500'
                                                    }}>Idade:</span>
                                                    <span style={{
                                                        color: '#2c3e50',
                                                        fontSize: '0.9375rem',
                                                        fontWeight: '400'
                                                    }}>{pet.idade ? `${pet.idade} anos` : 'Não informado'}</span>
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{
                                                        color: '#7f8c8d',
                                                        fontSize: '0.9375rem',
                                                        fontWeight: '500'
                                                    }}>Peso:</span>
                                                    <span style={{
                                                        color: '#2c3e50',
                                                        fontSize: '0.9375rem',
                                                        fontWeight: '400'
                                                    }}>{pet.peso ? `${pet.peso} kg` : 'Não informado'}</span>
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{
                                                        color: '#7f8c8d',
                                                        fontSize: '0.9375rem',
                                                        fontWeight: '500'
                                                    }}>Dono:</span>
                                                    <span style={{
                                                        color: '#2c3e50',
                                                        fontSize: '0.9375rem',
                                                        fontWeight: '400'
                                                    }}>{pet.dono?.nome || pet.cliente_nome || 'Não informado'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

export default VisualizarPetsGestor;