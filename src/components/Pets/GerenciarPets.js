import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';

// Ícones SVG para os botões
const IconEdit = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

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

const IconToggle = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {isActive ? (
            <path d="M18 6 6 18M6 6l12 12"/>
        ) : (
            <path d="M20 6 9 17l-5-5"/>
        )}
    </svg>
);

function GerenciarPets({ onBack }) {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPet, setEditingPet] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => {
        carregarPets();
    }, []);

    const carregarPets = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/funcionario/pets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPets(response.data);
        } catch (err) {
            console.error('Erro ao carregar pets:', err);
            if (err.response?.status === 422 || err.response?.status === 403) {
                setError('Acesso negado: Apenas gestores podem gerenciar pets de todos os clientes. Verifique suas permissões.');
            } else if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else {
                setError('Erro ao carregar pets. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredPets = pets.filter(pet => {
        const matchesSearch = pet.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            pet.dono?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            pet.especie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            pet.raca?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'todos' || 
                            (statusFilter === 'ativo' && pet.ativo) ||
                            (statusFilter === 'inativo' && !pet.ativo);
        
        return matchesSearch && matchesStatus;
    });

    const handleEdit = (pet) => {
        setEditingPet(pet);
        setEditFormData({
            nome: pet.nome || '',
            especie: pet.especie || '',
            raca: pet.raca || '',
            idade: pet.idade || '',
            peso: pet.peso || '',
            observacoes: pet.observacoes || '',
            ativo: pet.ativo
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/funcionario/pets/${editingPet.id}`, editFormData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            await carregarPets();
            setShowEditModal(false);
            setEditingPet(null);
        } catch (err) {
            console.error('Erro ao editar pet:', err);
            if (err.response?.status === 422 || err.response?.status === 403) {
                setError('Acesso negado: Apenas gestores podem editar pets. Verifique suas permissões.');
            } else if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else {
                setError('Erro ao editar pet. Tente novamente.');
            }
        } finally {
            setEditLoading(false);
        }
    };

    const toggleStatus = async (pet) => {
        const acao = pet.ativo ? 'desativar' : 'ativar';
        const confirmacao = pet.ativo 
            ? `Tem certeza que deseja desativar o pet "${pet.nome}"?\n\nAo desativar, o pet não aparecerá mais na tela "Meus Pets" do cliente, mas permanecerá no banco de dados.`
            : `Tem certeza que deseja ativar o pet "${pet.nome}"?\n\nAo ativar, o pet voltará a aparecer na tela "Meus Pets" do cliente.`;
        
        if (!window.confirm(confirmacao)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(`/funcionario/pets/${pet.id}`, 
                { ...pet, ativo: !pet.ativo }, 
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            await carregarPets();
            
            // Mostrar mensagem de sucesso
            const mensagemSucesso = pet.ativo 
                ? `Pet "${pet.nome}" foi desativado com sucesso. Ele não aparecerá mais na tela do cliente.`
                : `Pet "${pet.nome}" foi ativado com sucesso. Ele voltará a aparecer na tela do cliente.`;
            alert(mensagemSucesso);
            
        } catch (err) {
            console.error('Erro ao alterar status do pet:', err);
            if (err.response?.status === 422 || err.response?.status === 403) {
                setError('Acesso negado: Apenas gestores podem alterar status de pets. Verifique suas permissões.');
            } else if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else {
                setError(`Erro ao ${acao} pet. Tente novamente.`);
            }
        }
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
            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">
                        <IconPaw style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Gerenciar Pets
                    </h1>
                    <p className="animate-fade-in-up">
                        Visualize, edite e gerencie todos os pets cadastrados no sistema.
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
                    <div style={{ 
                        background: 'white', 
                        borderRadius: '16px', 
                        padding: '2rem',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                            {/* Busca */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    Buscar Pets
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <IconSearch style={{ 
                                        position: 'absolute', 
                                        left: '0.75rem', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        color: '#6c757d' 
                                    }} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nome do pet, dono, espécie ou raça..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem 0.75rem 2.5rem',
                                            border: '2px solid #ecf0f1',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#3498db'}
                                        onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
                                    />
                                </div>
                            </div>
                            
                            {/* Filtro de Status */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    Status
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        border: '2px solid #ecf0f1',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        minWidth: '150px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                                    onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
                                >
                                    <option value="todos">Todos os Status</option>
                                    <option value="ativo">Ativos</option>
                                    <option value="inativo">Inativos</option>
                                </select>
                            </div>
                        </div>
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

                    {filteredPets.length === 0 ? (
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '3rem',
                            textAlign: 'center',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐾</div>
                            <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>Nenhum pet encontrado</h3>
                            <p style={{ color: '#7f8c8d' }}>
                                {pets.length === 0 ? 'Nenhum pet cadastrado no sistema.' : 'Tente ajustar os filtros de busca.'}
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                            overflow: 'hidden'
                        }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{
                                        background: 'linear-gradient(135deg, #4a9b8e 0%, #3d8b7e 100%)',
                                        color: 'white'
                                    }}>
                                        <tr>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Pet</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Espécie</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Raça</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Idade</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Peso</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Dono</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Status</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '1rem' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPets.map((pet, index) => (
                                            <tr 
                                                key={pet.id} 
                                                style={{ 
                                                    borderBottom: index === filteredPets.length - 1 ? 'none' : '1px solid #ecf0f1',
                                                    transition: 'background 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ 
                                                    padding: '1rem', 
                                                    fontWeight: '600', 
                                                    color: '#2c3e50' 
                                                }}>
                                                    {pet.nome}
                                                </td>
                                                <td style={{ padding: '1rem', color: '#495057' }}>{pet.especie}</td>
                                                <td style={{ padding: '1rem', color: '#495057' }}>{pet.raca}</td>
                                                <td style={{ padding: '1rem', color: '#495057' }}>{pet.idade}</td>
                                                <td style={{ padding: '1rem', color: '#495057' }}>{pet.peso} kg</td>
                                                <td style={{ padding: '1rem', color: '#495057' }}>{pet.dono?.nome || 'N/A'}</td>
                                                <td style={{ padding: '1rem', fontWeight: '600', color: pet.ativo ? '#28a745' : '#dc3545' }}>
                                                    {pet.ativo ? 'Ativo' : 'Inativo'}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div className="action-buttons">
                                                        <button 
                                                            onClick={() => handleEdit(pet)}
                                                            style={{ color: '#007bff' }}
                                                            title="Editar Pet"
                                                        >
                                                            <IconEdit />
                                                        </button>
                                                        <button 
                                                            onClick={() => toggleStatus(pet)}
                                                            style={{ color: pet.ativo ? '#dc3545' : '#28a745' }}
                                                            title={pet.ativo ? 'Desativar Pet' : 'Ativar Pet'}
                                                        >
                                                            <IconToggle isActive={pet.ativo} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Modal de Edição */}
            {showEditModal && editingPet && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="login-card" style={{ maxWidth: '600px', width: '90%' }}>
                        <div className="login-header">
                            <h2>Editar Pet: {editingPet.nome}</h2>
                            <p>Atualize as informações do pet.</p>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Nome</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editFormData.nome}
                                        onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Espécie</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editFormData.especie}
                                        onChange={(e) => setEditFormData({ ...editFormData, especie: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Raça</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editFormData.raca}
                                        onChange={(e) => setEditFormData({ ...editFormData, raca: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Idade</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={editFormData.idade}
                                        onChange={(e) => setEditFormData({ ...editFormData, idade: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Peso (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="form-input"
                                        value={editFormData.peso}
                                        onChange={(e) => setEditFormData({ ...editFormData, peso: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Observações</label>
                                    <textarea
                                        className="form-input"
                                        value={editFormData.observacoes}
                                        onChange={(e) => setEditFormData({ ...editFormData, observacoes: e.target.value })}
                                        rows="3"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ativo</label>
                                <input
                                    type="checkbox"
                                    checked={editFormData.ativo}
                                    onChange={(e) => setEditFormData({ ...editFormData, ativo: e.target.checked })}
                                    style={{ width: 'auto', marginRight: '0.5rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button 
                                    type="button" 
                                    className="btn btn-outline-secondary" 
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-submit" 
                                    disabled={editLoading}
                                    style={{ width: 'auto' }}
                                >
                                    {editLoading ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default GerenciarPets;
