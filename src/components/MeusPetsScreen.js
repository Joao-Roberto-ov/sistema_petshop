import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import PetCard from './PetCard';
import PetHistoryModal from './PetHistoryModal';
import './MeusPetsScreen.css';

function MeusPetsScreen() {
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
        const newPetsList = pets.map(pet => {
            if (pet.id === updatedPet.id) {
                return updatedPet;
            }
            return pet;
        });
        setPets(newPetsList);
    };

    if (loading) return <div className="loading-message">Carregando seus pets...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="meus-pets-container">
            <h1>Meus Pets</h1>
            {pets.length === 0 ? (
                <p>Você ainda não cadastrou nenhum pet.</p>
            ) : (
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
            )}
            {selectedPet && (
                <PetHistoryModal
                    pet={selectedPet}
                    onClose={() => setSelectedPet(null)}
                />
            )}
        </div>
    );
}
export default MeusPetsScreen;