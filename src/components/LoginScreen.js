import React, { useState } from 'react';
import axios from '../api/axios';

function LoginScreen({ onLogin, onNavigateToSignup, setUserData }) {
    const [formData, setFormData] = useState({ email: '', senha: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/login', formData);
            localStorage.setItem('token', response.data.access_token);

            const userData = {
                nome: response.data.user?.nome || formData.email.split('@')[0],
                email: formData.email,
                telefone: response.data.user?.telefone || ''
            };

            localStorage.setItem('userData', JSON.stringify(userData));
            setUserData(userData);
            onLogin(userData);

        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao fazer login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>PetLife</h1>
                    <p>Entre na sua conta para continuar</p>
                </div>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">E-mail <span className="required">*</span></label>
                        <input type="email" className="form-input" placeholder="seu@email.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Senha <span className="required">*</span></label>
                        <input type="password" className="form-input" placeholder="Sua senha" value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} required />
                    </div>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
                <div className="login-footer">
                    Não tem uma conta? <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToSignup(); }}>Cadastre-se</a>
                </div>
            </div>
        </div>
    );
}

export default LoginScreen;