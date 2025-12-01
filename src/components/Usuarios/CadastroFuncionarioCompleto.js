import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import '../../App.css';
import './FuncionarioCompleto.css';

const CARGOS = {
    GESTOR: 1,
    FUNCIONARIO: 2,
    VETERINARIO: 3,
    ATENDENTE: 4
};

// --- Componentes Visuais (Ícones e Medidor) ---

const IconEye = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const IconEyeOff = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

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

function CadastroFuncionarioCompleto({ onNavigateToHome }) {
    const [nome, setNome] = useState('');
    const [cargoId, setCargoId] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [cpf, setCpf] = useState('');
    const [endereco, setEndereco] = useState('');
    const [horarioInicio, setHorarioInicio] = useState('');
    const [horarioFim, setHorarioFim] = useState('');
    const [diasTrabalho, setDiasTrabalho] = useState([]);
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [isAtivo, setIsAtivo] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [catalogoServicos, setCatalogoServicos] = useState([]);
    const [especialidades, setEspecialidades] = useState([]);

    // Estados para validação e visualização de senha
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [passwordChecks, setPasswordChecks] = useState({
        length: false, case: false, number: false, noSpaces: true
    });

    const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    useEffect(() => {
        const fetchServicos = async () => {
            try {
                const response = await axios.get('/servicos');
                setCatalogoServicos(response.data || []);
            } catch (err) {
                console.error("Erro ao buscar catálogo de serviços:", err);
                setError("Não foi possível carregar a lista de serviços para as especialidades.");
            }
        };
        fetchServicos();
    }, []);

    // Validação de senha em tempo real
    useEffect(() => {
        const validatePassword = (password) => {
            const checks = {
                length: password.length >= 8,
                case: /(?=.*[a-z])(?=.*[A-Z])/.test(password),
                number: /(?=.*\d)/.test(password),
                noSpaces: !/\s/.test(password),
            };
            setPasswordChecks(checks);
        };
        validatePassword(senha);
    }, [senha]);

    const isPasswordValid = Object.values(passwordChecks).every(Boolean);

    // --- FUNÇÃO PARA LIMPAR ERROS ---
    const clearError = (fieldName) => {
        if (fieldErrors[fieldName]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    // --- MÁSCARAS E FORMATAÇÃO ---
    const capitalizeName = (value) => {
        if (!value) return '';
        return value.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const handleNameChange = (e) => {
        const valueWithoutNumbers = e.target.value.replace(/[0-9]/g, '');
        setNome(capitalizeName(valueWithoutNumbers));
        clearError('nome');
    };

    const formatPhone = (value) => {
        if (!value) return "";
        const digits = value.replace(/\D/g, "").slice(0, 11);
        let result = "";
        if (digits.length > 0) result = "(" + digits.substring(0, 2);
        if (digits.length > 2) result += ") " + digits.substring(2, 7);
        if (digits.length > 7) result += "-" + digits.substring(7, 11);
        return result;
    };

    const formatCPF = (value) => {
        if (!value) return '';
        let digits = value.replace(/\D/g, '');
        if (digits.length > 11) digits = digits.slice(0, 11);
        if (digits.length > 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
        else if (digits.length > 6) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
        else if (digits.length > 3) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
        return digits;
    };

    const validarCampos = () => {
        const errors = {};
        if (!nome || !nome.trim()) errors.nome = 'Nome completo é obrigatório';
        if (!cargoId) errors.cargoId = 'Cargo é obrigatório';

        if (!email) {
            errors.email = 'E-mail é obrigatório';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'Formato de e-mail inválido';
        }

        if (!telefone || !telefone.trim()) errors.telefone = 'Telefone é obrigatório';
        if (!horarioInicio) errors.horarioInicio = 'Horário de início é obrigatório';
        if (!horarioFim) errors.horarioFim = 'Horário de fim é obrigatório';
        if (diasTrabalho.length === 0) errors.diasTrabalho = 'Pelo menos um dia de trabalho deve ser selecionado';

        if (!isPasswordValid) errors.senha = 'A senha não atende aos requisitos de segurança';
        if (senha !== confirmarSenha) errors.confirmarSenha = 'Senhas não coincidem';

        if (horarioInicio && horarioFim && horarioInicio >= horarioFim) errors.horarioFim = 'Horário de fim deve ser posterior ao horário de início';

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleDiaTrabalhoChange = (dia) => {
        setDiasTrabalho(prev => {
            const novosDias = prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia];
            if (novosDias.length > 0) clearError('diasTrabalho');
            return novosDias;
        });
    };

    const handleEspecialidadeChange = (servicoId) => {
        setEspecialidades(prev => {
            if (prev.includes(servicoId)) {
                return prev.filter(id => id !== servicoId);
            } else {
                return [...prev, servicoId];
            }
        });
    };

    const handleServicosGerais = (e) => {
        if (e.target.checked) {
            setEspecialidades(catalogoServicos.map(s => s.id));
        } else {
            setEspecialidades([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        if (!validarCampos()) {
            setError('Por favor, corrija os erros nos campos destacados.');
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const cargoNomes = { 1: 'Gestor', 2: 'Funcionário', 3: 'Veterinário', 4: 'Atendente' };
            const cargoIdInt = parseInt(cargoId);
            const cargoFuncaoValue = cargoNomes[cargoIdInt] || 'Funcionário';

            const dadosFuncionario = {
                nome: nome.trim(),
                cargo_id: cargoIdInt,
                cargo_funcao: cargoFuncaoValue,
                email: email.trim(),
                telefone: telefone.replace(/\D/g, ''),
                cpf: cpf ? cpf.replace(/\D/g, '') : null,
                endereco: endereco.trim() || null,
                horario_inicio: horarioInicio,
                horario_fim: horarioFim,
                dias_trabalho: diasTrabalho.join(','),
                senha: senha,
                is_ativo: isAtivo,
                especialidades: cargoIdInt === CARGOS.FUNCIONARIO ? especialidades : []
            };

            const response = await axios.post('/funcionario/cadastrar', dadosFuncionario, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setSuccess(response.data.message || 'Funcionário cadastrado com sucesso!');

            // Limpar campos
            setNome('');
            setCargoId('');
            setEmail('');
            setTelefone('');
            setCpf('');
            setEndereco('');
            setHorarioInicio('');
            setHorarioFim('');
            setDiasTrabalho([]);
            setSenha('');
            setConfirmarSenha('');
            setIsAtivo(true);
            setEspecialidades([]);
            setFieldErrors({}); // Limpar erros

        } catch (err) {
            console.error('Erro ao cadastrar funcionário:', err);
            setError(err.response?.data?.detail || 'Erro ao cadastrar funcionário.');
        } finally {
            setIsLoading(false);
        }
    };

    const isServicosGerais = catalogoServicos.length > 0 && especialidades.length === catalogoServicos.length;

    return (
        <div className="login-container">
            <div className="login-card" style={{ maxWidth: '800px' }}>
                <div className="login-header">
                    <h1>Cadastro de Funcionário</h1>
                    <p>Preencha todos os dados obrigatórios para cadastrar um novo funcionário</p>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nome Completo <span className="required">*</span></label>
                        <input
                            type="text"
                            className={`form-input ${fieldErrors.nome ? 'error' : ''}`}
                            placeholder="Digite o nome completo"
                            value={nome}
                            onChange={handleNameChange}
                        />
                        {fieldErrors.nome && <span className="field-error">{fieldErrors.nome}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Cargo <span className="required">*</span></label>
                        <select
                            className={`form-input ${fieldErrors.cargoId ? 'error' : ''}`}
                            value={cargoId}
                            onChange={(e) => { setCargoId(e.target.value); clearError('cargoId'); }}
                        >
                            <option value="">Selecione um cargo</option>
                            <option value={CARGOS.GESTOR}>Gestor</option>
                            <option value={CARGOS.FUNCIONARIO}>Funcionário</option>
                            <option value={CARGOS.VETERINARIO}>Veterinário</option>
                            <option value={CARGOS.ATENDENTE}>Atendente</option>
                        </select>
                        {fieldErrors.cargoId && <span className="field-error">{fieldErrors.cargoId}</span>}
                    </div>

                    {cargoId === String(CARGOS.FUNCIONARIO) && (
                        <div className="form-group especialidades-container">
                            <label className="form-label">Especialidades (Opcional)</label>
                            <p>Selecione os serviços que este funcionário realiza.</p>
                            <div className="especialidade-item">
                                <label className="checkbox-label" style={{fontWeight: 'bold'}}>
                                    <input type="checkbox" checked={isServicosGerais} onChange={handleServicosGerais} />
                                    Serviços Gerais (Selecionar Todos)
                                </label>
                            </div>
                            <div className="especialidades-grid">
                                {catalogoServicos.length > 0 ? (
                                    catalogoServicos.map(servico => (
                                        <div key={servico.id} className="especialidade-item">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    value={servico.id}
                                                    checked={especialidades.includes(servico.id)}
                                                    onChange={() => handleEspecialidadeChange(servico.id)}
                                                />
                                                {servico.nome}
                                            </label>
                                        </div>
                                    ))
                                ) : (<p>Carregando serviços...</p>)}
                            </div>
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">E-mail <span className="required">*</span></label>
                            <input
                                type="email"
                                className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                                placeholder="Digite o e-mail"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                            />
                            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Telefone <span className="required">*</span></label>
                            <input
                                type="text"
                                className={`form-input ${fieldErrors.telefone ? 'error' : ''}`}
                                placeholder="(00) 00000-0000"
                                value={telefone}
                                onChange={(e) => { setTelefone(formatPhone(e.target.value)); clearError('telefone'); }}
                                maxLength="15"
                            />
                            {fieldErrors.telefone && <span className="field-error">{fieldErrors.telefone}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">CPF</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="000.000.000-00"
                                value={cpf}
                                onChange={(e) => setCpf(formatCPF(e.target.value))}
                                maxLength="14"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Endereço</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Digite o endereço completo"
                                value={endereco}
                                onChange={(e) => setEndereco(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Horário de Início <span className="required">*</span></label>
                            <input
                                type="time"
                                className={`form-input ${fieldErrors.horarioInicio ? 'error' : ''}`}
                                value={horarioInicio}
                                onChange={(e) => { setHorarioInicio(e.target.value); clearError('horarioInicio'); }}
                            />
                            {fieldErrors.horarioInicio && <span className="field-error">{fieldErrors.horarioInicio}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Horário de Fim <span className="required">*</span></label>
                            <input
                                type="time"
                                className={`form-input ${fieldErrors.horarioFim ? 'error' : ''}`}
                                value={horarioFim}
                                onChange={(e) => { setHorarioFim(e.target.value); clearError('horarioFim'); }}
                            />
                            {fieldErrors.horarioFim && <span className="field-error">{fieldErrors.horarioFim}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Dias de Trabalho <span className="required">*</span></label>
                        <div className="checkbox-group">
                            {diasSemana.map(dia => (
                                <label key={dia} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={diasTrabalho.includes(dia)}
                                        onChange={() => handleDiaTrabalhoChange(dia)}
                                    />
                                    {dia}
                                </label>
                            ))}
                        </div>
                        {fieldErrors.diasTrabalho && <span className="field-error">{fieldErrors.diasTrabalho}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ position: 'relative' }}>
                            <label className="form-label">Senha <span className="required">*</span></label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={`form-input ${fieldErrors.senha ? 'error' : ''}`}
                                    placeholder="Mínimo 8 caracteres"
                                    value={senha}
                                    onChange={(e) => { setSenha(e.target.value); clearError('senha'); }}
                                    onFocus={() => setIsPasswordFocused(true)}
                                    onBlur={() => setIsPasswordFocused(false)}
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#6c757d',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    {showPassword ? <IconEyeOff /> : <IconEye />}
                                </button>
                            </div>
                            {isPasswordFocused && senha && <PasswordStrengthMeter checks={passwordChecks} />}
                            {fieldErrors.senha && <span className="field-error">{fieldErrors.senha}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirmar Senha <span className="required">*</span></label>
                            <input
                                type="password"
                                className={`form-input ${fieldErrors.confirmarSenha ? 'error' : ''}`}
                                placeholder="Confirme a senha"
                                value={confirmarSenha}
                                onChange={(e) => { setConfirmarSenha(e.target.value); clearError('confirmarSenha'); }}
                            />
                            {confirmarSenha && senha !== confirmarSenha && (
                                <span className="field-error">As senhas não coincidem</span>
                            )}
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="isAtivo"
                            checked={isAtivo}
                            onChange={(e) => setIsAtivo(e.target.checked)}
                            style={{ width: 'auto' }}
                        />
                        <label htmlFor="isAtivo" style={{ margin: 0, fontWeight: '500' }}>Funcionário ativo</label>
                    </div>

                    <button type="submit" className="btn-submit" disabled={isLoading}>
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

export default CadastroFuncionarioCompleto;