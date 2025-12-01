import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
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

const IconVaccine = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="m14.5 9-5 5"></path>
        <path d="m9.5 9 5 5"></path>
    </svg>
);

function PetCard({ pet, onViewHistory, onViewVaccines, onPetUpdated }) {
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
    const [loading, setLoading] = useState(false);
    const [vacinas, setVacinas] = useState([]);
    const [vacinasLoading, setVacinasLoading] = useState(true);

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

    useEffect(() => {
        const fetchVacinas = async () => {
            setVacinasLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`/vacinas/pet/${pet.id}`, { 
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setVacinas(response.data);
            } catch (err) {
                console.error('Erro ao buscar vacinas:', err);
                // Não exibe erro para o usuário, apenas no console
            } finally {
                setVacinasLoading(false);
            }
        };

        if (pet.id) {
            fetchVacinas();
        }
    }, [pet.id]);

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
        setLoading(true);

        // Validações
        if (parseInt(formData.idade) < 0) {
            setError('A idade não pode ser negativa.');
            setLoading(false);
            return;
        }

        if (formData.peso && parseFloat(formData.peso) < 0) {
            setError('O peso não pode ser negativo.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('userData'));
            const userType = userData?.tipo;
            
            // Preparar dados para envio
            const dataToUpdate = {
                nome: formData.nome,
                tipo: formData.tipo,
                raca: formData.raca,
                idade: formData.idade ? parseInt(formData.idade) : null,
                peso: formData.peso ? parseFloat(formData.peso) : null,
                sexo_biologico: formData.sexo_biologico || null,
                observacoes: formData.observacoes || null,
            };

            console.log('Enviando atualização para pet:', pet.id, dataToUpdate);

            // Clientes sempre usam o endpoint /pets/{id}
            const response = await axios.put(`/pets/${pet.id}`, dataToUpdate, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            console.log('Resposta da atualização:', response.data);
            
            onPetUpdated(response.data);
            setIsEditing(false);
            setSuccess('Pet atualizado com sucesso!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Erro detalhado ao atualizar pet:', err);
            console.error('Resposta do erro:', err.response);
            
            if (err.response?.status === 403) {
                setError('Acesso negado: Você não tem permissão para editar este pet.');
            } else if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else if (err.message) {
                setError(`Erro: ${err.message}`);
            } else {
                setError('Erro ao salvar as alterações. Tente novamente.');
            }
            setTimeout(() => setError(''), 5000);
        } finally {
            setLoading(false);
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
                        disabled={loading}
                    >
                        <IconPencil />
                    </button>
                    <button 
                        className="action-btn" 
                        title="Ver Carteira de Vacinação" 
                        onClick={onViewVaccines}
                        disabled={loading}
                    >
                        <IconVaccine />
                    </button>
                    <button 
                        className="action-btn" 
                        title="Ver Histórico Completo" 
                        onClick={onViewHistory}
                        disabled={loading}
                    >
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
                                <select 
                                    name="sexo_biologico" 
                                    value={formData.sexo_biologico} 
                                    onChange={handleInputChange}
                                    disabled={loading}
                                >
                                    <option value="">Selecione</option>
                                    <option value="Macho">Macho</option>
                                    <option value="Fêmea">Fêmea</option>
                                </select>
                            </div>

                            <div className="form-group-edit">
                                <label>Nome *</label>
                                <input
                                    name="nome"
                                    type="text"
                                    value={formData.nome}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group-edit">
                                <label>Tipo *</label>
                                <select 
                                    name="tipo" 
                                    value={formData.tipo} 
                                    onChange={handleInputChange} 
                                    required
                                    disabled={loading}
                                >
                                    <option value="Cão">Cão</option>
                                    <option value="Gato">Gato</option>
                                    <option value="Ave">Ave</option>
                                    <option value="Roedor">Roedor</option>
                                    <option value="Réptil">Réptil</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>

                            <div className="form-group-edit">
                                <label>Raça *</label>
                                <input
                                    name="raca"
                                    type="text"
                                    value={formData.raca}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group-edit">
                                <label>Idade (anos)</label>
                                <input
                                    name="idade"
                                    type="number"
                                    value={formData.idade}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="50"
                                    disabled={loading}
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
                                    disabled={loading}
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
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="edit-buttons">
                            <button 
                                type="submit" 
                                className="btn-save" 
                                disabled={loading}
                            >
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                            <button 
                                type="button" 
                                className="btn-cancel" 
                                onClick={() => { 
                                    setIsEditing(false); 
                                    setError(''); 
                                    setSuccess('');
                                }}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
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
                        {pet.observacoes && (
                            <div className="info-item full-width">
                                <span>Observações</span>
                                <p>{pet.observacoes}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PetCard;