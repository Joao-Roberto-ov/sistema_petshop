import React, { useEffect, useState } from 'react';
import axios from '../api/axios';

function VisualizarClientes({ onBack }) {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

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
            } else {
                const response = await axios.post('/funcionario/cadastrar-cliente', {
                    ...dadosParaEnviar,
                    cpf: formData.cpf.replace(/\D/g, '') || null
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFormSuccess(`Cliente '${formData.nome}' cadastrado com sucesso! Senha temporária: ${response.data.senha_temporaria}`);
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
            const url = `http://localhost:8000/api/admin/clientes/${clienteId}/status?is_ativo=${newStatus}`;
            
            const response = await axios.put(url, {}, {
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

                    <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#4a9b8e', color: '#fff' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Nome</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Telefone</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Endereço</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>CPF</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientes.map((cliente, index) => (
                                    <tr 
                                        key={cliente.id} 
                                        style={{ 
                                            borderBottom: '1px solid #e5e7eb',
                                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                                        }}
                                    >
                                        <td style={{ padding: '1rem' }}>{cliente.nome}</td>
                                        <td style={{ padding: '1rem' }}>{cliente.email}</td>
                                        <td style={{ padding: '1rem' }}>{cliente.telefone || '-'}</td>
                                        <td style={{ padding: '1rem' }}>{cliente.endereco || '-'}</td>
                                        <td style={{ padding: '1rem' }}>{cliente.cpf || '-'}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.875rem',
                                                fontWeight: '500',
                                                backgroundColor: cliente.is_ativo ? '#d1fae5' : '#fee2e2',
                                                color: cliente.is_ativo ? '#065f46' : '#991b1b'
                                            }}>
                                                {cliente.is_ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleEditClick(cliente)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    marginRight: '0.5rem',
                                                    backgroundColor: '#4a9b8e',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: '500',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onMouseOver={(e) => e.target.style.backgroundColor = '#3d8b7e'}
                                                onMouseOut={(e) => e.target.style.backgroundColor = '#4a9b8e'}
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button 
                                                onClick={() => handleToggleStatus(cliente.id, !cliente.is_ativo)}
                                                style={{
                                                    padding: '0.5rem 0.4rem',
                                                    backgroundColor: cliente.is_ativo ? '#dc2626' : '#16a34a',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onMouseOver={(e) => e.target.style.backgroundColor = cliente.is_ativo ? '#b91c1c' : '#15803d'}
                                                onMouseOut={(e) => e.target.style.backgroundColor = cliente.is_ativo ? '#dc2626' : '#16a34a'}
                                            >
                                                {cliente.is_ativo ? '🚫 Desativar' : '✅ Ativar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </>
    );
}

export default VisualizarClientes;
