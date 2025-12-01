import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';

function SelecaoPetProntuario({ onPetSelected, onBack }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPets();
    }, []);

    const fetchPets = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Usa a rota de admin para pegar todos os pets (gestor/veterinário)
            const response = await axios.get('/admin/pets', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPets(response.data);
        } catch (err) {
            console.error("Erro ao buscar pets:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredPets = pets.filter(pet =>
        pet.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pet.dono?.nome || pet.cliente_nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>🩺 Seleção de Paciente (Prontuário)</h2>
                <button className="btn btn-voltar-prontuario" onClick={onBack}>Voltar</button>
            </div>

            <div className="search-container" style={{ marginBottom: '2rem' }}>
                <input
                    type="text"
                    placeholder="Buscar por nome do pet ou do tutor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ padding: '1rem', fontSize: '1.1rem' }}
                />
            </div>

            {loading ? <div className="loading-spinner"></div> : (
                <div className="pets-grid">
                    {filteredPets.map(pet => (
                        <div key={pet.id} className="card" style={{ cursor: 'pointer' }} onClick={() => onPetSelected(pet)}>
                            <div className="card-content" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '50px', height: '50px', borderRadius: '50%', background: '#4a9b8e',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
                                }}>
                                    {pet.nome.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{pet.nome}</h3>
                                    <p style={{ margin: 0, color: '#666' }}>
                                        {pet.tipo} • Tutor: {pet.dono?.nome || pet.cliente_nome || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredPets.length === 0 && <p>Nenhum pet encontrado.</p>}
                </div>
            )}
        </div>
    );
}

export default SelecaoPetProntuario;