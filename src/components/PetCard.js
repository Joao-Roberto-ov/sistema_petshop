import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './PetCard.css';

const IconPencil = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
);

const IconHistoryLog = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        <line x1="8" y1="12" x2="16" y2="12"></line>
        <line x1="8" y1="16" x2="16" y2="16"></line>
    </svg>
);

function PetCard({ pet, onViewHistory, onPetUpdated }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        tipo: 'Cão',
        raca: '',
        idade: '',
        peso: '',
        sexo_biologico: '',
        observacoes: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isEditing) {
            setFormData({
                nome: pet.nome || '',
                tipo: pet.tipo || 'Cão',
                raca: pet.raca || '',
                idade: pet.idade || '',
                peso: pet.peso || '',
                sexo_biologico: pet.sexo_biologico || '',
                observacoes: pet.observacoes || '',
            });
        }
    }, [isEditing, pet]);

    const capitalizeName = (name) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'nome') {
            setFormData(prev => ({ ...prev, [name]: capitalizeName(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (parseInt(formData.idade) < 0) {
            setError('A idade não pode ser negativa.');
            return;
        }

        if (formData.peso && parseFloat(formData.peso) < 0) {
            setError('O peso não pode ser negativo.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const dataToUpdate = {
                nome: formData.nome,
                tipo: formData.tipo,
                raca: formData.raca,
                idade: parseInt(formData.idade),
                peso: formData.peso ? parseFloat(formData.peso) : null,
                sexo_biologico: formData.sexo_biologico,
                observacoes: formData.observacoes,
            };

            const response = await axios.put(`/pets/${pet.id}`, dataToUpdate, {
                headers: { Authorization: `Bearer ${token}` },
            });

            onPetUpdated(response.data);
            setIsEditing(false);
            setSuccess('Pet atualizado com sucesso!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao salvar.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const avatarColor = () => {
        let hash = 0;
        for (let i = 0; i < (pet.nome?.length || 0); i++) {
            hash = pet.nome.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '000000'.substring(0, 6 - c.length) + c;
    };

    return (
        <div className="pet-card">
            {success && <div className="success-message-card">{success}</div>}
            {error && <div className="error-message-card">{error}</div>}

            <div className="pet-card-header">
                <div className="pet-avatar" style={{ backgroundColor: avatarColor() }}>
                    {pet.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="pet-name-species">
                    <h3 className="pet-name">{pet.nome || 'Não informado'}</h3>
                    <p className="pet-species">{pet.tipo || 'Não informado'}</p>
                </div>
                <div className="pet-card-actions">
                    <button
                        className="action-btn"
                        title="Editar Pet"
                        onClick={() => {
                            setIsEditing(!isEditing);
                            setError('');
                            setSuccess('');
                        }}
                    >
                        <IconPencil />
                    </button>
                    <button className="action-btn" title="Ver Histórico" onClick={onViewHistory}>
                        <IconHistoryLog />
                    </button>
                </div>
            </div>

            <div className="pet-card-body">
                {isEditing ? (
                    <form onSubmit={handleSave} className="pet-edit-form">
                        <div className="form-grid">
                            <div className="form-group-edit">
                                <label>Sexo</label>
                                <select name="sexo_biologico" value={formData.sexo_biologico} onChange={handleInputChange} required>
                                    <option value="">Selecione</option>
                                    <option value="Macho">Macho</option>
                                    <option value="Fêmea">Fêmea</option>
                                </select>
                            </div>

                            <div className="form-group-edit">
                                <label>Nome</label>
                                <input
                                    name="nome"
                                    type="text"
                                    value={formData.nome}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group-edit">
                                <label>Tipo</label>
                                <select name="tipo" value={formData.tipo} onChange={handleInputChange} required>
                                    <option value="Cão">Cão</option>
                                    <option value="Gato">Gato</option>
                                </select>
                            </div>

                            <div className="form-group-edit">
                                <label>Raça</label>
                                <input
                                    name="raca"
                                    type="text"
                                    value={formData.raca}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group-edit">
                                <label>Idade</label>
                                <input
                                    name="idade"
                                    type="number"
                                    value={formData.idade}
                                    onChange={handleInputChange}
                                    min="0"
                                    required
                                />
                            </div>

                            <div className="form-group-edit">
                                <label>Peso (kg)</label>
                                <input
                                    name="peso"
                                    type="number"
                                    step="0.1"
                                    value={formData.peso}
                                    onChange={handleInputChange}
                                    min="0"
                                />
                            </div>

                            <div className="form-group-edit full-width">
                                <label>Observações</label>
                                <textarea
                                    name="observacoes"
                                    value={formData.observacoes}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder="Informações adicionais sobre o pet (opcional)"
                                />
                            </div>
                        </div>
                        {error && <small className="error-text">{error}</small>}

                        <div className="edit-buttons">
                            <button type="submit" className="btn-save">Salvar Alterações</button>
                            <button type="button" className="btn-cancel" onClick={() => { setIsEditing(false); setError(''); setSuccess('');}}>Cancelar</button>
                        </div>
                    </form>
                ) : (
                    <div className="pet-info">
                        <div className="info-item">
                            <span>Tipo</span>
                            <p>{pet.tipo || 'Não informado'}</p>
                        </div>
                        <div className="info-item">
                            <span>Sexo</span>
                            <p>{pet.sexo_biologico || 'Não informado'}</p>
                        </div>
                        <div className="info-item">
                            <span>Raça</span>
                            <p>{pet.raca || 'Não informado'}</p>
                        </div>
                        <div className="info-item">
                            <span>Idade</span>
                            <p>{pet.idade ? `${pet.idade} anos` : 'Não informado'}</p>
                        </div>
                        <div className="info-item">
                            <span>Peso</span>
                            <p>{pet.peso ? `${pet.peso} kg` : 'Não informado'}</p>
                        </div>
                        </div>
                )}
            </div>
        </div>
    );
}

export default PetCard;
