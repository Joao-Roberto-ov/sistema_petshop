import React, { useState, useEffect } from 'react';
import axios from '../api/axios'; //
import '../App.css';
import './FuncionarioCompleto.css'; //

// IDs dos Cargos (do backend util/cargos.py)
const CARGOS = {
    GESTOR: 1,
    FUNCIONARIO: 2,
    VETERINARIO: 3,
    ATENDENTE: 4
};

function CadastroFuncionarioCompleto({ onNavigateToHome }) {
    // ... (estados existentes: nome, cargoId, email, etc.)
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

    // --- NOVOS ESTADOS (REQ 2) ---
    const [catalogoServicos, setCatalogoServicos] = useState([]);
    const [especialidades, setEspecialidades] = useState([]); // Guarda os IDs [1, 3, 5]
    // --- FIM DOS NOVOS ESTADOS ---

    const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    // Busca o catálogo de serviços para o campo de especialidades
    useEffect(() => {
        const fetchServicos = async () => {
            try {
                // /servicos é mapeado para /api/servicos pelo axios.js
                const response = await axios.get('/servicos');
                setCatalogoServicos(response.data || []);
            } catch (err) {
                console.error("Erro ao buscar catálogo de serviços:", err);
                setError("Não foi possível carregar a lista de serviços para as especialidades.");
            }
        };

        fetchServicos();
    }, []); // Executa apenas uma vez

    // ... (função validarCampos permanece a mesma) ...
    const validarCampos = () => {
        const errors = {};
        if (!nome || !nome.trim()) errors.nome = 'Nome completo é obrigatório';
        if (!cargoId) errors.cargoId = 'Cargo é obrigatório';
        if (!email) errors.email = 'E-mail é obrigatório';
        if (!telefone || !telefone.trim()) errors.telefone = 'Telefone é obrigatório';
        if (!horarioInicio) errors.horarioInicio = 'Horário de início é obrigatório';
        if (!horarioFim) errors.horarioFim = 'Horário de fim é obrigatório';
        if (diasTrabalho.length === 0) errors.diasTrabalho = 'Pelo menos um dia de trabalho deve ser selecionado';
        if (!senha || senha.length < 6) errors.senha = 'Senha deve ter pelo menos 6 caracteres';
        if (senha !== confirmarSenha) errors.confirmarSenha = 'Senhas não coincidem';
        if (horarioInicio && horarioFim && horarioInicio >= horarioFim) errors.horarioFim = 'Horário de fim deve ser posterior ao horário de início';

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleDiaTrabalhoChange = (dia) => {
        setDiasTrabalho(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);
    };

    // --- NOVOS HANDLERS (REQ 2) ---
    const handleEspecialidadeChange = (servicoId) => {
        setEspecialidades(prev => {
            if (prev.includes(servicoId)) {
                return prev.filter(id => id !== servicoId); // Desmarca
            } else {
                return [...prev, servicoId]; // Marca
            }
        });
    };

    const handleServicosGerais = (e) => {
        if (e.target.checked) {
            // Marca todos
            setEspecialidades(catalogoServicos.map(s => s.id));
        } else {
            // Desmarca todos
            setEspecialidades([]);
        }
    };
    // --- FIM DOS NOVOS HANDLERS ---

    const formatarCPF = (value) => {
        const numeros = value.replace(/\D/g, '');
        return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };
    const formatarTelefone = (value) => {
        const numeros = value.replace(/\D/g, '');
        if (numeros.length <= 10) return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
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
                // --- DADO ADICIONADO (REQ 2) ---
                // Envia a lista de IDs de especialidades SE for o cargo 2, senão envia lista vazia
                especialidades: cargoIdInt === CARGOS.FUNCIONARIO ? especialidades : []
            };

            //
            const response = await axios.post('/funcionario/cadastrar', dadosFuncionario, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setSuccess(response.data.message || 'Funcionário cadastrado com sucesso!');

            // Limpar formulário
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
            setEspecialidades([]); // Limpa especialidades
            setFieldErrors({});

        } catch (err) {
            console.error('Erro ao cadastrar funcionário:', err);
            setError(err.response?.data?.detail || 'Erro ao cadastrar funcionário.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- LÓGICA AUXILIAR PARA "SERVIÇOS GERAIS" ---
    const isServicosGerais = catalogoServicos.length > 0 && especialidades.length === catalogoServicos.length;

    return (
        <div className="login-container">
            <div className="login-card" style={{ maxWidth: '800px' }}> {/* Aumentado o max-width */}
                <div className="login-header">
                    <h1>Cadastro de Funcionário</h1>
                    <p>Preencha todos os dados obrigatórios para cadastrar um novo funcionário</p>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Nome Completo */}
                    <div className="form-group">
                        <label className="form-label">Nome Completo <span className="required">*</span></label>
                        <input
                            type="text"
                            className={`form-input ${fieldErrors.nome ? 'error' : ''}`}
                            placeholder="Digite o nome completo"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />
                        {fieldErrors.nome && <span className="field-error">{fieldErrors.nome}</span>}
                    </div>

                    {/* Cargo/Função */}
                    <div className="form-group">
                        <label className="form-label">Cargo <span className="required">*</span></label>
                        <select
                            className={`form-input ${fieldErrors.cargoId ? 'error' : ''}`}
                            value={cargoId}
                            onChange={(e) => setCargoId(e.target.value)}
                        >
                            <option value="">Selecione um cargo</option>
                            <option value={CARGOS.GESTOR}>Gestor</option>
                            <option value={CARGOS.FUNCIONARIO}>Funcionário</option>
                            <option value={CARGOS.VETERINARIO}>Veterinário</option>
                            <option value={CARGOS.ATENDENTE}>Atendente</option>
                        </select>
                        {fieldErrors.cargoId && <span className="field-error">{fieldErrors.cargoId}</span>}
                    </div>

                    {/* --- CAMPO CONDICIONAL DE ESPECIALIDADES (REQ 2) --- */}
                    {cargoId === String(CARGOS.FUNCIONARIO) && (
                        <div className="form-group especialidades-container">
                            <label className="form-label">Especialidades (Opcional)</label>
                            <p>Selecione os serviços que este funcionário realiza. Se nada for selecionado, ele será considerado apto para "Serviços Gerais".</p>

                            <div className="especialidade-item">
                                <label className="checkbox-label" style={{fontWeight: 'bold'}}>
                                    <input
                                        type="checkbox"
                                        checked={isServicosGerais}
                                        onChange={handleServicosGerais}
                                    />
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
                                ) : (
                                    <p>Carregando serviços...</p>
                                )}
                            </div>
                        </div>
                    )}
                    {/* --- FIM DO CAMPO CONDICIONAL --- */}


                    {/* Informações de Contato */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">E-mail <span className="required">*</span></label>
                            <input
                                type="email"
                                className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                                placeholder="Digite o e-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Telefone <span className="required">*</span></label>
                            <input
                                type="text"
                                className={`form-input ${fieldErrors.telefone ? 'error' : ''}`}
                                placeholder="(11) 99999-9999"
                                value={telefone}
                                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                                maxLength="15"
                            />
                            {fieldErrors.telefone && <span className="field-error">{fieldErrors.telefone}</span>}
                        </div>
                    </div>

                    {/* CPF e Endereço */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">CPF</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="000.000.000-00"
                                value={cpf}
                                onChange={(e) => setCpf(formatarCPF(e.target.value))}
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

                    {/* Horários de Trabalho */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Horário de Início <span className="required">*</span></label>
                            <input
                                type="time"
                                className={`form-input ${fieldErrors.horarioInicio ? 'error' : ''}`}
                                value={horarioInicio}
                                onChange={(e) => setHorarioInicio(e.target.value)}
                            />
                            {fieldErrors.horarioInicio && <span className="field-error">{fieldErrors.horarioInicio}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Horário de Fim <span className="required">*</span></label>
                            <input
                                type="time"
                                className={`form-input ${fieldErrors.horarioFim ? 'error' : ''}`}
                                value={horarioFim}
                                onChange={(e) => setHorarioFim(e.target.value)}
                            />
                            {fieldErrors.horarioFim && <span className="field-error">{fieldErrors.horarioFim}</span>}
                        </div>
                    </div>

                    {/* Dias de Trabalho */}
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

                    {/* Senha */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Senha <span className="required">*</span></label>
                            <input
                                type="password"
                                className={`form-input ${fieldErrors.senha ? 'error' : ''}`}
                                placeholder="Mínimo 6 caracteres"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                            />
                            {fieldErrors.senha && <span className="field-error">{fieldErrors.senha}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirmar Senha <span className="required">*</span></label>
                            <input
                                type="password"
                                className={`form-input ${fieldErrors.confirmarSenha ? 'error' : ''}`}
                                placeholder="Confirme a senha"
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                            />
                            {fieldErrors.confirmarSenha && <span className="field-error">{fieldErrors.confirmarSenha}</span>}
                        </div>
                    </div>

                    {/* Status Ativo */}
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

export default CadastroFuncionarioCompleto;