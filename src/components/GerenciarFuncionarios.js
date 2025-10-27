import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

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

// ID do Cargo "Funcionário" (do backend util/cargos.py)
const CARGO_FUNCIONARIO_ID = 2;

// Estilos inline para o modal (para simplicidade, mas idealmente seria um CSS separado)
const modalStyles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
    },
    content: {
        background: 'white', borderRadius: '16px', padding: '2rem',
        width: '100%', maxWidth: '800px', maxHeight: '90vh', // Aumentado o maxWidth
        overflowY: 'auto', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem',
        borderBottom: '1px solid #eee', paddingBottom: '1rem'
    },
    title: { color: '#2c3e50', margin: 0 },
    closeButton: {
        background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer',
        color: '#7f8c8d', padding: '0.5rem', lineHeight: 1
    },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
    formGroupFull: { gridColumn: '1 / -1' },
    label: { display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' },
    input: {
        width: '100%', padding: '0.75rem', border: '2px solid #ecf0f1',
        borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box'
    },
    select: {
        width: '100%', padding: '0.75rem', border: '2px solid #ecf0f1',
        borderRadius: '8px', fontSize: '1rem', background: 'white', boxSizing: 'border-box'
    },
    footer: { display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' },
    button: {
        padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer',
        fontWeight: '600', border: 'none', transition: 'all 0.3s ease'
    },
    buttonCancel: { background: '#ecf0f1', color: '#7f8c8d' },
    buttonSave: { background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: 'white' },
};
// Estilos para especialidades (adicionados)
const especialidadeStyles = {
    container: {
        gridColumn: '1 / -1', // Ocupa a linha inteira
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
    }
};

function GerenciarFuncionarios({ onNavigateToHome }) {

    const [funcionarios, setFuncionarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [cargoFilter, setCargoFilter] = useState('todos');

    // --- NOVO ESTADO (REQ 3) ---
    const [catalogoServicos, setCatalogoServicos] = useState([]);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingFuncionario, setEditingFuncionario] = useState(null);
    const [editFormData, setEditFormData] = useState({}); // Agora vai incluir 'especialidades'
    const [editLoading, setEditLoading] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingFuncionario, setDeletingFuncionario] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Modificado para carregar funcionários E serviços
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
                    // Idealmente, o interceptor do axios faria o logout
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
        const cargos = { 1: 'Gestor', 2: 'Funcionário', 3: 'Veterinário', 4: 'Atendente' };
        return cargos[cargoId] || 'Cargo Desconhecido';
    };

    // Filtrar funcionários (agora lê 'especialidades' que já está no objeto)
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

    // Funções de formatação
    const formatarTelefone = (telefone) => {
        if (!telefone) return 'Não informado';
        const numeros = telefone.replace(/\D/g, '');
        if (numeros.length === 11) return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        if (numeros.length === 10) return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        return telefone;
    };
    const formatarCPF = (cpf) => {
        if (!cpf) return 'Não informado';
        const numeros = cpf.replace(/\D/g, '');
        return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };
    const formatarData = (dataString) => {
        if (!dataString) return 'Não informado';
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    };

    // --- MODIFICADO (REQ 3) ---
    const abrirModalEdicao = (funcionario) => {
        setEditingFuncionario(funcionario);
        setEditFormData({
            nome: funcionario.nome,
            cargo_id: funcionario.cargo_id,
            email: funcionario.email,
            telefone: funcionario.telefone,
            cpf: funcionario.cpf || '',
            endereco: funcionario.endereco || '',
            horario_inicio: funcionario.horario_inicio,
            horario_fim: funcionario.horario_fim,
            dias_trabalho: funcionario.dias_trabalho,
            is_ativo: funcionario.is_ativo,
            // Adiciona as especialidades ao formulário (garante que seja array)
            especialidades: Array.isArray(funcionario.especialidades) ? funcionario.especialidades : []
        });
        setShowEditModal(true);
    };

    // --- NOVOS HANDLERS PARA O MODAL (REQ 3) ---
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
    // --- FIM DOS NOVOS HANDLERS ---

    // --- MODIFICADO (REQ 3) ---
    const salvarEdicao = async () => {
        if (!editingFuncionario) return;

        try {
            setEditLoading(true);
            const token = localStorage.getItem('token');

            // Prepara os dados para enviar (baseado no modelo FuncionarioUpdate)
            const dadosAtualizacao = {
                nome: editFormData.nome?.trim(),
                cargo_id: editFormData.cargo_id,
                email: editFormData.email?.trim().toLowerCase(),
                telefone: editFormData.telefone?.trim(),
                cpf: editFormData.cpf ? editFormData.cpf.replace(/\D/g, '') : '',
                endereco: editFormData.endereco?.trim() || '',
                horario_inicio: editFormData.horario_inicio,
                horario_fim: editFormData.horario_fim,
                dias_trabalho: editFormData.dias_trabalho?.trim(),
                is_ativo: editFormData.is_ativo,
                // Adiciona o campo de especialidades (Req 3)
                // O backend (service) vai lidar se a lista deve ser usada ou limpa
                especialidades: editFormData.especialidades
            };

            // Envia apenas os campos que foram realmente modificados ou são necessários
            const payload = {};
            for (const key in dadosAtualizacao) {
                // Compara com o original, exceto especialidades que sempre enviamos
                if (key === 'especialidades' || dadosAtualizacao[key] !== editingFuncionario[key]) {
                     // Caso especial: cargo_id é int, precisa converter
                     if (key === 'cargo_id') {
                         payload[key] = parseInt(dadosAtualizacao[key]);
                     } else {
                         payload[key] = dadosAtualizacao[key];
                     }
                }
            }
            // Se o cargo foi alterado, sempre envia especialidades
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

            // Atualiza a lista local com os dados retornados (que incluem as especialidades corretas)
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
            alert('Erro ao atualizar funcionário: ' + (err.response?.data?.detail || err.message));
        } finally {
            setEditLoading(false);
        }
    };

    // Funções de Desativar/Ativar (permanecem iguais)
    const abrirModalExclusao = (funcionario) => {
        setDeletingFuncionario(funcionario);
        setShowDeleteModal(true);
    };

    const confirmarExclusao = async () => {
        try {
            setDeleteLoading(true);
            const token = localStorage.getItem('token');
            await axios.put(`/funcionario/${deletingFuncionario.id}/desativar`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Atualiza o estado local
            setFuncionarios(funcionarios.map(f =>
                f.id === deletingFuncionario.id ? { ...f, is_ativo: false } : f
            ));
            setShowDeleteModal(false);
            setDeletingFuncionario(null);
            alert('Funcionário desativado com sucesso!');
        } catch (err) {
            alert('Erro ao desativar funcionário: ' + (err.response?.data?.detail || err.message));
        } finally {
            setDeleteLoading(false);
        }
    };

    const ativarFuncionario = async (funcionario) => {
        if (!window.confirm(`Tem certeza que deseja ativar o funcionário ${funcionario.nome}?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/funcionario/${funcionario.id}/ativar`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Atualiza o estado local
            setFuncionarios(funcionarios.map(f =>
                f.id === funcionario.id ? { ...f, is_ativo: true } : f
            ));
            alert('Funcionário ativado com sucesso!');
        } catch (err) {
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

            {/* Filtros */}
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
                                <label style={modalStyles.label}>Buscar Funcionários</label>
                                <input
                                    type="text"
                                    placeholder="Buscar por nome, email ou cargo..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={modalStyles.input}
                                />
                            </div>
                            {/* Filtro Status */}
                            <div>
                                <label style={modalStyles.label}>Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{...modalStyles.select, minWidth: '150px'}}
                                >
                                    <option value="todos">Todos</option>
                                    <option value="ativo">Ativos</option>
                                    <option value="inativo">Inativos</option>
                                </select>
                            </div>
                            {/* Filtro Cargo */}
                            <div>
                                <label style={modalStyles.label}>Cargo</label>
                                <select
                                    value={cargoFilter}
                                    onChange={(e) => setCargoFilter(e.target.value)}
                                    style={{...modalStyles.select, minWidth: '150px'}}
                                >
                                    <option value="todos">Todos os cargos</option>
                                    {cargosUnicos.map(cargo => (
                                        <option key={cargo} value={cargo}>{cargo}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Lista de Funcionários (Tabela) */}
            <section className="section">
                <div className="container">
                    {funcionariosFiltrados.length === 0 ? (
                        <div style={{ background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
                            <h3>Nenhum funcionário encontrado</h3>
                        </div>
                    ) : (
                        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: 'linear-gradient(135deg, #4a9b8e 0%, #3d8b7e 100%)', color: 'white' }}>
                                        <tr>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Funcionário</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Cargo</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Telefone</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {funcionariosFiltrados.map((funcionario, index) => (
                                            <tr key={funcionario.id} style={{ borderBottom: index === funcionariosFiltrados.length - 1 ? 'none' : '1px solid #ecf0f1' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3498db', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                                            {funcionario.nome.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600' }}>{funcionario.nome}</div>
                                                            <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>Cadastro: {formatarData(funcionario.data_cadastro)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ background: '#e3f2fd', color: '#1565c0', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.875rem' }}>
                                                        {funcionario.cargo_funcao}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', color: '#7f8c8d' }}>{funcionario.email}</td>
                                                <td style={{ padding: '1rem', color: '#7f8c8d' }}>{formatarTelefone(funcionario.telefone)}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ background: funcionario.is_ativo ? '#e8f5e8' : '#ffeaea', color: funcionario.is_ativo ? '#27ae60' : '#e74c3c', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.875rem' }}>
                                                        {funcionario.is_ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button style={{ background: '#3498db', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => abrirModalEdicao(funcionario)} title="Editar">
                                                            <IconEdit />
                                                        </button>
                                                        {funcionario.is_ativo ? (
                                                            <button style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => abrirModalExclusao(funcionario)} title="Desativar">
                                                                <IconTrash />
                                                            </button>
                                                        ) : (
                                                            <button style={{ background: '#27ae60', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => ativarFuncionario(funcionario)} title="Ativar">
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

            {/* Modal de Edição (MODIFICADO com Req 3) */}
            {showEditModal && editingFuncionario && (
                <div style={modalStyles.overlay}>
                    <div style={modalStyles.content}>
                        <div style={modalStyles.header}>
                            <h2 style={modalStyles.title}>✏️ Editar Funcionário</h2>
                            <button onClick={() => setShowEditModal(false)} style={modalStyles.closeButton}>✕</button>
                        </div>

                        <div style={modalStyles.formGrid}>
                            {/* Campos do formulário: Nome, Cargo, Email, etc. */}
                            <div>
                                <label style={modalStyles.label}>Nome *</label>
                                <input type="text" value={editFormData.nome} onChange={(e) => setEditFormData({...editFormData, nome: e.target.value})} style={modalStyles.input} />
                            </div>
                            <div>
                                <label style={modalStyles.label}>Cargo *</label>
                                <select value={editFormData.cargo_id} onChange={(e) => setEditFormData({...editFormData, cargo_id: parseInt(e.target.value) || ''})} style={modalStyles.select}>
                                    <option value="">Selecione</option>
                                    <option value={1}>Gestor</option>
                                    <option value={2}>Funcionário</option>
                                    <option value={3}>Veterinário</option>
                                    <option value={4}>Atendente</option>
                                </select>
                            </div>
                            <div>
                                <label style={modalStyles.label}>Email *</label>
                                <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} style={modalStyles.input} />
                            </div>
                            <div>
                                <label style={modalStyles.label}>Telefone *</label>
                                <input type="text" value={editFormData.telefone} onChange={(e) => setEditFormData({...editFormData, telefone: e.target.value})} style={modalStyles.input} />
                            </div>
                            <div>
                                <label style={modalStyles.label}>CPF</label>
                                <input type="text" value={editFormData.cpf} onChange={(e) => setEditFormData({...editFormData, cpf: e.target.value})} style={modalStyles.input} />
                            </div>
                            <div>
                                <label style={modalStyles.label}>Endereço</label>
                                <input type="text" value={editFormData.endereco} onChange={(e) => setEditFormData({...editFormData, endereco: e.target.value})} style={modalStyles.input} />
                            </div>
                            <div>
                                <label style={modalStyles.label}>Horário Início *</label>
                                <input type="time" value={editFormData.horario_inicio} onChange={(e) => setEditFormData({...editFormData, horario_inicio: e.target.value})} style={modalStyles.input} />
                            </div>
                            <div>
                                <label style={modalStyles.label}>Horário Fim *</label>
                                <input type="time" value={editFormData.horario_fim} onChange={(e) => setEditFormData({...editFormData, horario_fim: e.target.value})} style={modalStyles.input} />
                            </div>
                            <div style={modalStyles.formGroupFull}>
                                <label style={modalStyles.label}>Dias de Trabalho *</label>
                                <input type="text" value={editFormData.dias_trabalho} onChange={(e) => setEditFormData({...editFormData, dias_trabalho: e.target.value})} style={modalStyles.input} placeholder="Ex: Segunda,Terça,Quarta,Quinta,Sexta" />
                            </div>

                            {/* --- CAMPO CONDICIONAL DE ESPECIALIDADES (REQ 3) --- */}
                            {editFormData.cargo_id === CARGO_FUNCIONARIO_ID && (
                                <div style={especialidadeStyles.container}>
                                    <label style={modalStyles.label}>Especialidades</label>
                                    <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '1rem' }}>
                                        Selecione os serviços que este funcionário realiza.
                                    </p>

                                    <div style={especialidadeStyles.item}>
                                        <label style={{...especialidadeStyles.checkboxLabel, fontWeight: 'bold'}}>
                                            <input
                                                type="checkbox"
                                                // Verifica se todos os serviços estão marcados
                                                checked={catalogoServicos.length > 0 && editFormData.especialidades.length === catalogoServicos.length}
                                                onChange={handleModalServicosGerais}
                                            />
                                            Serviços Gerais (Selecionar Todos)
                                        </label>
                                    </div>

                                    <div style={especialidadeStyles.grid}>
                                        {catalogoServicos.length > 0 ? (
                                            catalogoServicos.map(servico => (
                                                <div key={servico.id} style={especialidadeStyles.item}>
                                                    <label style={especialidadeStyles.checkboxLabel}>
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
                            {/* --- FIM DO CAMPO CONDICIONAL --- */}

                            <div style={modalStyles.formGroupFull}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
                                    <input type="checkbox" checked={editFormData.is_ativo} onChange={(e) => setEditFormData({...editFormData, is_ativo: e.target.checked})} />
                                    Funcionário ativo
                                </label>
                            </div>
                        </div>

                        <div style={modalStyles.footer}>
                            <button style={{...modalStyles.button, ...modalStyles.buttonCancel}} onClick={() => setShowEditModal(false)} disabled={editLoading}>
                                Cancelar
                            </button>
                            <button style={{...modalStyles.button, ...modalStyles.buttonSave}} onClick={salvarEdicao} disabled={editLoading}>
                                {editLoading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Exclusão */}
            {showDeleteModal && (
                 <div style={modalStyles.overlay}>
                    <div style={{...modalStyles.content, maxWidth: '500px'}}>
                        <div style={modalStyles.header}>
                            <h2 style={modalStyles.title}>⚠️ Confirmar Desativação</h2>
                            <button onClick={() => setShowDeleteModal(false)} style={modalStyles.closeButton}>✕</button>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ color: '#2c3e50', marginBottom: '1rem' }}>Tem certeza que deseja desativar o funcionário:</p>
                            <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
                                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{deletingFuncionario?.nome}</div>
                                <div style={{ color: '#7f8c8d' }}>{deletingFuncionario?.cargo_funcao}</div>
                            </div>
                            <p style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '1rem' }}>
                                O funcionário será desativado e não poderá mais acessar o sistema.
                            </p>
                        </div>
                        <div style={modalStyles.footer}>
                            <button style={{...modalStyles.button, ...modalStyles.buttonCancel}} onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
                                Cancelar
                            </button>
                            <button style={{...modalStyles.button, background: '#e74c3c', color: 'white'}} onClick={confirmarExclusao} disabled={deleteLoading}>
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