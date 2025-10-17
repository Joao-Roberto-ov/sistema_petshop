// joao-roberto-ov/sistema_petshop/sistema_petshop-dev/src/components/SignupScreen.js

import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

// Medidor de força da senha
const PasswordStrengthMeter = ({ checks }) => {
    const checkItems = [
        { key: 'length', text: 'Pelo menos 8 caracteres' },
        { key: 'case', text: 'Letras maiúsculas e minúsculas' },
        { key: 'number', text: 'Pelo menos um número' },
        { key: 'noSpaces', text: 'Não conter espaços' },
    ];

    return (
        <div className="password-tooltip">
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

function SignupScreen({ onNavigateToLogin }) {
    const [formData, setFormData] = useState({ nome: '', email: '', senha: '', telefone: '', cpf: '', endereco: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [passwordChecks, setPasswordChecks] = useState({
        length: false, case: false, number: false, noSpaces: true
    });

    useEffect(() => {
        validatePassword(formData.senha);
    }, [formData.senha]);

    const capitalizeName = (name) => {
        if (!name) return '';
        return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // --- FUNÇÃO DE MÁSCARA DE TELEFONE CORRIGIDA ---
    const formatPhone = (value) => {
        if (!value) return "";
        // 1. Remove tudo que não é dígito e limita a 11 caracteres
        const digits = value.replace(/\D/g, "").slice(0, 11);

        // 2. Aplica a formatação passo a passo
        let result = "";
        if (digits.length > 0) {
            result = "(" + digits.substring(0, 2);
        }
        if (digits.length > 2) {
            result += ") " + digits.substring(2, 7);
        }
        if (digits.length > 7) {
            result += "-" + digits.substring(7, 11);
        }
        return result;
    };
    // --- FIM DA CORREÇÃO ---

    const formatCPF = (value) => {
        if (!value) return '';
        let digits = value.replace(/\D/g, '');
        if (digits.length > 11) digits = digits.slice(0, 11);

        if (digits.length > 9) {
            return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
        } else if (digits.length > 6) {
            return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
        } else if (digits.length > 3) {
            return `${digits.slice(0, 3)}.${digits.slice(3)}`;
        }
        return digits;
    };

    const validatePassword = (password) => {
        const checks = {
            length: password.length >= 8,
            case: /(?=.*[a-z])(?=.*[A-Z])/.test(password),
            number: /(?=.*\d)/.test(password),
            noSpaces: !/\s/.test(password),
        };
        setPasswordChecks(checks);
    };

    const isFormValid = () => {
        const isPhoneComplete = formData.telefone.replace(/\D/g, '').length >= 10;
        return isPhoneComplete && Object.values(passwordChecks).every(Boolean);
    };

    const handleInputChange = (e, formatter) => {
        const { name, value } = e.target;
        const formattedValue = formatter ? formatter(value) : value;
        setFormData({ ...formData, [name]: formattedValue });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid()) {
            setError('Por favor, preencha os campos obrigatórios e verifique os requisitos da senha.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const dadosParaEnviar = {
                ...formData,
                cpf: formData.cpf.replace(/\D/g, '') || null,
                telefone: formData.telefone.replace(/\D/g, ''),
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
            <div className="login-card" style={{ maxWidth: '600px' }}>
                <div className="login-header">
                    <h1>Crie sua Conta</h1>
                    <p>É rápido e fácil.</p>
                </div>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nome completo *</label>
                        <input name="nome" type="text" className="form-input" value={formData.nome} onChange={(e) => handleInputChange(e, capitalizeName)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input name="email" type="email" className="form-input" value={formData.email} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label">Senha *</label>
                        <input name="senha" type="password" className="form-input" value={formData.senha} onChange={handleInputChange} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} required />
                        {isPasswordFocused && formData.senha && <PasswordStrengthMeter checks={passwordChecks} />}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Telefone *</label>
                        <input name="telefone" type="tel" className="form-input" value={formData.telefone} onChange={(e) => handleInputChange(e, formatPhone)} required placeholder="(00) 00000-0000" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">CPF (opcional)</label>
                        <input name="cpf" type="text" className="form-input" value={formData.cpf} onChange={(e) => handleInputChange(e, formatCPF)} placeholder="000.000.000-00" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Endereço (opcional)</label>
                        <input name="endereco" type="text" className="form-input" value={formData.endereco} onChange={handleInputChange} />
                    </div>
                    <button type="submit" className="btn-submit" disabled={loading || !isFormValid()}>
                        {loading ? 'Criando conta...' : 'Criar Conta'}
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