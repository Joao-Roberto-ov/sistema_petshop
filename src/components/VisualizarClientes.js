// joao-roberto-ov/sistema_petshop/sistema_petshop-dev/src/components/VisualizarClientes.js

import React, { useEffect, useState } from 'react';
import axios from '../api/axios';

// Ícones SVG para os botões da tabela
const IconEdit = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
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

function VisualizarClientes({ onBack }) {
    const [clientes, setClientes] = useState([]);
    const [clientesFiltrados, setClientesFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingCliente, setEditingCliente] = useState(null);

    const [nomeSearch, setNomeSearch] = useState('');
    const [cpfSearch, setCpfSearch] = useState('');

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

    const capitalizeName = (name) => {
        if (!name) return '';
        return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // --- FUNÇÃO DE MÁSCARA DE TELEFONE CORRIGIDA ---
    const formatPhone = (value) => {
        if (!value) return "";
        const digits = value.replace(/\D/g, "").slice(0, 11);

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'nome') {
            formattedValue = capitalizeName(value);
        } else if (name === 'telefone') {
            formattedValue = formatPhone(value);
        } else if (name === 'cpf') {
            formattedValue = formatCPF(value);
        }

        setFormData({ ...formData, [name]: formattedValue });
    };

    useEffect(() => {
        fetchClientes();
    }, []);

    useEffect(() => {
        let filteredData = clientes;

        if (nomeSearch) {
            const lowercasedFilter = nomeSearch.toLowerCase();
            filteredData = clientes.filter(cliente =>
                cliente.nome.toLowerCase().includes(lowercasedFilter)
            );
        } else if (cpfSearch) {
            const searchDigits = cpfSearch.replace(/\D/g, '');
            filteredData = clientes.filter(cliente =>
                cliente.cpf && cliente.cpf.replace(/\D/g, '').includes(searchDigits)
            );
        }

        setClientesFiltrados(filteredData);
    }, [nomeSearch, cpfSearch, clientes]);

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('/users', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const clientesOrdenados = response.data.sort((a, b) => a.id - b.id);
            setClientes(clientesOrdenados);
            setClientesFiltrados(clientesOrdenados);
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
                telefone: formData.telefone.replace(/\D/g, '') || undefined,
                endereco: formData.endereco || undefined,
                cpf: formData.cpf.replace(/\D/g, '') || undefined
            };
            const token = localStorage.getItem('token');

            if (editingId) {
                await axios.put(`/funcionario/editar-cliente/${editingId}`, dadosParaEnviar, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFormSuccess(`Cliente '${formData.nome}' atualizado com sucesso!`);
            } else {
                const response = await axios.post('/funcionario/cadastrar-cliente', dadosParaEnviar, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFormSuccess(`Cliente '${formData.nome}' cadastrado com sucesso! Senha temporária: ${response.data.senha_temporaria}`);
            }

            setFormData({ nome: '', email: '', telefone: '', cpf: '', endereco: '' });
            setEditingId(null);
            setEditingCliente(null);
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
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleStatus = async (clienteId, newStatus) => {
        if (!window.confirm(`Tem certeza que deseja ${newStatus ? 'ativar' : 'desativar'} este cliente?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const url = `/admin/clientes/${clienteId}/status?is_ativo=${newStatus}`;

            await axios.put(url, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            fetchClientes();
            alert(`Cliente ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);

        } catch (err) {
            if (err.response?.status === 401) {
                alert('Sessão expirada. Faça login novamente.');
            } else {
                const errorMsg = err.response?.data?.detail || 'Erro ao alterar status do cliente.';
                setError(errorMsg);
                alert(errorMsg);
            }
        }
    };

    const handleEditClick = (cliente) => {
        setEditingCliente(cliente);
        setFormData({
            nome: cliente.nome,
            email: cliente.email,
            telefone: formatPhone(cliente.telefone || ''),
            endereco: cliente.endereco || '',
            cpf: formatCPF(cliente.cpf || '')
        });
        setEditingId(cliente.id);
        setShowForm(true);
        setFormSuccess('');
        setFormError('');
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

    return (
        <>
            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">Gerenciar Clientes</h1>
                    <p className="animate-fade-in-up">
                        Visualize, edite e gerencie todos os clientes cadastrados no sistema.
                    </p>
                    <div className="hero-buttons">
                        <button
                            className="btn btn-outline-white hover-lift"
                            onClick={() => {
                                setShowForm(!showForm);
                                if (!showForm) {
                                    setEditingId(null);
                                    setEditingCliente(null);
                                    setFormData({ nome: '', email: '', telefone: '', cpf: '', endereco: '' });
                                    setFormError('');
                                    setFormSuccess('');
                                }
                            }}
                        >
                            {showForm ? '❌ Cancelar' : '➕ Cadastrar Novo Cliente'}
                        </button>
                        <button className="btn btn-outline-white hover-lift" onClick={onBack}>
                            ← Voltar
                        </button>
                    </div>
                </div>
            </section>

            {showForm && (
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
                                        name="nome"
                                        className="form-input"
                                        placeholder="Digite o nome completo"
                                        value={formData.nome}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Email <span className="required">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        placeholder="Digite o email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Telefone</label>
                                    <input
                                        type="tel"
                                        name="telefone"
                                        className="form-input"
                                        placeholder="(00) 00000-0000"
                                        value={formData.telefone}
                                        onChange={handleInputChange}
                                        maxLength="15"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Endereço</label>
                                    <input
                                        type="text"
                                        name="endereco"
                                        className="form-input"
                                        placeholder="Digite o endereço"
                                        value={formData.endereco}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">CPF</label>
                                    <input
                                        type="text"
                                        name="cpf"
                                        className="form-input"
                                        placeholder="000.000.000-00"
                                        value={formData.cpf}
                                        onChange={handleInputChange}
                                        maxLength="14"
                                        disabled={!!(editingId && editingCliente?.cpf)}
                                    />
                                    {editingId && editingCliente?.cpf && (
                                        <small style={{ color: '#6c757d', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                                            O CPF não pode ser alterado após informado.
                                        </small>
                                    )}
                                </div>

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
                            Total de {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''} encontrado{clientesFiltrados.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '800px', margin: '0 auto 2rem' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Buscar por nome..."
                            value={nomeSearch}
                            onChange={(e) => setNomeSearch(e.target.value)}
                            disabled={!!cpfSearch}
                            style={{ fontSize: '1rem', padding: '0.75rem' }}
                        />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Buscar por CPF..."
                            value={cpfSearch}
                            onChange={(e) => setCpfSearch(formatCPF(e.target.value))}
                            disabled={!!nomeSearch}
                            maxLength="14"
                            style={{ fontSize: '1rem', padding: '0.75rem' }}
                        />
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
                                    {clientesFiltrados.map((cliente, index) => (
                                        <tr
                                            key={cliente.id}
                                            style={{
                                                borderBottom: index === clientesFiltrados.length - 1 ? 'none' : '1px solid #ecf0f1',
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