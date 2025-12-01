import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';

function ForgotPasswordScreen({ onNavigateToLogin }) {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    // Verificar se há usuário logado
    useEffect(() => {
        const userData = localStorage.getItem('userData');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUserEmail(parsedUser.email);
            setEmail(parsedUser.email); // Preencher automaticamente com o email do perfil
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        // Verificação no frontend
        if (userEmail && email.toLowerCase() !== userEmail.toLowerCase()) {
            setError('O email informado não corresponde ao email do seu perfil. Use o mesmo email da sua conta.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await axios.post('/forgot-password', { email }, { headers });
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao solicitar redefinição de senha. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Recuperar Senha</h1>
                    <p>Digite seu e-mail para receber um link de redefinição de senha</p>
                    {userEmail && (
                        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                            <strong>Observação:</strong> Você está logado como {userEmail}
                        </p>
                    )}
                </div>
                
                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">E-mail <span className="required">*</span></label>
                        <input 
                            type="email" 
                            className="form-input" 
                            placeholder="seu@email.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
                    </button>
                </form>
                
                <div className="login-footer">
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }}>
                        Voltar para o login
                    </a>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordScreen;