import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

const EditarPetModal = ({ pet, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        nome: '',
        tipo: '',
        raca: '',
        sexo_biologico: '',
        idade: '',
        peso: '',
        observacoes: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (pet) {
            setFormData({
                nome: pet.nome || '',
                tipo: pet.tipo || '',
                raca: pet.raca || '',
                sexo_biologico: pet.sexo_biologico || '',
                idade: pet.idade || '',
                peso: pet.peso || '',
                observacoes: pet.observacoes || '',
            });
        }
    }, [pet]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('userData'));
            const cargoId = userData?.cargo_id;
            const cargo = userData?.cargo?.toLowerCase();
            
            // A verificação de permissão é feita no backend. 
            // Este modal é usado em VisualizarPetsGestor/VisualizarPets, que são telas de funcionário/gestor.
            // A edição pelo cliente é feita diretamente no PetCard.js.
            // Manter a lógica para gestor, mas remover a verificação de cliente, pois este modal não é para clientes.
            const isGestor = cargoId === 1 || cargo === 'gestor' || cargo === 'administrador';
            
            if (!isGestor && !pet.dono) { // Se não é gestor e o pet não tem dono (erro de contexto), ou se for um funcionário que não é gestor
                // A lógica de permissão mais robusta está no backend.
                // Aqui, apenas garantimos que a rota correta seja chamada.
                // Se o usuário não for gestor, o backend deve barrar a requisição.
                // A rota /pets/{id} é usada para clientes (quando logados como cliente)
                // A rota /admin/pets/{id} é usada para gestores.
            }

            // Gestores usam endpoint /admin/pets/{id}, outros usam /pets/{id}
            let endpoint;
            if (isGestor) {
                endpoint = `/admin/pets/${pet.id}`;
            } else {
                // Se não é gestor, assume-se que é o cliente (dono do pet) ou funcionário sem permissão (que será barrado pelo backend)
                endpoint = `/pets/${pet.id}`; 
            }
            
            console.log('Enviando atualização para:', endpoint, formData);
            
            const response = await axios.put(endpoint, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setSuccess('Pet atualizado com sucesso!');
            onUpdate(response.data); 
        } catch (err) {
            console.error('Erro ao atualizar pet:', err);
            if (err.response?.status === 403) {
                setError('Acesso negado: ' + (err.response.data?.detail || 'Você não tem permissão para editar este pet.'));
            } else if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError(err.message || 'Erro ao atualizar pet. Verifique os dados e tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!pet) return null;

    return (
        <div className="modal-backdrop" style={modalBackdropStyle}>
            <div className="modal-content" style={modalContentStyle}>
                <button 
                    onClick={onClose} 
                    style={closeButtonStyle}
                    title="Fechar"
                >
                    ×
                </button>
                
                <h2 style={modalTitleStyle}>Editar Pet: {pet.nome}</h2>
                
                <div style={petInfoStyle}>
                    <p><strong>Dono:</strong> {pet.dono?.nome || 'N/A'}</p>
                    <p><strong>ID do Pet:</strong> {pet.id}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Linha 1: Nome e Tipo */}
                    <div style={formRowStyle}>
                        <div style={formGroupStyle}>
                            <label style={labelStyle} htmlFor="nome">Nome *</label>
                            <input
                                style={inputStyle}
                                type="text"
                                id="nome"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div style={formGroupStyle}>
                            <label style={labelStyle} htmlFor="tipo">Espécie (Tipo) *</label>
                            <select
                                style={inputStyle}
                                id="tipo"
                                name="tipo"
                                value={formData.tipo}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            >
                                <option value="">Selecione a espécie</option>
                                <option value="Cão">Cão</option>
                                <option value="Gato">Gato</option>
                            </select>
                        </div>
                    </div>

                    {/* Linha 2: Raça e Sexo Biológico */}
                    <div style={formRowStyle}>
                        <div style={formGroupStyle}>
                            <label style={labelStyle} htmlFor="raca">Raça *</label>
                            <input
                                style={inputStyle}
                                type="text"
                                id="raca"
                                name="raca"
                                value={formData.raca}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div style={formGroupStyle}>
                            <label style={labelStyle} htmlFor="sexo_biologico">Sexo Biológico</label>
                            <select
                                style={inputStyle}
                                id="sexo_biologico"
                                name="sexo_biologico"
                                value={formData.sexo_biologico}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">Selecione</option>
                                <option value="Macho">Macho</option>
                                <option value="Fêmea">Fêmea</option>
                            </select>
                        </div>
                    </div>

                    {/* Linha 3: Idade e Peso */}
                    <div style={formRowStyle}>
                        <div style={formGroupStyle}>
                            <label style={labelStyle} htmlFor="idade">Idade (anos)</label>
                            <input
                                style={inputStyle}
                                type="number"
                                id="idade"
                                name="idade"
                                value={formData.idade}
                                onChange={handleChange}
                                min="0"
                                max="50"
                                step="0.1"
                                disabled={loading}
                            />
                        </div>
                        <div style={formGroupStyle}>
                            <label style={labelStyle} htmlFor="peso">Peso (kg)</label>
                            <input
                                style={inputStyle}
                                type="number"
                                id="peso"
                                name="peso"
                                value={formData.peso}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Linha 4: Observações */}
                    <div style={formGroupStyle}>
                        <label style={labelStyle} htmlFor="observacoes">Observações</label>
                        <textarea
                            style={{ ...inputStyle, minHeight: '80px' }}
                            id="observacoes"
                            name="observacoes"
                            value={formData.observacoes}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="Observações sobre o pet..."
                        />
                    </div>

                    {error && (
                        <div style={errorStyle}>
                            <strong>Erro:</strong> {error}
                        </div>
                    )}
                    {success && (
                        <div style={successStyle}>
                            <strong>Sucesso:</strong> {success}
                        </div>
                    )}

                    <div style={buttonGroupStyle}>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            style={cancelButtonStyle}
                            disabled={loading}
                        >
                            {success ? 'Fechar' : 'Cancelar'}
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            style={{
                                ...submitButtonStyle,
                                opacity: loading ? 0.6 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Estilos atualizados
const modalBackdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
};

const modalContentStyle = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
};

const closeButtonStyle = {
    position: 'absolute',
    top: '15px',
    right: '20px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6c757d',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
};

const modalTitleStyle = {
    borderBottom: '2px solid #4a9b8e',
    paddingBottom: '15px',
    marginBottom: '20px',
    color: '#2c3e50',
    textAlign: 'center',
    fontSize: '1.5rem',
    marginRight: '30px',
};

const petInfoStyle = {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    borderLeft: '4px solid #4a9b8e',
};

const formRowStyle = {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
};

const formGroupStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
};

