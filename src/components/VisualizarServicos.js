import React, { useEffect, useState } from 'react';
import axios from '../api/axios';

function VisualizarServicos({ onBack }) {
    const [servicos, setServicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        duracao: '',
        preco: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    useEffect(() => {
        fetchServicos();
    }, []);

    const fetchServicos = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('/servicos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const servicosOrdenados = response.data.sort((a, b) => a.id - b.id);
            setServicos(servicosOrdenados);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao buscar serviços.');
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
            const token = localStorage.getItem('token');
            const dadosParaEnviar = {
                nome: formData.nome || undefined,
                descricao: formData.descricao || undefined,
                duracao: Number(formData.duracao) || undefined,
                preco: Number(formData.preco) || undefined
            };

            if (editingId) {
                await axios.put(`/servicos/${editingId}`, dadosParaEnviar, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFormSuccess(`Serviço '${formData.nome}' atualizado com sucesso!`);
            } else {
                await axios.post('/servicos', dadosParaEnviar, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFormSuccess(`Serviço '${formData.nome}' cadastrado com sucesso!`);
            }

            setFormData({ nome: '', descricao: '', duracao: '', preco: '' });
            setEditingId(null);
            setShowForm(false);
            fetchServicos();
        } catch (err) {
            let mensagemErro = 'Erro ao processar formulário.';
            if (err.response?.data?.detail) {
                mensagemErro = err.response.data.detail;
            }
            setFormError(mensagemErro);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditClick = (servico) => {
        setFormData({
            nome: servico.nome,
            descricao: servico.descricao || '',
            duracao: servico.duracao || '',
            preco: servico.preco || ''
        });
        setEditingId(servico.id);
        setShowForm(true);
        setFormSuccess('');
        setFormError('');
    };

    const handleDeleteClick = async (servicoId) => {
        if (!window.confirm('Tem certeza que deseja deletar este serviço?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/servicos/${servicoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchServicos();
        } catch (err) {
            alert(err.response?.data?.detail || 'Erro ao deletar serviço.');
        }
    };

    if (loading) return <p className="container">Carregando serviços...</p>;
    if (error) return <p className="container">{error}</p>;

    return (
        <section className="section" style={{ backgroundColor: '#f8f8f8', padding: '2rem' }}>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h2>Catálogo de Serviços</h2>
                    <div>
                        <button className="btn btn-secondary hover-lift" onClick={() => {
                            setShowForm(!showForm);
                            if (!showForm) setEditingId(null);
                        }}>
                            {showForm ? 'Cancelar' : 'Cadastrar Novo Serviço'}
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
                            <input
                                type="text"
                                placeholder="Nome do serviço *"
                                value={formData.nome}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '5px', border: '1px solid #ccc' }}
                            />
                            <input
                                type="text"
                                placeholder="Descrição"
                                value={formData.descricao}
                                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '5px', border: '1px solid #ccc' }}
                            />
                            <input
                                type="number"
                                placeholder="Duração (minutos) *"
                                value={formData.duracao}
                                onChange={e => setFormData({ ...formData, duracao: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '5px', border: '1px solid #ccc' }}
                            />
                            <input
                                type="number"
                                placeholder="Preço (R$) *"
                                value={formData.preco}
                                onChange={e => setFormData({ ...formData, preco: e.target.value })}
                                required
                                step="0.01"
                                style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '5px', border: '1px solid #ccc' }}
                            />
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
                                {formLoading ? (editingId ? 'Atualizando...' : 'Cadastrando...') : (editingId ? 'Atualizar Serviço' : 'Cadastrar Serviço')}
                            </button>
                        </form>
                    </div>
                )}

                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderRadius: '5px' }}>
                    <thead style={{ backgroundColor: '#007bff', color: '#fff' }}>
                        <tr>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Nome</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Descrição</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Duração</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Preço</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {servicos.map(servico => (
                            <tr key={servico.id} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '10px' }}>{servico.nome}</td>
                                <td style={{ padding: '10px' }}>{servico.descricao || '-'}</td>
                                <td style={{ padding: '10px' }}>{servico.duracao} min</td>
                                <td style={{ padding: '10px' }}>R$ {servico.preco.toFixed(2)}</td>
                                <td style={{ padding: '10px' }}>
                                    <button className="btn btn-primary" onClick={() => handleEditClick(servico)}>Editar</button>
                                    <button className="btn btn-danger" onClick={() => handleDeleteClick(servico.id)} style={{ marginLeft: '0.5rem' }}>Deletar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default VisualizarServicos;
