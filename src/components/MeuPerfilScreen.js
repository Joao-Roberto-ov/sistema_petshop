// Arquivo completo e final para: src/components/MeuPerfilScreen.js

import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

const PWD_FLOW = { IDLE: 'IDLE', ENTERING_PASSWORDS: 'ENTERING_PASSWORDS', CODE_SENT: 'CODE_SENT', LOCKED: 'LOCKED' };

function MeuPerfilScreen({ onNavigateToHome }) {
    const [profileData, setProfileData] = useState({ telefone: '', endereco: '', cpf: '' });
    const [passwordData, setPasswordData] = useState({ senha_atual: '', nova_senha: '', codigo_verificacao: '' });
    const [passwordFlowState, setPasswordFlowState] = useState(PWD_FLOW.IDLE);
    const [passwordAttempts, setPasswordAttempts] = useState(0); // Contador de tentativas
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => { /* ... (código para buscar dados do perfil, sem alterações) ... */ 
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/users/me', { headers: { 'Authorization': `Bearer ${token}` } });
                setProfileData({
                    telefone: response.data.telefone || '',
                    endereco: response.data.endereco || '',
                    cpf: response.data.cpf || ''
                });
            } catch (err) {
                setError('Não foi possível carregar seus dados.');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
    const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setSuccess('');
        try {
            const token = localStorage.getItem('token');
            await axios.put('/users/me', profileData, { headers: { 'Authorization': `Bearer ${token}` } });
            setSuccess('Dados do perfil atualizados com sucesso!');
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao atualizar o perfil.');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestCode = async () => {
        setLoading(true); setError(''); setSuccess('');
        try {
            const token = localStorage.getItem('token');
            await axios.post('/users/me/request-password-change', {
                senha_atual: passwordData.senha_atual,
                nova_senha: passwordData.nova_senha
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            setSuccess('Código enviado para seu e-mail! Verifique sua caixa de entrada.');
            setPasswordFlowState(PWD_FLOW.CODE_SENT);
            setPasswordAttempts(0); // Reseta as tentativas em caso de sucesso
        } catch (err) {
            const errorDetail = err.response?.data?.detail || 'Erro ao solicitar o código.';
            setError(errorDetail);
            // Se o erro for de senha incorreta, incrementa o contador
            if (err.response && err.response.status === 401) {
                const newAttempts = passwordAttempts + 1;
                setPasswordAttempts(newAttempts);
                if (newAttempts >= 3) {
                    setError('Você errou a senha atual 3 vezes. Para sua segurança, use a opção "Esqueci minha senha".');
                    setPasswordFlowState(PWD_FLOW.LOCKED);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPasswordChange = async () => { /* ... (sem alterações) ... */ 
        setLoading(true); setError(''); setSuccess('');
        try {
            const token = localStorage.getItem('token');
            await axios.post('/users/me/confirm-password-change', {
                nova_senha: passwordData.nova_senha,
                codigo_verificacao: passwordData.codigo_verificacao
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            setSuccess('Senha alterada com sucesso!');
            setPasswordData({ senha_atual: '', nova_senha: '', codigo_verificacao: '' });
            setPasswordFlowState(PWD_FLOW.IDLE);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao confirmar a alteração.');
        } finally {
            setLoading(false);
        }
    };

    // NOVO: Função para o fluxo de "Esqueci a Senha"
    const handleForgotPassword = () => {
        alert('Funcionalidade "Esqueci minha senha" em desenvolvimento. ');
        // Lógica real:
        // const userEmail = JSON.parse(localStorage.getItem('userData')).email;
        // axios.post('/forgot-password', { email: userEmail });
        // setSuccess('Um link de redefinição foi enviado para seu e-mail.');
        // setPasswordFlowState(PWD_FLOW.IDLE);
    };

    const renderPasswordSection = () => {
        switch (passwordFlowState) {
            case PWD_FLOW.IDLE:
                return <button type="button" className="btn-submit" style={{backgroundColor: '#6c757d'}} onClick={() => { setPasswordFlowState(PWD_FLOW.ENTERING_PASSWORDS); setPasswordAttempts(0); setError(''); setSuccess(''); }}>Alterar Senha</button>;
            
            case PWD_FLOW.LOCKED:
                return (
                    <>
                        <p>Por segurança, a alteração de senha por aqui foi bloqueada.</p>
                        <button type="button" className="btn-submit" onClick={handleForgotPassword}>Esqueci Minha Senha</button>
                        <button type="button" className="btn-submit" style={{backgroundColor: '#aaa', marginTop: '0.5rem'}} onClick={() => setPasswordFlowState(PWD_FLOW.IDLE)}>Voltar</button>
                    </>
                );

            case PWD_FLOW.ENTERING_PASSWORDS:
                return (
                    <>
                        <div className="form-group">
                            <label className="form-label">Senha Atual</label>
                            <input type="password" name="senha_atual" className="form-input" value={passwordData.senha_atual} onChange={handlePasswordChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nova Senha (mínimo 6 caracteres)</label>
                            <input type="password" name="nova_senha" className="form-input" value={passwordData.nova_senha} onChange={handlePasswordChange} required minLength="6" />
                        </div>
                        <button type="button" className="btn-submit" onClick={handleRequestCode} disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar Código de Verificação'}
                        </button>
                        <button type="button" className="btn-submit" style={{backgroundColor: '#aaa', marginTop: '0.5rem'}} onClick={() => setPasswordFlowState(PWD_FLOW.IDLE)}>Cancelar</button>
                    </>
                );

            case PWD_FLOW.CODE_SENT:
                return (
                    <>
                        <p>Um código foi enviado para seu e-mail. Insira-o abaixo para confirmar a alteração.</p>
                        <div className="form-group">
                            <label className="form-label">Código de Verificação</label>
                            <input type="text" name="codigo_verificacao" className="form-input" value={passwordData.codigo_verificacao} onChange={handlePasswordChange} required maxLength="6" />
                        </div>
                        <button type="button" className="btn-submit" onClick={handleConfirmPasswordChange} disabled={loading}>
                            {loading ? 'Confirmando...' : 'Confirmar e Alterar Senha'}
                        </button>
                        <button type="button" className="btn-submit" style={{backgroundColor: '#6c757d', marginTop: '0.5rem'}} onClick={handleRequestCode} disabled={loading}>
                            {loading ? 'Reenviando...' : 'Reenviar Código'}
                        </button>
                    </>
                );
            default: return null;
        }
    };

    if (loading && !profileData.telefone) return <div className="loading-message">Carregando perfil...</div>;

    return (
        <div className="login-container">
            <div className="login-card" style={{maxWidth: '700px'}}>
                <div className="login-header"><h1>Meu Perfil</h1></div>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <form onSubmit={handleProfileSubmit}>
                    <p>Atualize suas informações pessoais.</p>
                    <div className="form-group"><label className="form-label">Telefone</label><input type="tel" name="telefone" className="form-input" value={profileData.telefone} onChange={handleProfileChange} /></div>
                    <div className="form-group"><label className="form-label">Endereço</label><input type="text" name="endereco" className="form-input" value={profileData.endereco} onChange={handleProfileChange} /></div>
                    <div className="form-group"><label className="form-label">CPF</label><input type="text" name="cpf" className="form-input" value={profileData.cpf} onChange={handleProfileChange} placeholder="000.000.000-00" /></div>
                    <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Dados do Perfil'}</button>
                </form>
                
                <hr style={{margin: '2rem 0'}} />

                <div className="password-section">{renderPasswordSection()}</div>

                <div className="login-footer" style={{marginTop: '2rem'}}><a href="#" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>Voltar para o Início</a></div>
            </div>
        </div>
    );
}

export default MeuPerfilScreen;
