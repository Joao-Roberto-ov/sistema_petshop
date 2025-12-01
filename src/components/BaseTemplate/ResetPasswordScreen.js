import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';

//medidor de força de senha
const PasswordStrengthMeter = ({ checks }) => {
    const checkItems = [
        { key: 'length', text: 'Pelo menos 8 caracteres' },
        { key: 'case', text: 'Letras maiúsculas e minúsculas' },
        { key: 'number', text: 'Pelo menos um número' },
        { key: 'special', text: 'Pelo menos um caractere especial' },
    ];

    return (
        <div className="password-tooltip">
            <p>A nova senha deve atender aos critérios:</p>
            <ul>
                {checkItems.map(item => (
                    <li key={item.key} className={checks[item.key] ? 'valid' : 'invalid'}>
                        {checks[item.key] ? '✓' : '✗'} {item.text}
                    </li>
                ))}
            </ul>
        </div>
    );
};

function ResetPasswordScreen({ onNavigateToLogin }) {
    const [formData, setFormData] = useState({
        token: '',
        nova_senha: '',
        confirmar_senha: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    //estados para o medidor de senha
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [passwordChecks, setPasswordChecks] = useState({
        length: false,
        case: false,
        number: false,
        special: false,
    });

    //feito para validar a nova senha em tempo real
    useEffect(() => {
        const validatePassword = (password) => {
            const checks = {
                length: password.length >= 8,
                case: /(?=.*[a-z])(?=.*[A-Z])/.test(password),
                number: /(?=.*\d)/.test(password),
                special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            };
            setPasswordChecks(checks);
        };
        validatePassword(formData.nova_senha);
    }, [formData.nova_senha]);

    const isNewPasswordValid = Object.values(passwordChecks).every(Boolean);

    useEffect(() => {
        // Extrair token e email da URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            setFormData(prev => ({ ...prev, token }));
        } else {
            setError('Token de redefinição não encontrado na URL.');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (formData.nova_senha !== formData.confirmar_senha) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        //usa validação completa da nova senha
        if (!isNewPasswordValid) {
            setError('A nova senha não atende a todos os requisitos de segurança.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('/reset-password', {
                token: formData.token,
                nova_senha: formData.nova_senha
            });
            setMessage(response.data.message);
            // Redirecionar para login após 3 segundos
            setTimeout(() => {
                onNavigateToLogin();
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao redefinir senha. Verifique se o link ainda é válido.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Redefinir Senha</h1>
                    <p>Digite sua nova senha</p>
                </div>
                
                {error && <div className="error-message">{error}</div>}
                {message && (
                    <div className="success-message">
                        {message}
                        <br />
                        <small>Você será redirecionado para o login em alguns segundos...</small>
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label">Nova Senha <span className="required">*</span></label>
                        <input 
                            type="password" 
                            name="nova_senha"
                            className="form-input" 
                            placeholder="Digite sua nova senha" 
                            value={formData.nova_senha} 
                            onChange={handleChange} 
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => setIsPasswordFocused(false)}
                            required 
                        />
                        {isPasswordFocused && formData.nova_senha && <PasswordStrengthMeter checks={passwordChecks} />}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirmar Nova Senha <span className="required">*</span></label>
                        <input 
                            type="password" 
                            name="confirmar_senha"
                            className="form-input" 
                            placeholder="Confirme sua nova senha" 
                            value={formData.confirmar_senha} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <button type="submit" className="btn-submit" disabled={loading || !formData.token || !isNewPasswordValid || formData.nova_senha !== formData.confirmar_senha}>
                        {loading ? 'Redefinindo...' : 'Redefinir Senha'}
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

export default ResetPasswordScreen;