const labelStyle = {
    marginBottom: '8px',
    fontWeight: '600',
    color: '#495057',
    fontSize: '14px',
};

const inputStyle = {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
};

const buttonGroupStyle = {
    marginTop: '30px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
};

const submitButtonStyle = {
    padding: '12px 24px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#28a745',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
};

const cancelButtonStyle = {
    padding: '12px 24px',
    borderRadius: '6px',
    border: '1px solid #6c757d',
    backgroundColor: '#f8f9fa',
    color: '#495057',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const errorStyle = {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '6px',
    padding: '15px',
    marginTop: '20px',
    marginBottom: '10px',
};

const successStyle = {
    color: '#155724',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '6px',
    padding: '15px',
    marginTop: '20px',
    marginBottom: '10px',
};

// Adicionar hover effects
Object.assign(submitButtonStyle, {
    ':hover': {
        backgroundColor: '#218838',
        transform: 'translateY(-1px)',
    }
});

Object.assign(cancelButtonStyle, {
    ':hover': {
        backgroundColor: '#e2e6ea',
        transform: 'translateY(-1px)',
    }
});

Object.assign(closeButtonStyle, {
    ':hover': {
        backgroundColor: '#f8f9fa',
        color: '#495057',
    }
});

Object.assign(inputStyle, {
    ':focus': {
        outline: 'none',
        borderColor: '#4a9b8e',
        boxShadow: '0 0 0 3px rgba(74, 155, 142, 0.1)',
    }
});

export default EditarPetModal;