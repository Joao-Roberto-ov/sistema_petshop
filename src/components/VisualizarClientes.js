import React, { useEffect, useState } from 'react';
import CadastroPetFuncionario from './CadastroPetFuncionario';
import axios from '../api/axios';

// Ícones SVG para os botões da tabela
const IconEdit = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

// Ícone de pata de cachorro para cadastrar pet
const IconPaw = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="4.5" cy="9.5" r="2.5"></circle>
        <circle cx="9.5" cy="5.5" r="2.5"></circle>
        <circle cx="14.5" cy="5.5" r="2.5"></circle>
        <circle cx="19.5" cy="9.5" r="2.5"></circle>
        <path d="M17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.05-.52-.06-.78-.07-.47-.02-.93-.03-1.4-.03s-.93.01-1.4.03c-.26.01-.53.02-.78.07-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-.46.54-1.05 1.08-1.75 1.32-.11.04-.22.07-.33.09-.25.05-.52.06-.78.07-.47.02-.93.03-1.4.03s-.93-.01-1.4-.03c-.26-.01-.53-.02-.78-.07-.11-.02-.22-.05-.33-.09-.7-.24-1.28-.78-1.75-1.32"></path>
    </svg>
);

const IconToggle = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {isActive ? (
            <path d="M18 6 6 18M6 6l12 12"/>
        ) : (
            <path d="M20 6 9 17l-5-5"/>
        )}
    </svg>
);

