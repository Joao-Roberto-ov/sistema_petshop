import React, { useEffect, useState } from 'react';
import axios from '../api/axios';

function VisualizarClientes({ onBack }) {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null); // ID do cliente sendo editado

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

            // Ordena por id
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
                // Edição de cliente existente
                await axios.put(`/funcionario/editar-cliente/${editingId}`, dadosParaEnviar, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFormSuccess(`Cliente '${formData.nome}' atualizado com sucesso!`);
            } else {
                // Cadastro de novo cliente
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
            fetchClientes(); // Atualiza lista de clientes
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

    if (loading) return <p className="container">Carregando clientes...</p>;
    if (error) return <p className="container">{error}</p>;

    return (
        <section className="section" style={{ backgroundColor: '#f8f8f8', padding: '2rem' }}>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h2>Clientes Cadastrados</h2>
                    <div>
                        <button className="btn btn-secondary hover-lift" onClick={() => {
                            setShowForm(!showForm);
                            if (!showForm) setEditingId(null);
                        }}>
                            {showForm ? 'Cancelar' : 'Cadastrar Novo Cliente'}
                        </button>
                        <button className="btn btn-secondary hover-lift" onClick={onBack} style={{ marginLeft: '0.5rem' }}>
                            Voltar
                        </button>
                    </div>
                </div>

                {showForm && (
                    <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderRadius: '5px' }}>
                        {formError && <div style={{ color: 'red', marginBottom: '0.5rem' }}>{formError}</div>}
                        {formSuccess && <div style={{ color: 'green', marginBottom: '0.5rem' }}>{formSuccess}</div>}
                        <form onSubmit={handleFormSubmit}>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="Nome completo *"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc' }}
                                />
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <input
                                    type="email"
                                    placeholder="Email *"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc' }}
                                />
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <input
                                    type="tel"
                                    placeholder="Telefone"
                                    value={formData.telefone}
                                    onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc' }}
                                />
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="Endereço (opcional)"
                                    value={formData.endereco}
                                    onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc' }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={formLoading}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: formLoading ? '#6c757d' : '#007bff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: formLoading ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {formLoading ? (editingId ? 'Atualizando...' : 'Cadastrando...') : (editingId ? 'Atualizar Cliente' : 'Cadastrar Cliente')}
                            </button>
                        </form>
                    </div>
                )}

                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderRadius: '5px' }}>
                    <thead style={{ backgroundColor: '#007bff', color: '#fff' }}>
                        <tr>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Nome</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Telefone</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Endereço</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>CPF</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.map(cliente => (
                            <tr key={cliente.id} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '10px' }}>{cliente.nome}</td>
                                <td style={{ padding: '10px' }}>{cliente.email}</td>
                                <td style={{ padding: '10px' }}>{cliente.telefone || '-'}</td>
                                <td style={{ padding: '10px' }}>{cliente.endereco || '-'}</td>
                                <td style={{ padding: '10px' }}>{cliente.cpf || '-'}</td>
                                <td style={{ padding: '10px' }}>
                                    <button className="btn btn-primary" onClick={() => handleEditClick(cliente)}>Editar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default VisualizarClientes;
