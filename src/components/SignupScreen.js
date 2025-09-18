import React, { useState } from 'react';
import axios from '../api/axios';

function SignupScreen({ onNavigateToLogin }) {
    const [formData, setFormData] = useState({ nome: '', email: '', senha: '', telefone: '', cpf: '', endereco: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const dadosParaEnviar = {
                ...formData,
                cpf: formData.cpf.replace(/\D/g, '') || null,
            };
            await axios.post('/signup', dadosParaEnviar);
            setSuccess('Conta criada com sucesso! Redirecionando para o login...');
            setTimeout(() => onNavigateToLogin(), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao criar conta.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>PetLife</h1>
                    <p>Crie sua conta para começar</p>
                </div>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                <form onSubmit={handleSubmit}>
                     <div className="form-group">
                        <label className="form-label">Nome completo *</label>
                        <input type="text" className="form-input" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} required minLength="2" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Senha *</label>
                        <input type="password" className="form-input" value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} required minLength="6" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Telefone *</label>
                        <input type="tel" className="form-input" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">CPF (opcional)</label>
                        <input type="text" className="form-input" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} placeholder="000.000.000-00" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Endereço (opcional)</label>
                        <input type="text" className="form-input" value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})} />
                    </div>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Criando conta...' : 'Criar conta'}
                    </button>
                </form>
                <div className="login-footer">
                    Já tem uma conta? <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }}>Entrar</a>
                </div>
            </div>
        </div>
    );
}

export default SignupScreen;