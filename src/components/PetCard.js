import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './PetCard.css';

function PencilIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" >
            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V12h2.293l6.5-6.5z"/>
        </svg>
    );
}
function PetCard({ pet, onViewHistory, onPetUpdated }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        nome: '', tipo: '', raca: '', idade: '', peso: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditing) {
            setFormData({
                nome: pet.nome || '',
                tipo: pet.tipo || '',
                raca: pet.raca || '',
                idade: pet.idade || '',
                peso: pet.peso || '',
            });
        }
    }, [isEditing, pet]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const token = localStorage.getItem('token');
            //pega apenas os campos que foram realmente alterados para enviar
            const dataToUpdate = {};
            if (formData.nome !== pet.nome) dataToUpdate.nome = formData.nome;
            if (formData.tipo !== pet.tipo) dataToUpdate.tipo = formData.tipo;
            if (formData.raca !== pet.raca) dataToUpdate.raca = formData.raca;
            if (parseInt(formData.idade) !== pet.idade) dataToUpdate.idade = parseInt(formData.idade);
            if (parseFloat(formData.peso) !== pet.peso) dataToUpdate.peso = formData.peso ? parseFloat(formData.peso) : null;

            // Se nenhum campo mudou, não faz a chamada de API
            if (Object.keys(dataToUpdate).length === 0) {
                setIsEditing(false);
                return;
            }

            const response = await axios.put(`/pets/${pet.id}`, dataToUpdate, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });

            onPetUpdated(response.data);
            setIsEditing(false);
        } catch (err) {
            setError('Erro ao salvar. Verifique os dados.');
        }
    };
    return (
        <div className="pet-card">
            {isEditing ? (
                <form onSubmit={handleSave} className="pet-edit-form">
                    <div className="form-group-edit">
                        <label>Nome:</label>
                        <input name="nome" type="text" value={formData.nome} onChange={handleInputChange} required/>
                    </div>
                    <div className="form-group-edit">
                        <label>Tipo:</label>
                        <input name="tipo" type="text" value={formData.tipo} onChange={handleInputChange} required/>
                    </div>
                    <div className="form-group-edit">
                        <label>Raça:</label>
                        <input name="raca" type="text" value={formData.raca} onChange={handleInputChange} required/>
                    </div>
                    <div className="form-group-edit">
                        <label>Idade:</label>
                        <input name="idade" type="number" value={formData.idade} onChange={handleInputChange} required/>
                    </div>
                    <div className="form-group-edit">
                        <label>Peso (kg):</label>
                        <input name="peso" type="number" step="0.1" value={formData.peso} onChange={handleInputChange} />
                    </div>

                    {error && <small className="error-text">{error}</small>}
                    <div className="edit-buttons">
                        <button type="submit">Salvar</button>
                        <button type="button" onClick={() => { setIsEditing(false); setError(''); }}>Cancelar</button>
                    </div>
                </form>
            ) : (
                <>
                    <button className="edit-button" onClick={() => setIsEditing(true)}><PencilIcon /></button>
                    <div className="pet-info" onClick={onViewHistory}>
                        <h3>{pet.nome || 'Não informado'}</h3>
                        <p><strong>Tipo:</strong> {pet.tipo || 'Não informado'}</p>
                        <p><strong>Raça:</strong> {pet.raca || 'Não informado'}</p>
                        <p><strong>Idade:</strong> {pet.idade ? `${pet.idade} anos` : 'Não informado'}</p>
                        <p><strong>Peso:</strong> {pet.peso ? `${pet.peso} kg` : 'Não informado'}</p>
                    </div>
                </>
            )}
        </div>
    );
}
export default PetCard;