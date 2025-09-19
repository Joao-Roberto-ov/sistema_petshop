import React, { useState } from 'react';
import axios from '../api/axios';

function PetCadastroScreen({ onNavigateToHome }) {
    const [formData, setFormData] = useState({ nome: '', tipo: '', raca: '', idade: '', peso: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("Você não está autenticado. Faça login novamente.");
                setLoading(false);
                return;
            }

            const dadosParaEnviar = {
                ...formData,
                idade: parseInt(formData.idade),
                peso: formData.peso ? parseFloat(formData.peso) : null,
            };

            await axios.post('/pets', dadosParaEnviar, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setSuccess(`Pet '${formData.nome}' cadastrado com sucesso!`);
            setFormData({ nome: '', tipo: '', raca: '', idade: '', peso: '' });
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao cadastrar o pet.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Cadastrar Novo Pet</h1>
                    <p>Preencha as informações do seu companheiro.</p>
                </div>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nome *</label>
                        <input type="text" className="form-input" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tipo (ex: Cachorro, Gato) *</label>
                        <input type="text" className="form-input" value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Raça *</label>
                        <input type="text" className="form-input" value={formData.raca} onChange={(e) => setFormData({...formData, raca: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Idade (anos) *</label>
                        <input type="number" className="form-input" value={formData.idade} onChange={(e) => setFormData({...formData, idade: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Peso (kg) (Opcional)</label>
                        <input type="number" step="0.1" className="form-input" value={formData.peso} onChange={(e) => setFormData({...formData, peso: e.target.value})} />
                    </div>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Cadastrando...' : 'Cadastrar Pet'}
                    </button>
                </form>
                <div className="login-footer">
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>Voltar para o Início</a>
                </div>
            </div>
        </div>
    );
}

export default PetCadastroScreen;