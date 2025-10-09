import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import PetCard from './PetCard';
import PetHistoryModal from './PetHistoryModal';
import './MeusPetsScreen.css'; // O CSS correspondente está abaixo

// --- Ícones SVG para um visual mais limpo ---
const IconPlus = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
 );

const IconPaw = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon-paw">
        <path d="M11.5 21a.5.5 0 0 1-.5-.5v-4.34a1.5 1.5 0 0 0-1.5-1.5h-2.34a.5.5 0 0 1-.5-.5v-2.34a.5.5 0 0 1 .5-.5H9.5a1.5 1.5 0 0 0 1.5-1.5V7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v2.34a1.5 1.5 0 0 0 1.5 1.5h2.34a.5.5 0 0 1 .5.5v2.34a.5.5 0 0 1-.5.5h-2.34a1.5 1.5 0 0 0-1.5 1.5V20.5a.5.5 0 0 1-.5.5h-1z"/>
        <path d="M7.5 8.5a1 1 0 1 0-2 0 1 1 0 0 0 2 0zM16.5 8.5a1 1 0 1 0-2 0 1 1 0 0 0 2 0zM12 5.5a1 1 0 1 0-2 0 1 1 0 0 0 2 0z"/>
    </svg>
 );


function MeusPetsScreen({ onNavigateToPetCadastro }) {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPet, setSelectedPet] = useState(null);

    useEffect(() => {
        const fetchPets = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/pets', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                // Filtrar apenas pets ativos para exibir na tela do cliente
                const petsAtivos = response.data.filter(pet => pet.ativo !== false);
                setPets(petsAtivos);
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
        if (loading) {
            return <div className="message loading-message">Carregando seus pets...</div>;
        }
        if (error) {
            return <div className="message error-message">{error}</div>;
        }
        if (pets.length === 0) {
            return (
                <div className="no-pets-container">
                    <IconPaw />
                    <h2 className="no-pets-title">Nenhum companheiro por aqui ainda</h2>
                    <p className="no-pets-text">Que tal cadastrar seu primeiro pet? É rápido e fácil!</p>
                    <button className="btn-add-pet" onClick={onNavigateToPetCadastro}>
                        <IconPlus /> Cadastrar Primeiro Pet
                    </button>
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
                <div className="header">
                    <div className="header-text">
                        <h1>Meus Pets</h1>
                        <p>Gerencie as informações e o histórico dos seus companheiros.</p>
                    </div>
                    {pets.length > 0 && (
                        <button className="btn-add-pet" onClick={onNavigateToPetCadastro}>
                            <IconPlus /> Cadastrar Novo Pet
                        </button>
                    )}
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
