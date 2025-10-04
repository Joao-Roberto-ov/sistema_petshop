import React, { useEffect, useState } from 'react';
import axios from '../api/axios';

function VisualizarProdutosFuncionario({ onBack }) {
    const [produtos, setProdutos] = useState([]);
    const [produtosFiltrados, setProdutosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProdutos();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setProdutosFiltrados(produtos);
        } else {
            const filtered = produtos.filter(produto =>
                produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                produto.barcode.includes(searchTerm) ||
                (produto.marca && produto.marca.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setProdutosFiltrados(filtered);
        }
    }, [searchTerm, produtos]);

    const fetchProdutos = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('/produtos/listar', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProdutos(response.data);
            setProdutosFiltrados(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao buscar produtos.');
        } finally {
            setLoading(false);
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
                    <h1 className="animate-fade-in-up">Consulta de Produtos</h1>
                    <p className="animate-fade-in-up">
                        Pesquise produtos disponiveis em estoque
                    </p>
                    <div className="hero-buttons">
                        <button className="btn btn-outline-white hover-lift" onClick={onBack}>
                            Voltar
                        </button>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div style={{ marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Pesquisar por nome, codigo ou marca..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ fontSize: '1.1rem', padding: '1rem' }}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="text-center" style={{marginBottom: '2rem'}}>
                        <h2 className="section-title">Produtos Disponiveis</h2>
                        <p className="section-description">
                            {produtosFiltrados.length} produtos encontrados
                        </p>
                    </div>

                    <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#4a9b8e', color: '#fff' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Codigo</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Nome</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Marca</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Preco</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Estoque</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {produtosFiltrados.map((produto, index) => (
                                    <tr key={produto.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{produto.barcode}</td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{produto.nome}</td>
                                        <td style={{ padding: '1rem' }}>{produto.marca || '-'}</td>
                                        <td style={{ padding: '1rem', fontWeight: '600', color: '#16a34a' }}>
                                            R$ {produto.preco_venda.toFixed(2).replace('.', ',')}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>
                                            {produto.estoque}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.875rem',
                                                fontWeight: '500',
                                                backgroundColor: produto.estoque > 0 ? '#d1fae5' : '#fee2e2',
                                                color: produto.estoque > 0 ? '#065f46' : '#991b1b'
                                            }}>
                                                {produto.estoque > 0 ? 'Disponivel' : 'Esgotado'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {produtosFiltrados.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', background: '#f9fafb', borderRadius: '12px', marginTop: '2rem' }}>
                            <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>
                                Nenhum produto encontrado com os termos de busca.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default VisualizarProdutosFuncionario;