function VisualizarClientes({ userData, onBack }) {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [petRegisteringId, setPetRegisteringId] = useState(null);

    // Formulário
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        endereco: '',
        cpf: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [toggleStatusSuccess, setToggleStatusSuccess] = useState('');
    const [toggleStatusError, setToggleStatusError] = useState('');
    const [petFormSuccess, setPetFormSuccess] = useState('');
    const [petFormError, setPetFormError] = useState('');

    // Verifica se o usuário é Gestor
    const isGestor = userData?.cargo_id === 1 || userData?.cargo?.toLowerCase() === 'gestor' || userData?.cargo?.toLowerCase() === 'administrador';

    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('/users', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const clientesOrdenados = response.data.sort((a, b) => a.id - b.id);
            setClientes(clientesOrdenados);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao buscar clientes.');
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');
        setFormSuccess('');

        try {
            const dadosParaEnviar = {
                nome: formData.nome || undefined,
                email: formData.email || undefined,
                telefone: formData.telefone || undefined,
                endereco: formData.endereco || undefined
            };
            const token = localStorage.getItem('token');

            if (editingId) {
                await axios.put(`/funcionario/editar-cliente/${editingId}`, dadosParaEnviar, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFormSuccess(`Cliente '${formData.nome}' atualizado com sucesso!`);
                setTimeout(() => setFormSuccess(''), 3000);
            } else {
                const response = await axios.post('/funcionario/cadastrar-cliente', {
                    ...dadosParaEnviar,
                    cpf: formData.cpf.replace(/\D/g, '') || null
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFormSuccess(`Cliente '${formData.nome}' cadastrado com sucesso! Senha temporária: ${response.data.senha_temporaria}`);
                setTimeout(() => setFormSuccess(''), 5000);
            }

            setFormData({ nome: '', email: '', telefone: '', cpf: '', endereco: '' });
            setEditingId(null);
            setShowForm(false);
            fetchClientes();
        } catch (err) {
            let mensagemErro = 'Erro ao processar formulário.';
            if (err.response?.data) {
                const data = err.response.data;
                if (typeof data.detail === 'string') mensagemErro = data.detail;
                else if (Array.isArray(data.detail)) mensagemErro = data.detail.map(d => d.msg).join(', ');
                else if (data.detail && typeof data.detail === 'object') mensagemErro = JSON.stringify(data.detail);
            }
            setFormError(mensagemErro);
            setTimeout(() => setFormError(''), 3000);
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleStatus = async (clienteId, newStatus) => {
        const cliente = clientes.find(c => c.id === clienteId);
        if (!cliente) return;
        if (!window.confirm(`Tem certeza que deseja ${newStatus ? 'ativar' : 'desativar'} este cliente?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const url = `http://localhost:8000/api/admin/clientes/${clienteId}/status?is_ativo=${newStatus}`;

            const response = await axios.put(url, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            fetchClientes();
            setToggleStatusSuccess(`Cliente ${cliente.nome} ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
            setTimeout(() => setToggleStatusSuccess(''), 3000);

        } catch (err) {
            if (err.response?.status === 401) {
                setToggleStatusError('Sessão expirada. Faça login novamente.');
            } else {
                const errorMsg = err.response?.data?.detail || 'Erro ao alterar status do cliente.';
                setToggleStatusError(errorMsg);
            }
            setTimeout(() => setToggleStatusError(''), 3000);
        }
    };

    const handleEditClick = (cliente) => {
        setFormData({
            nome: cliente.nome,
            email: cliente.email,
            telefone: cliente.telefone || '',
            endereco: cliente.endereco || '',
            cpf: cliente.cpf || ''
        });
        setEditingId(cliente.id);
        setShowForm(true);
        setFormSuccess('');
        setFormError('');
    };

    const handlePetRegisterClick = (clienteId) => {
        setPetRegisteringId(clienteId);
        setPetFormError('');
        setPetFormSuccess('');
        setShowForm(false);
    };

    const handlePetRegisterCancel = () => {
        setPetRegisteringId(null);
        setPetFormError('');
        setPetFormSuccess('');
    };

    const handlePetRegisterSuccess = () => {
        setPetRegisteringId(null);
        fetchClientes();
    };

    if (loading) {
        return (
            <div className="login-container">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <h2>Carregando clientes...</h2>
                </div>
            </div>
        );
    }

    if (error && clientes.length === 0) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="error-message">{error}</div>
                    <button className="btn-submit" onClick={onBack}>Voltar</button>
                </div>
            </div>
        );
    }

    if (petRegisteringId) {
        const clienteSelecionado = clientes.find(c => c.id === petRegisteringId);
        if (!clienteSelecionado) {
            return <div className="error-message">Cliente não encontrado para cadastro de pet.</div>;
        }

        return (
            <>
                {toggleStatusSuccess && <div className="success-message fixed-top-right">{toggleStatusSuccess}</div>}
                {toggleStatusError && <div className="error-message fixed-top-right">{toggleStatusError}</div>}
                <CadastroPetFuncionario
                    clienteId={petRegisteringId}
                    clienteNome={clienteSelecionado.nome}
                    onSuccess={handlePetRegisterSuccess}
                    onCancel={handlePetRegisterCancel}
                />
            </>
        );
    }

    return (
        <>
            {toggleStatusSuccess && <div className="success-message fixed-top-right">{toggleStatusSuccess}</div>}
            {toggleStatusError && <div className="error-message fixed-top-right">{toggleStatusError}</div>}

            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">Gerenciar Clientes</h1>
                    <p className="animate-fade-in-up">
                        Visualize, edite e gerencie todos os clientes cadastrados no sistema.
                    </p>
                    <div className="hero-buttons">
                        {isGestor && (
                            <button
                                className="btn btn-outline-white hover-lift"
                                onClick={() => {
                                    setShowForm(!showForm);
                                    if (!showForm) {
                                        setEditingId(null);
                                        setFormData({ nome: '', email: '', telefone: '', cpf: '', endereco: '' });
                                        setFormError('');
                                        setFormSuccess('');
                                    }
                                }}
                            >
                                {showForm ? '❌ Cancelar' : '➕ Cadastrar Novo Cliente'}
                            </button>
                        )}
                        <button className="btn btn-outline-white hover-lift" onClick={onBack}>
                            ← Voltar
                        </button>
                    </div>
                </div>
            </section>

            {showForm && isGestor && (
                <section className="section bg-light">
                    <div className="container">
                        <div className="login-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <div className="login-header">
                                <h2>{editingId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</h2>
                                <p>Preencha os dados abaixo</p>
                            </div>

                            {formError && <div className="error-message">{formError}</div>}
                            {formSuccess && <div className="success-message">{formSuccess}</div>}

                            <form onSubmit={handleFormSubmit}>
                                <div className="form-group">
                                    <label className="form-label">
                                        Nome Completo <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Digite o nome completo"
                                        value={formData.nome}
                                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
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
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Telefone</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="Digite o telefone"
                                        value={formData.telefone}
                                        onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Endereço</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Digite o endereço"
                                        value={formData.endereco}
                                        onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                                    />
                                </div>

                                {!editingId && (
                                    <div className="form-group">
                                        <label className="form-label">CPF</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Digite o CPF"
                                            value={formData.cpf}
                                            onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn-submit"
                                    disabled={formLoading}
                                >
                                    {formLoading
                                        ? (editingId ? 'Atualizando...' : 'Cadastrando...')
                                        : (editingId ? 'Atualizar Cliente' : 'Cadastrar Cliente')
                                    }
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            )}

            <section className="section">
                <div className="container">
                    <div className="text-center" style={{marginBottom: '2rem'}}>
                        <h2 className="section-title">Clientes Cadastrados</h2>
                        <p className="section-description">
                            Total de {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}
                        </p>
                    </div>

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
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Nome</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Email</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Telefone</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Endereço</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>CPF</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '1rem' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientes.map((cliente, index) => (
                                        <tr
                                            key={cliente.id}
                                            style={{
                                                borderBottom: index === clientes.length - 1 ? 'none' : '1px solid #ecf0f1',
                                                transition: 'background 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{
                                                padding: '1rem',
                                                fontWeight: '600',
                                                color: '#2c3e50'
                                            }}>
                                                {cliente.nome}
                                            </td>
                                            <td style={{
                                                padding: '1rem',
                                                color: '#7f8c8d'
                                            }}>
                                                {cliente.email}
                                            </td>
                                            <td style={{
                                                padding: '1rem',
                                                color: '#7f8c8d'
                                            }}>
                                                {cliente.telefone || '—'}
                                            </td>
                                            <td style={{
                                                padding: '1rem',
                                                color: '#7f8c8d'
                                            }}>
                                                {cliente.endereco || '—'}
                                            </td>
                                            <td style={{
                                                padding: '1rem',
                                                color: '#7f8c8d'
                                            }}>
                                                {cliente.cpf || '—'}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                    backgroundColor: cliente.is_ativo ? '#d1fae5' : '#fee2e2',
                                                    color: cliente.is_ativo ? '#065f46' : '#991b1b'
                                                }}>
                                                    {cliente.is_ativo ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    {/* Botão Cadastrar Pet - SEMPRE VISÍVEL para todos os funcionários */}
                                                    <button
                                                        style={{
                                                            background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
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
                                                            e.target.style.background = 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)';
                                                            e.target.style.transform = 'translateY(-1px)';
                                                            e.target.style.boxShadow = '0 4px 12px rgba(46, 204, 113, 0.3)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
                                                            e.target.style.transform = 'translateY(0)';
                                                            e.target.style.boxShadow = 'none';
                                                        }}
                                                        onClick={() => handlePetRegisterClick(cliente.id)}
                                                        title={`Cadastrar Pet para ${cliente.nome}`}
                                                    >
                                                        <IconPaw />
                                                    </button>

                                                    {/* Botões de Editar e Ativar/Desativar - APENAS PARA GESTORES */}
                                                    {isGestor && (
                                                        <>
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
                                                                onClick={() => handleEditClick(cliente)}
                                                                title="Editar cliente"
                                                            >
                                                                <IconEdit />
                                                            </button>
                                                            <button
                                                                style={{
                                                                    background: cliente.is_ativo
                                                                        ? 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
                                                                        : 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
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
                                                                    if (cliente.is_ativo) {
                                                                        e.target.style.background = 'linear-gradient(135deg, #c0392b 0%, #922b21 100%)';
                                                                        e.target.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)';
                                                                    } else {
                                                                        e.target.style.background = 'linear-gradient(135deg, #229954 0%, #1e7e34 100%)';
                                                                        e.target.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.3)';
                                                                    }
                                                                    e.target.style.transform = 'translateY(-1px)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.background = cliente.is_ativo
                                                                        ? 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
                                                                        : 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
                                                                    e.target.style.transform = 'translateY(0)';
                                                                    e.target.style.boxShadow = 'none';
                                                                }}
                                                                onClick={() => handleToggleStatus(cliente.id, !cliente.is_ativo)}
                                                                title={cliente.is_ativo ? 'Desativar cliente' : 'Ativar cliente'}
                                                            >
                                                                <IconToggle isActive={cliente.is_ativo} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default VisualizarClientes;