import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import '../../App.css';

const CARGOS = {
    GESTOR: 1,
    FUNCIONARIO: 2,
    VETERINARIO: 3,
    ATENDENTE: 4,
};

function FuncionarioCadastroAdminScreen({ onNavigateToHome }) {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [telefone, setTelefone] = useState('');
    const [cargoId, setCargoId] = useState('');
    const [cpf, setCpf] = useState('');
    const [endereco, setEndereco] = useState('');
    const [isAtivo, setIsAtivo] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!token || !userData || userData.cargo !== 'ADMINISTRADOR') {
            alert('Acesso negado. Apenas administradores podem acessar esta página.');
            if (onNavigateToHome) onNavigateToHome();
        }
    }, [onNavigateToHome]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        if (!nome || !email || !senha || !telefone || !cargoId || !cpf || !endereco) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/admin/funcionarios/cadastro', {
                nome,
                email,
                senha,
                telefone,
                cargo_id: parseInt(cargoId),
                cpf,
                endereco,
                isAtivo
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setSuccess(response.data.message || 'Funcionário cadastrado com sucesso!');
            // Limpar formulário
            setNome('');
            setEmail('');
            setSenha('');
            setTelefone('');
            setCargoId('');
            setCpf('');
            setEndereco('');
            setIsAtivo(true);
        } catch (err) {
            console.error('Erro ao cadastrar funcionário:', err);
            setError(err.response?.data?.detail || 'Erro ao cadastrar funcionário.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Cadastro de Funcionário</h1>
                    <p>Preencha os dados abaixo para cadastrar um novo funcionário</p>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">
                            Nome Completo <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Digite o nome completo"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Email <span className="required">*</span>
                        </label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="Digite o email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Senha <span className="required">*</span>
                        </label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Digite a senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Telefone <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Digite o telefone"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            CPF <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Digite o CPF"
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Endereço <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Digite o endereço"
                            value={endereco}
                            onChange={(e) => setEndereco(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Cargo/Função <span className="required">*</span>
                        </label>
                        <select
                            className="form-input"
                            value={cargoId}
                            onChange={(e) => setCargoId(e.target.value)}
                            required
                        >
                            <option value="">Selecione um cargo</option>
                            <option value={CARGOS.VETERINARIO}>Veterinário</option>
                            <option value={CARGOS.ATENDENTE}>Atendente</option>
                            <option value={CARGOS.GESTOR}>Gestor</option>
                            <option value={CARGOS.FUNCIONARIO}>Funcionário</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="isAtivo"
                            checked={isAtivo}
                            onChange={(e) => setIsAtivo(e.target.checked)}
                            style={{ width: 'auto' }}
                        />
                        <label htmlFor="isAtivo" style={{ margin: 0, fontWeight: '500' }}>
                            Funcionário ativo
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        className="btn-submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Cadastrando...' : 'Cadastrar Funcionário'}
                    </button>
                </form>

                {onNavigateToHome && (
                    <div className="login-footer">
                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>
                            ← Voltar para a página inicial
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FuncionarioCadastroAdminScreen;
