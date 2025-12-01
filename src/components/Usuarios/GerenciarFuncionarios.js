import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';

// Ícones SVG para os botões
const IconEdit = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const IconTrash = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3,6 5,6 21,6"></polyline>
        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const IconActivate = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

// ID do cargo Funcionário
const CARGO_FUNCIONARIO_ID = 2;
const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

// CORREÇÃO: Renomeado de especialidadeStyles para styles para uso geral
const styles = {
    container: {
        gridColumn: '1 / -1',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '1rem',
        marginTop: '1rem',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '0.5rem',
        marginTop: '0.5rem',
        maxHeight: '150px',
        overflowY: 'auto',
        paddingTop: '0.5rem',
    },
    item: {
        backgroundColor: '#fff',
        padding: '0.5rem 0.75rem',
        borderRadius: '6px',
        border: '1px solid #e0e0e0',
    },
    checkboxLabel: {
        fontSize: '0.9rem',
        fontWeight: '500',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    checkboxGroup: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '15px',
        marginTop: '8px'
    }
};


function GerenciarFuncionarios({ onNavigateToHome }) {

    const [funcionarios, setFuncionarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [cargoFilter, setCargoFilter] = useState('todos');
    const [catalogoServicos, setCatalogoServicos] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingFuncionario, setEditingFuncionario] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [editLoading, setEditLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingFuncionario, setDeletingFuncionario] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        const carregarDadosIniciais = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error("Token não encontrado.");
                }

                // Busca paralela
                const [respFunc, respServ] = await Promise.all([
                    axios.get('/funcionario/listar', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    axios.get('/servicos') // Busca catálogo de serviços
                ]);

                const funcionariosData = respFunc.data.data || [];
                // Garante que 'especialidades' seja sempre um array
                const funcionariosComCargoAtualizado = funcionariosData.map(funcionario => ({
                    ...funcionario,
                    cargo_funcao: getCargoNome(funcionario.cargo_id),
                    especialidades: Array.isArray(funcionario.especialidades) ? funcionario.especialidades : []
                }));

                setFuncionarios(funcionariosComCargoAtualizado);
                setCatalogoServicos(respServ.data || []);

            } catch (err) {
                console.error('Erro ao carregar dados:', err);
                if (err.response?.status === 401 || err.message === "Token não encontrado.") {
                    setError('Sessão expirada ou inválida. Faça login novamente.');
                } else if (err.response?.status === 403) {
                    setError('Você não tem permissão para visualizar funcionários.');
                } else {
                    setError('Erro ao carregar dados. Tente recarregar a página.');
                }
            } finally {
                setLoading(false);
            }
        };

        carregarDadosIniciais();
    }, []); // Executa apenas uma vez


    const getCargoNome = (cargoId) => {
        const cargos = {
            1: 'Gestor',
            2: 'Funcionário',
            3: 'Veterinário',
            4: 'Atendente'
        };
        return cargos[cargoId] || 'Cargo Desconhecido';
    };

    // --- MÁSCARAS E FORMATAÇÃO ---
    const capitalizeName = (value) => {
        if (!value) return '';
        return value.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

    // Filtrar funcionários
    const funcionariosFiltrados = Array.isArray(funcionarios) ? funcionarios.filter(funcionario => {
        const matchSearch = !searchTerm ||
            funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            funcionario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            funcionario.cargo_funcao.toLowerCase().includes(searchTerm.toLowerCase());

        const matchStatus = statusFilter === 'todos' ||
            (statusFilter === 'ativo' && funcionario.is_ativo) ||
            (statusFilter === 'inativo' && !funcionario.is_ativo);

        const matchCargo = cargoFilter === 'todos' ||
            funcionario.cargo_funcao.toLowerCase().includes(cargoFilter.toLowerCase());

        return matchSearch && matchStatus && matchCargo;
    }) : [];

    const cargosUnicos = Array.isArray(funcionarios) ? [...new Set(funcionarios.map(f => f.cargo_funcao))] : [];

    // Funções de formatação (Mantidas para exibição na tabela)
    const formatarTelefoneTabela = (telefone) => {
        if (!telefone) return 'Não informado';
        const numeros = telefone.replace(/\D/g, '');
        if (numeros.length === 11) {
            return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (numeros.length === 10) {
            return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return telefone;
    };

    const formatarData = (dataString) => {
        if (!dataString) return 'Não informado';
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    };

    const abrirModalEdicao = (funcionario) => {
        setEditingFuncionario(funcionario);

        // Converte string "Segunda,Terça" para array ["Segunda", "Terça"]
        const diasArray = funcionario.dias_trabalho ? funcionario.dias_trabalho.split(',').map(d => d.trim()) : [];

        setEditFormData({
            nome: funcionario.nome,
            cargo_id: funcionario.cargo_id,
            email: funcionario.email,
            // Aplica máscara ao abrir para edição
            telefone: formatPhone(funcionario.telefone || ''),
            cpf: formatCPF(funcionario.cpf || ''),
            endereco: funcionario.endereco || '',
            horario_inicio: funcionario.horario_inicio,
            horario_fim: funcionario.horario_fim,
            dias_trabalho: diasArray, // Array para checkboxes
            is_ativo: funcionario.is_ativo,
            especialidades: Array.isArray(funcionario.especialidades) ? funcionario.especialidades : []
        });
        setShowEditModal(true);
    };

    // Handler para mudança nos checkboxes de dias
    const handleModalDiaTrabalhoChange = (dia) => {
        setEditFormData(prev => {
            const dias = prev.dias_trabalho || [];
            if (dias.includes(dia)) {
                return { ...prev, dias_trabalho: dias.filter(d => d !== dia) };
            } else {
                return { ...prev, dias_trabalho: [...dias, dia] };
            }
        });
    };

    const handleModalEspecialidadeChange = (servicoId) => {
        setEditFormData(prev => {
            const especialidades = prev.especialidades || [];
            if (especialidades.includes(servicoId)) {
                return { ...prev, especialidades: especialidades.filter(id => id !== servicoId) };
            } else {
                return { ...prev, especialidades: [...especialidades, servicoId] };
            }
        });
    };

    const handleModalServicosGerais = (e) => {
        if (e.target.checked) {
            setEditFormData(prev => ({ ...prev, especialidades: catalogoServicos.map(s => s.id) }));
        } else {
            setEditFormData(prev => ({ ...prev, especialidades: [] }));
        }
    };

    const salvarEdicao = async () => {
        if (!editingFuncionario) return;

        // Validação básica de e-mail
        if (editFormData.email && !/\S+@\S+\.\S+/.test(editFormData.email)) {
            alert("Por favor, insira um e-mail válido.");
            return;
        }

        // Validação de dias de trabalho
        if (!editFormData.dias_trabalho || editFormData.dias_trabalho.length === 0) {
            alert("Selecione pelo menos um dia de trabalho.");
            return;
        }

        try {
            setEditLoading(true);
            const token = localStorage.getItem('token');

            // Converte array de dias de volta para string
            const diasString = editFormData.dias_trabalho.join(',');

            // Prepara os dados para enviar (remove formatação de máscaras)
            const dadosAtualizacao = {
                nome: editFormData.nome?.trim(),
                cargo_id: editFormData.cargo_id,
                email: editFormData.email?.trim().toLowerCase(),
                telefone: editFormData.telefone?.replace(/\D/g, ''),
                cpf: editFormData.cpf ? editFormData.cpf.replace(/\D/g, '') : '',
                endereco: editFormData.endereco?.trim() || '',
                horario_inicio: editFormData.horario_inicio,
                horario_fim: editFormData.horario_fim,
                dias_trabalho: diasString,
                is_ativo: editFormData.is_ativo,
                especialidades: editFormData.especialidades
            };

            // Envia apenas os campos que foram realmente modificados ou são necessários
            const payload = {};
            for (const key in dadosAtualizacao) {
                if (key === 'especialidades' || dadosAtualizacao[key] !== editingFuncionario[key]) {
                     if (key === 'cargo_id') {
                         payload[key] = parseInt(dadosAtualizacao[key]);
                     } else {
                         payload[key] = dadosAtualizacao[key];
                     }
                }
            }

            // Verifica dias de trabalho separadamente pois converteu array->string
            if (diasString !== editingFuncionario.dias_trabalho) {
                payload.dias_trabalho = diasString;
            }

            if(payload.cargo_id && payload.cargo_id !== editingFuncionario.cargo_id) {
                payload.especialidades = dadosAtualizacao.especialidades;
            }

            if (Object.keys(payload).length === 0) {
                 setShowEditModal(false);
                 setEditingFuncionario(null);
                 alert('Nenhuma alteração foi feita.');
                 return;
            }

            const response = await axios.put(`/funcionario/${editingFuncionario.id}`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Atualiza a lista local com os dados retornados
            const funcionarioAtualizado = response.data.data.funcionario;
            setFuncionarios(prevFuncionarios =>
                prevFuncionarios.map(f =>
                    f.id === editingFuncionario.id
                    ? { ...funcionarioAtualizado, cargo_funcao: getCargoNome(funcionarioAtualizado.cargo_id) }
                    : f
                )
            );

            setShowEditModal(false);
            setEditingFuncionario(null);
            alert(response.data.data.message || 'Funcionário atualizado com sucesso!');

        } catch (err) {
            console.error('Erro ao atualizar funcionário:', err);
            if (err.response?.data?.detail === 'Erro de integridade dos dados.') {
                alert('❌ Erro: Dados em conflito com o sistema.\n\nSolução: Recarregue a página e verifique os dados.');
            } else if (err.response?.data?.detail?.includes('email')) {
                alert('❌ Erro: Este email já está cadastrado para outro funcionário.');
            } else if (err.response?.data?.detail?.includes('CPF')) {
                alert('❌ Erro: Este CPF já está cadastrado para outro funcionário.');
            } else {
                alert('Erro ao atualizar funcionário: ' + (err.response?.data?.detail || err.message));
            }
        } finally {
            setEditLoading(false);
        }
    };


    // Funções de Desativar/Ativar
    const abrirModalExclusao = (funcionario) => {
        setDeletingFuncionario(funcionario);
        setShowDeleteModal(true);
    };

    const confirmarExclusao = async () => {
        try {
            setDeleteLoading(true);
            const token = localStorage.getItem('token');

            await axios.put(`/funcionario/${deletingFuncionario.id}/desativar`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (Array.isArray(funcionarios)) {
                setFuncionarios(funcionarios.map(f =>
                    f.id === deletingFuncionario.id
                        ? { ...f, is_ativo: false }
                        : f
                ));
            }

            setShowDeleteModal(false);
            setDeletingFuncionario(null);
            alert('Funcionário desativado com sucesso!');

        } catch (err) {
            console.error('Erro ao excluir funcionário:', err);
            alert('Erro ao desativar funcionário: ' + (err.response?.data?.detail || err.message));
        } finally {
            setDeleteLoading(false);
        }
    };

    const ativarFuncionario = async (funcionario) => {
        if (!window.confirm(`Tem certeza que deseja ativar o funcionário ${funcionario.nome}?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            await axios.put(`/funcionario/${funcionario.id}/ativar`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (Array.isArray(funcionarios)) {
                setFuncionarios(funcionarios.map(f =>
                    f.id === funcionario.id
                        ? { ...f, is_ativo: true }
                        : f
                ));
            }

            alert('Funcionário ativado com sucesso!');

        } catch (err) {
            console.error('Erro ao ativar funcionário:', err);
            alert('Erro ao ativar funcionário: ' + (err.response?.data?.detail || err.message));
        }
    };

    if (loading) {
        return (
            <div className="login-container">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <h2>Carregando funcionários...</h2>
                </div>
            </div>
        );
    }

    return (
        <>
            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">Gerenciar Funcionários</h1>
                    <p className="animate-fade-in-up">
                        Visualize, edite e gerencie todos os funcionários do sistema.
                    </p>
                    <div className="hero-buttons">
                        <button
                            className="btn btn-outline-white hover-lift"
                            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'cadastro-funcionario-completo' }))}
                        >
                            ➕ Cadastrar Novo Funcionário
                        </button>
                        <button className="btn btn-outline-white hover-lift" onClick={onNavigateToHome}>
                            ← Voltar
                        </button>
                    </div>
                </div>
            </section>

            {error && (
                <section className="section">
                    <div className="container">
                        <div className="error-message" style={{ textAlign: 'center' }}>
                            {error}
                        </div>
                    </div>
                </section>
            )}

            {/* Filtros e Estatísticas */}
            <section className="section bg-light">
                <div className="container">
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '2rem',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'end' }}>
                            {/* Busca */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    Buscar Funcionários
                                </label>
                                <input
                                    type="text"
                                    placeholder="Buscar por nome, email ou cargo..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        border: '2px solid #ecf0f1',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                                    onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
                                />
                            </div>

                            {/* Filtro Status */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    Status
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        border: '2px solid #ecf0f1',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        background: 'white',
                                        minWidth: '150px'
                                    }}
                                >
                                    <option value="todos">Todos</option>
                                    <option value="ativo">Ativos</option>
                                    <option value="inativo">Inativos</option>
                                </select>
                            </div>

                            {/* Filtro Cargo */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    Cargo
                                </label>
                                <select
                                    value={cargoFilter}
                                    onChange={(e) => setCargoFilter(e.target.value)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        border: '2px solid #ecf0f1',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        background: 'white',
                                        minWidth: '150px'
                                    }}
                                >
                                    <option value="todos">Todos os cargos</option>
                                    {cargosUnicos.map(cargo => (
                                        <option key={cargo} value={cargo}>{cargo}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Estatísticas */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1rem',
                            marginTop: '2rem'
                        }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                                color: 'white',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                    {Array.isArray(funcionarios) ? funcionarios.length : 0}
                                </div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total</div>
                            </div>
                            <div style={{
                                background: 'linear-gradient(135deg, #27ae60 0%, #219a52 100%)',
                                color: 'white',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                    {Array.isArray(funcionarios) ? funcionarios.filter(f => f.is_ativo).length : 0}
                                </div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Ativos</div>
                            </div>
                            <div style={{
                                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                                color: 'white',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                    {Array.isArray(funcionarios) ? funcionarios.filter(f => !f.is_ativo).length : 0}
                                </div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Inativos</div>
                            </div>
                            <div style={{
                                background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
                                color: 'white',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                    {funcionariosFiltrados.length}
                                </div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Filtrados</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Lista de Funcionários */}
            <section className="section">
                <div className="container">
                    <div className="text-center" style={{marginBottom: '2rem'}}>
                        <h2 className="section-title">Funcionários Cadastrados</h2>
                        <p className="section-description">
                            Total de {funcionariosFiltrados.length} funcionário{funcionariosFiltrados.length !== 1 ? 's' : ''} encontrado{funcionariosFiltrados.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {funcionariosFiltrados.length === 0 ? (
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '3rem',
                            textAlign: 'center',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                            <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>Nenhum funcionário encontrado</h3>
                            <p style={{ color: '#7f8c8d' }}>Tente ajustar os filtros ou cadastre um novo funcionário.</p>
                        </div>
                    ) : (
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                            overflow: 'hidden'
                        }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{
                                        background: 'linear-gradient(135deg, #4a9b8e 0%, #3d8b7e 100%)',
                                        color: 'white'
                                    }}>
                                        <tr>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Funcionário</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Cargo</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Email</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Telefone</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Status</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '1rem' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {funcionariosFiltrados.map((funcionario, index) => (
                                            <tr
                                                key={funcionario.id}
                                                style={{
                                                    borderBottom: index === funcionariosFiltrados.length - 1 ? 'none' : '1px solid #ecf0f1',
                                                    transition: 'background 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            fontSize: '1rem'
                                                        }}>
                                                            {funcionario.nome.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                                                                {funcionario.nome}
                                                            </div>
                                                            <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
                                                                Cadastro: {formatarData(funcionario.data_cadastro)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        background: '#e3f2fd',
                                                        color: '#1565c0',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '20px',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '500'
                                                    }}>
                                                        {funcionario.cargo_funcao}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', color: '#7f8c8d' }}>
                                                    {funcionario.email}
                                                </td>
                                                <td style={{ padding: '1rem', color: '#7f8c8d' }}>
                                                    {formatarTelefoneTabela(funcionario.telefone)}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        background: funcionario.is_ativo ? '#e8f5e8' : '#ffeaea',
                                                        color: funcionario.is_ativo ? '#27ae60' : '#e74c3c',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '20px',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '500'
                                                    }}>
                                                        {funcionario.is_ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button
                                                            style={{
                                                                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '0.5rem',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.3s ease',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: '36px',
                                                                height: '36px'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.background = 'linear-gradient(135deg, #2980b9 0%, #1f5f8b 100%)';
                                                                e.target.style.transform = 'translateY(-1px)';
                                                                e.target.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
                                                                e.target.style.transform = 'translateY(0)';
                                                                e.target.style.boxShadow = 'none';
                                                            }}
                                                            onClick={() => abrirModalEdicao(funcionario)}
                                                            title="Editar funcionário"
                                                        >
                                                            <IconEdit />
                                                        </button>
                                                        {funcionario.is_ativo ? (
                                                            <button
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    padding: '0.5rem',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.3s ease',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    width: '36px',
                                                                    height: '36px'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.background = 'linear-gradient(135deg, #c0392b 0%, #922b21 100%)';
                                                                    e.target.style.transform = 'translateY(-1px)';
                                                                    e.target.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
                                                                    e.target.style.transform = 'translateY(0)';
                                                                    e.target.style.boxShadow = 'none';
                                                                }}
                                                                onClick={() => abrirModalExclusao(funcionario)}
                                                                title="Desativar funcionário"
                                                            >
                                                                <IconTrash />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #27ae60 0%, #219a52 100%)',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    padding: '0.5rem',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.3s ease',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    width: '36px',
                                                                    height: '36px'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.background = 'linear-gradient(135deg, #219a52 0%, #1a7a42 100%)';
                                                                    e.target.style.transform = 'translateY(-1px)';
                                                                    e.target.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.3)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.background = 'linear-gradient(135deg, #27ae60 0%, #219a52 100%)';
                                                                    e.target.style.transform = 'translateY(0)';
                                                                    e.target.style.boxShadow = 'none';
                                                                }}
                                                                onClick={() => ativarFuncionario(funcionario)}
                                                                title="Ativar funcionário"
                                                            >
                                                                <IconActivate />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Modal de Edição */}
            {showEditModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '800px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ color: '#2c3e50', margin: 0 }}>✏️ Editar Funcionário</h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#7f8c8d',
                                    padding: '0.5rem'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {/* Campos do formulário... */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.nome}
                                    onChange={(e) => setEditFormData({...editFormData, nome: capitalizeName(e.target.value)})}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ecf0f1',
                                        borderRadius: '8px',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    Cargo *
                                </label>
                                <select
                                    value={editFormData.cargo_id}
                                    onChange={(e) => setEditFormData({...editFormData, cargo_id: parseInt(e.target.value)})}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ecf0f1',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        background: 'white'
                                    }}
                                >
                                    <option value={1}>Gestor</option>
                                    <option value={2}>Funcionário</option>
                                    <option value={3}>Veterinário</option>
                                    <option value={4}>Atendente</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ecf0f1',
                                        borderRadius: '8px',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    Telefone *
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.telefone}
                                    onChange={(e) => setEditFormData({...editFormData, telefone: formatPhone(e.target.value)})}
                                    maxLength="15"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ecf0f1',
                                        borderRadius: '8px',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    CPF
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.cpf}
                                    onChange={(e) => setEditFormData({...editFormData, cpf: formatCPF(e.target.value)})}
                                    maxLength="14"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ecf0f1',
                                        borderRadius: '8px',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    Endereço
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.endereco}
                                    onChange={(e) => setEditFormData({...editFormData, endereco: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ecf0f1',
                                        borderRadius: '8px',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    Horário Início *
                                </label>
                                <input
                                    type="time"
                                    value={editFormData.horario_inicio}
                                    onChange={(e) => setEditFormData({...editFormData, horario_inicio: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ecf0f1',
                                        borderRadius: '8px',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    Horário Fim *
                                </label>
                                <input
                                    type="time"
                                    value={editFormData.horario_fim}
                                    onChange={(e) => setEditFormData({...editFormData, horario_fim: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ecf0f1',
                                        borderRadius: '8px',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    Dias de Trabalho *
                                </label>
                                <div style={styles.checkboxGroup}>
                                    {diasSemana.map(dia => (
                                        <label key={dia} style={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={editFormData.dias_trabalho && editFormData.dias_trabalho.includes(dia)}
                                                onChange={() => handleModalDiaTrabalhoChange(dia)}
                                            />
                                            {dia}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* campo condicional das especialidades  */}
                            {editFormData.cargo_id === CARGO_FUNCIONARIO_ID && (
                                <div style={styles.container}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>Especialidades</label>
                                    <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '1rem' }}>
                                        Selecione os serviços que este funcionário realiza.
                                    </p>

                                    <div style={styles.item}>
                                        <label style={{...styles.checkboxLabel, fontWeight: 'bold'}}>
                                            <input
                                                type="checkbox"
                                                // Verifica se todos os serviços estão marcados
                                                checked={catalogoServicos.length > 0 && (editFormData.especialidades || []).length === catalogoServicos.length}
                                                onChange={handleModalServicosGerais}
                                            />
                                            Serviços Gerais (Selecionar Todos)
                                        </label>
                                    </div>

                                    <div style={styles.grid}>
                                        {catalogoServicos.length > 0 ? (
                                            catalogoServicos.map(servico => (
                                                <div key={servico.id} style={styles.item}>
                                                    <label style={styles.checkboxLabel}>
                                                        <input
                                                            type="checkbox"
                                                            value={servico.id}
                                                            checked={(editFormData.especialidades || []).includes(servico.id)}
                                                            onChange={() => handleModalEspecialidadeChange(servico.id)}
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

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    <input
                                        type="checkbox"
                                        checked={editFormData.is_ativo}
                                        onChange={(e) => setEditFormData({...editFormData, is_ativo: e.target.checked})}
                                    />
                                    Funcionário ativo
                                </label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                            <button
                                className="btn btn-outline-white hover-lift"
                                onClick={() => setShowEditModal(false)}
                                disabled={editLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-submit"
                                onClick={salvarEdicao}
                                disabled={editLoading}
                            >
                                {editLoading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Exclusão */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '500px',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: '#2c3e50', margin: 0 }}>⚠️ Confirmar Desativação</h2>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#7f8c8d',
                                    padding: '0.5rem'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ color: '#2c3e50', marginBottom: '1rem' }}>
                                Tem certeza que deseja desativar o funcionário:
                            </p>
                            <div style={{
                                background: '#f8f9fa',
                                padding: '1rem',
                                borderRadius: '8px',
                                borderLeft: '4px solid #e74c3c'
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{deletingFuncionario?.nome}</div>
                                <div style={{ color: '#7f8c8d' }}>{deletingFuncionario?.cargo_funcao}</div>
                                <div style={{ color: '#7f8c8d' }}>{deletingFuncionario?.email}</div>
                            </div>
                            <p style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '1rem' }}>
                                O funcionário será desativado e não poderá mais acessar o sistema.
                                Esta ação pode ser revertida editando o funcionário posteriormente.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-outline-white hover-lift"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleteLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                style={{
                                    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                                onClick={confirmarExclusao}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? 'Desativando...' : 'Confirmar Desativação'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default GerenciarFuncionarios;