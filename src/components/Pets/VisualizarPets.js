import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import PetHistoryModal from './PetHistoryModal';
import EditarPetModal from './EditarPetModal';
import './VisualizarPets.css';

// Ícones SVG
const IconPaw = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="4" r="2"/>
        <circle cx="18" cy="8" r="2"/>
        <circle cx="20" cy="16" r="2"/>
        <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
);

const IconSearch = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.35-4.35"></path>
    </svg>
);

const IconHistory = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v10l4 4"/>
        <path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z"/>
    </svg>
);

const IconEdit = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    </svg>
);

function VisualizarPets({ onBack }) {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [userRole, setUserRole] = useState(null);
    const [userCargoId, setUserCargoId] = useState(null);
    const [userCargo, setUserCargo] = useState(null);
    
    // Estados para os modais
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPet, setSelectedPet] = useState(null);

    useEffect(() => {
        // Obter role do usuário do localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUserRole(parsedUser.cargo?.toLowerCase() || parsedUser.tipo);
                setUserCargoId(parsedUser.cargo_id);
                setUserCargo(parsedUser.cargo);
            } catch (e) {
                console.error('Erro ao parse userData:', e);
            }
        }
        carregarPets();
    }, []);

    const carregarPets = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('userData'));
            const cargoId = userData?.cargo_id;
            
            // Se for gestor ou veterinário, usa endpoint admin
            let endpoint;
            if (cargoId === 1 || cargoId === 3) {
                endpoint = '/admin/pets';
            } else {
                endpoint = '/pets/all';
            }

            const response = await axios.get(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPets(response.data);
        } catch (err) {
            console.error('Erro ao carregar pets:', err);
            if (err.response?.status === 422 || err.response?.status === 403) {
                setError('Acesso negado: Apenas gestores e veterinários podem visualizar todos os pets. Verifique suas permissões.');
            } else if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else {
                setError('Erro ao carregar pets. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePetUpdate = (updatedPet) => {
        setPets(prevPets => prevPets.map(pet => 
            pet.id === updatedPet.id ? updatedPet : pet
        ));
        setShowEditModal(false);
        setSelectedPet(null);
    };

    const filteredPets = pets.filter(pet => {
        return pet.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               pet.dono?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               pet.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               pet.raca?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleShowHistory = async (pet) => {
        setSelectedPet(pet);
        setShowHistoryModal(true);
    };

    const handleEditPet = async (pet) => {
    try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData'));
        const cargoId = userData?.cargo_id;
        const cargo = userData?.cargo?.toLowerCase();
        
        // Verificar se é gestor
        const isGestor = cargoId === 1 || cargo === 'gestor' || cargo === 'administrador';
        
        if (!isGestor) {
            alert('Apenas gestores podem editar pets.');
            return;
        }
        
        setSelectedPet(pet);
        setShowEditModal(true);
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        alert('Erro ao verificar permissões. Tente novamente.');
    }
};

    // Determina se a coluna de Ações deve ser exibida (apenas gestor - cargo_id 1)
    const isGestor = userCargoId === 1 || 
                    userCargo?.toLowerCase() === 'gestor' || 
                    userCargo?.toLowerCase() === 'administrador';
    
    const showActionsColumn = isGestor;

    if (loading) {
        return (
            <div className="login-container">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <h2>Carregando pets...</h2>
                    <div className="loading-spinner"></div>
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
            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">
                        <IconPaw style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Visualizar Pets
                    </h1>
                    <p className="animate-fade-in-up">
                        Visualize todos os pets cadastrados no sistema e suas informações detalhadas.
                        {isGestor && ' (Modo Gestor - Edição disponível)'}
                        {userCargoId === 3 && ' (Modo Veterinário - Apenas visualização)'}
                    </p>
                    <div className="hero-buttons">
                        <button 
                            className="btn btn-outline-white hover-lift" 
                            onClick={onBack}
                        >
                            ← Voltar
                        </button>
                    </div>
                </div>
            </section>

            {error && (
                <section className="section">
                    <div className="container">
                        <div className="error-message" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            {error}
                            <button onClick={carregarPets} className="btn-submit" style={{ marginLeft: '1rem', width: 'auto', padding: '0.5rem 1rem' }}>
                                Tentar Novamente
                            </button>
                        </div>
                    </div>
                </section>
            )}

            <section className="section bg-light">
                <div className="container">
                    {/* Campo de busca */}
                    <div className="search-container">
                        <div className="search-input-wrapper">
                            <div className="search-icon">
                                <IconSearch />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por nome do pet, tipo, raça ou cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            {searchTerm && (
                                <button 
                                    className="clear-search"
                                    onClick={() => setSearchTerm('')}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Estatísticas */}
                    <div className="stats-container">
                        <div className="stat-card">
                            <span className="stat-number">{pets.length}</span>
                            <span className="stat-label">Total de Pets</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{filteredPets.length}</span>
                            <span className="stat-label">Filtrados</span>
                        </div>
                        {isGestor && (
                            <div className="stat-card">
                                <span className="stat-number" style={{color: '#28a745'}}>✓</span>
                                <span className="stat-label">Modo Edição</span>
                            </div>
                        )}
                    </div>

                    {/* Tabela de pets */}
                    <div className="table-container">
                        <table className="pets-table">
                            <thead>
                                <tr>
                                    <th>Nome do Pet</th>
                                    <th>Dono</th>
                                    <th>Espécie</th>
                                    <th>Raça</th>
                                    <th>Sexo</th>
                                    <th>Idade</th>
                                    <th>Peso (kg)</th>
                                    <th>Observações</th>
                                    <th>Histórico</th>
                                    {showActionsColumn && <th>Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPets.length > 0 ? (
                                    filteredPets.map(pet => {
                                        // Define a cor da espécie
                                        let especieClass = '';
                                        const tipoLower = pet.tipo?.toLowerCase();
                                        
                                        if (tipoLower === 'gato' || tipoLower?.includes('gato')) {
                                            especieClass = 'laranja'; // Gato = Laranja
                                        } else if (tipoLower === 'cachorro' || tipoLower === 'cão' || tipoLower?.includes('cachorro')) {
                                            especieClass = 'roxo'; // Cachorro = Roxo
                                        } else {
                                            especieClass = 'verde'; // Outras espécies
                                        }

                                        return (
                                            <tr key={pet.id} className="pet-row">
                                                <td className="pet-name">
                                                    <strong>{pet.nome}</strong>
                                                </td>
                                                <td>{pet.dono?.nome || 'N/A'}</td>
                                                <td>
                                                    <span className={`especie-badge ${especieClass}`}>
                                                        {pet.tipo}
                                                    </span>
                                                </td>
                                                <td>{pet.raca}</td>
                                                <td>
                                                    <span className={`sex-badge ${pet.sexo_biologico?.toLowerCase() || 'unknown'}`}>
                                                        {pet.sexo_biologico || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {pet.idade ? `${pet.idade} anos` : 'N/A'}
                                                </td>
                                                <td>
                                                    {pet.peso ? `${pet.peso} kg` : 'N/A'}
                                                </td>
                                                <td className="observations-cell">
                                                    {pet.observacoes || 'Nenhuma'}
                                                </td>
                                                <td>
                                                    <button 
                                                        className="btn-history"
                                                        onClick={() => handleShowHistory(pet)}
                                                        title={`Visualizar Histórico de ${pet.nome}`}
                                                    >
                                                        <IconHistory />
                                                        Histórico
                                                    </button>
                                                </td>
                                                {showActionsColumn && (
                                                    <td>
                                                        <button 
                                                            className="btn-edit"
                                                            onClick={() => handleEditPet(pet)}
                                                            title={`Editar ${pet.nome}`}
                                                        >
                                                            <IconEdit />
                                                            Editar
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={showActionsColumn ? 10 : 9} className="no-results">
                                            <div className="no-results-content">
                                                <IconPaw />
                                                <p>Nenhum pet encontrado com os filtros aplicados.</p>
                                                {searchTerm && (
                                                    <button 
                                                        className="btn-clear-filters"
                                                        onClick={() => setSearchTerm('')}
                                                    >
                                                        Limpar busca
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {showHistoryModal && selectedPet && (
                <PetHistoryModal 
                    pet={selectedPet}
                    onClose={() => {
                        setShowHistoryModal(false);
                        setSelectedPet(null);
                    }}
                />
            )}

            {showEditModal && selectedPet && (
                <EditarPetModal
                    pet={selectedPet}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedPet(null);
                    }}
                    onUpdate={handlePetUpdate}
                />
            )}
        </>
    );
}

export default VisualizarPets;