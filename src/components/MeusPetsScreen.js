// Arquivo completo e ajustado para: src/components/MeusPetsScreen.js

import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import PetCard from './PetCard';
import PetHistoryModal from './PetHistoryModal';
import './MeusPetsScreen.css';

function MeusPetsScreen({ onNavigateToPetCadastro }) {
    // ... (nenhuma mudança na lógica interna do componente)
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPet, setSelectedPet] = useState(null);

    useEffect(() => {
        const fetchPets = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/pets', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setPets(response.data);
            } catch (err) {
                setError('Não foi possível buscar os pets. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        };
        fetchPets();
    }, []);

    const handleUpdatePet = (updatedPet) => {
        setPets(pets.map(pet => (pet.id === updatedPet.id ? updatedPet : pet)));
    };

    const renderContent = () => {
        if (loading) return <div className="message">Carregando seus pets...</div>;
        if (error) return <div className="message error-message">{error}</div>;

        if (pets.length === 0) {
            return (
                <div className="no-pets-container">
                    <p className="no-pets-text">Você ainda não cadastrou nenhum companheiro.</p>
                </div>
            );
        }

        return (
            <div className="pets-grid">
                {pets.map(pet => (
                    <PetCard
                        key={pet.id}
                        pet={pet}
                        onViewHistory={() => setSelectedPet(pet)}
                        onPetUpdated={handleUpdatePet}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="meus-pets-container">
            <div className="content-wrapper">
                {/* --- ESTRUTURA JSX ATUALIZADA --- */}
                <div className="header">
                    {/* Agrupa o título e o subtítulo */}
                    <div className="header-text">
                        <h1>Meus Pets</h1>
                        <p>Gerencie as informações e o histórico dos seus companheiros.</p>
                    </div>
                    
                    <button className="btn-add-pet" onClick={onNavigateToPetCadastro}>
                         Cadastrar Novo Pet
                    </button>
                </div>
                
                {renderContent()}
                
                {selectedPet && (
                    <PetHistoryModal
                        pet={selectedPet}
                        onClose={() => setSelectedPet(null)}
                    />
                )}
            </div>
        </div>
    );
}

export default MeusPetsScreen;
