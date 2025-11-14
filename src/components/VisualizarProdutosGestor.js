import React, { useEffect, useState } from 'react';
import axios from '../api/axios';

function VisualizarProdutosGestor({ onBack, onNavigateToAtualizarEstoque }) {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isExterno, setIsExterno] = useState(false);

    const [formData, setFormData] = useState({
        barcode: '', nome: '', marca: '', categoria: '', descricao: '',
        url_imagem: '', preco_venda: '', estoque: 0
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    useEffect(() => {
        fetchProdutos();
    }, []);

    const fetchProdutos = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('/produtos/listar', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProdutos(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao buscar produtos.');
        } finally {
            setLoading(false);
        }
    };

    const formatarReal = (value) => {
        let numero = value.replace(/\D/g, '');
        numero = (Number(numero) / 100).toFixed(2);
        return numero.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'preco_venda') {
            setFormData({ ...formData, [name]: formatarReal(value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleEditClick = async (produto) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/produtos/verificar-externo/${produto.barcode}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setIsExterno(response.data.eh_externo);
            setFormData({
                barcode: produto.barcode,
                nome: produto.nome,
                marca: produto.marca || '',
                categoria: produto.categoria || '',
                descricao: produto.descricao || '',
                url_imagem: produto.url_imagem || '',
                preco_venda: produto.preco_venda.toFixed(2).replace('.', ','),
                estoque: produto.estoque,
                animais_alvo: produto.animais_alvo || 'Todos'
            });
            setEditingId(produto.id);
            setShowForm(true);
            setFormSuccess('');
            setFormError('');
        } catch (err) {
            setError('Erro ao verificar produto.');
        }
    };

    const handleDeleteClick = async (produto) => {
        if (!window.confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?\n\nEsta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/produtos/excluir/${produto.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(`Produto "${produto.nome}" excluído com sucesso!`);
            fetchProdutos();
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Erro ao excluir produto.';
            setError(errorMsg);
            alert(errorMsg);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');
        setFormSuccess('');

        try {
            const token = localStorage.getItem('token');
            const precoLimpo = formData.preco_venda.replace(/\./g, '').replace(',', '.');

            const dadosParaEnviar = {
                ...formData,
                preco_venda: parseFloat(precoLimpo),
                estoque: parseInt(formData.estoque)
            };

            await axios.put(`/produtos/editar/${editingId}`, dadosParaEnviar, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setFormSuccess(`Produto '${formData.nome}' atualizado com sucesso!`);
            setTimeout(() => {
                setFormData({ barcode: '', nome: '', marca: '', categoria: '', descricao: '', url_imagem: '', preco_venda: '', estoque: 0 });
                setEditingId(null);
                setShowForm(false);
                fetchProdutos();
            }, 2000);
        } catch (err) {
            setFormError(err.response?.data?.detail || 'Erro ao atualizar produto.');
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="login-container">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <h2>Carregando produtos...</h2>
                </div>
            </div>
        );
    }

    return (
        <div>
            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">Gerenciar Produtos</h1>
                    <p className="animate-fade-in-up">
                        Visualize, edite e atualize o estoque dos produtos cadastrados.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn btn-outline-white hover-lift" onClick={onNavigateToAtualizarEstoque}>
                            📦 Atualizar Estoque
                        </button>
                        <button className="btn btn-outline-white hover-lift" onClick={onBack}>
                            Voltar
                        </button>
                    </div>
                </div>
            </section>

            {showForm && (
                <section className="section bg-light">
                    <div className="container">
                        <div className="login-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <div className="login-header">
                                <h2>Editar Produto</h2>
                                {isExterno && (
                                    <p style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                        Produto da base externa: apenas preco e estoque podem ser editados
                                    </p>
                                )}
                            </div>

                            {formError && <div className="error-message">{formError}</div>}
                            {formSuccess && <div className="success-message">{formSuccess}</div>}

                            <form onSubmit={handleFormSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Codigo de Barras</label>
                                    <input type="text" className="form-input" value={formData.barcode} disabled />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Nome</label>
                                    <input type="text" name="nome" className="form-input" value={formData.nome} onChange={handleInputChange} disabled={isExterno} required />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Marca</label>
                                    <input type="text" name="marca" className="form-input" value={formData.marca} onChange={handleInputChange} disabled={isExterno} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Preco</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontWeight: '500' }}>R$</span>
                                        <input type="text" name="preco_venda" className="form-input" style={{ paddingLeft: '35px' }} value={formData.preco_venda} onChange={handleInputChange} required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Estoque</label>
                                    <input type="number" name="estoque" className="form-input" value={formData.estoque} onChange={handleInputChange} min="0" required />
                                </div>

                                <button type="submit" className="btn-submit" disabled={formLoading}>
                                    {formLoading ? 'Salvando...' : 'Salvar Alteracoes'}
                                </button>
                                <button type="button" className="btn-submit" style={{ backgroundColor: '#6c757d', marginTop: '0.5rem' }} onClick={() => setShowForm(false)}>
                                    Cancelar
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            )}

            <section className="section">
                <div className="container">
                    <div className="text-center" style={{marginBottom: '2rem'}}>
                        <h2 className="section-title">Produtos Cadastrados</h2>
                        <p className="section-description">
                            Total de {produtos.length} produtos
                        </p>
                    </div>

                    <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#4a9b8e', color: '#fff' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Nome</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Marca</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Preco</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Estoque</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Acoes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {produtos.map((produto, index) => (
                                    <tr key={produto.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                        <td style={{ padding: '1rem' }}>{produto.nome}</td>
                                        <td style={{ padding: '1rem' }}>{produto.marca || '-'}</td>
                                        <td style={{ padding: '1rem' }}>R$ {produto.preco_venda.toFixed(2).replace('.', ',')}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>{produto.estoque}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleEditClick(produto)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    backgroundColor: '#4a9b8e',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    marginRight: '0.5rem'
                                                }}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(produto)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    backgroundColor: '#dc2626',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default VisualizarProdutosGestor;