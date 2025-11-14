import React, { useState, useEffect, useMemo } from 'react';
import axios from '../api/axios';
import './AtualizarEstoque.css';

// Ícones
const IconSearch = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path>
    </svg>
);
const IconX = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);
const IconArrowRight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);
const IconPlus = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

// Componente da Badge de Estoque
const EstoqueBadge = ({ estoque }) => {
    let styles = {
        padding: '0.25rem 0.5rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-block',
        textAlign: 'center',
        minWidth: '80px'
    };

    if (estoque <= 0) {
        styles.backgroundColor = '#fee2e2';
        styles.color = '#991b1b';
    } else if (estoque < 10) {
        styles.backgroundColor = '#fffbeb';
        styles.color = '#b45309';
    } else {
        styles.backgroundColor = '#d1fae5';
        styles.color = '#065f46';
    }

    const texto = estoque <= 0 ? `Esgotado (${estoque})` : estoque < 10 ? `Baixo (${estoque})` : `Ok (${estoque})`;

    return <span style={styles}>{texto}</span>;
};

function AtualizarEstoque({ onBack }) {
    const [allProducts, setAllProducts] = useState([]);
    const [productsToUpdate, setProductsToUpdate] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchAllProducts();
    }, []);

    const fetchAllProducts = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/produtos/listar');
            setAllProducts(response.data || []);
        } catch (err) {
            setError('Erro ao carregar lista de produtos.');
        } finally {
            setLoading(false);
        }
    };

    // Filtra produtos para a tabela da direita
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return allProducts;
        return allProducts.filter(p =>
            p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.marca && p.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.barcode && p.barcode.includes(searchTerm))
        );
    }, [searchTerm, allProducts]);

    const handleAddProduct = (produto) => {
        // Verifica se já está na lista de atualização
        if (productsToUpdate.find(p => p.id === produto.id)) {
            // Se já estiver, apenas foca ou avisa (opcional)
            return;
        }

        setProductsToUpdate(prev => [
            ...prev,
            {
                id: produto.id,
                nome: produto.nome,
                marca: produto.marca,
                estoqueAtual: produto.estoque,
                adicionar: 1, // Inicia com 1
                novoEstoque: produto.estoque + 1
            }
        ]);
    };

    const handleRemoveProduct = (produtoId) => {
        setProductsToUpdate(prev => prev.filter(p => p.id !== produtoId));
    };

    const handleQuantityChange = (produtoId, value) => {
        const novaQtd = Math.max(1, parseInt(value) || 1);

        setProductsToUpdate(prev => prev.map(p => {
            if (p.id === produtoId) {
                return {
                    ...p,
                    adicionar: novaQtd,
                    novoEstoque: p.estoqueAtual + novaQtd
                };
            }
            return p;
        }));
    };

    const handleSubmit = async () => {
        if (productsToUpdate.length === 0) {
            setError("Nenhum produto selecionado para atualizar.");
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                itens: productsToUpdate.map(p => ({
                    produto_id: p.id,
                    quantidade_adicionar: p.adicionar
                }))
            };

            await axios.post('/produtos/atualizar-estoque-lote', payload);

            setSuccess(`Estoque de ${productsToUpdate.length} produto(s) atualizado com sucesso!`);
            setProductsToUpdate([]);
            fetchAllProducts(); // Recarrega os produtos com novos estoques

        } catch (err) {
            console.error("Erro ao salvar estoque:", err);
            setError(err.response?.data?.detail || "Erro ao salvar estoque.");
        } finally {
            setSaving(false);
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
        <div className="atualizar-estoque-container">
            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">Atualizar Estoque em Lote</h1>
                    <p className="animate-fade-in-up">
                        Selecione produtos na tabela à direita para atualizar suas quantidades.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn btn-outline-white hover-lift" onClick={onBack}>
                            ← Voltar
                        </button>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">

                    {error && <div className="message error-message">{error}</div>}
                    {success && <div className="message success-message">{success}</div>}

                    <div className="estoque-layout">
                        {/* COLUNA ESQUERDA: Lista de Atualização */}
                        <div className="painel-esquerdo">
                            <div className="painel-header">
                                <h3>Itens para Atualizar ({productsToUpdate.length})</h3>
                                {productsToUpdate.length > 0 && (
                                    <button className="btn-limpar" onClick={() => setProductsToUpdate([])}>
                                        Limpar Tudo
                                    </button>
                                )}
                            </div>

                            <div className="lista-scroll-update">
                                {productsToUpdate.length === 0 ? (
                                    <div className="lista-vazia">
                                        <p>Nenhum produto selecionado.</p>
                                        <small>Clique em um produto na tabela ao lado para adicionar.</small>
                                    </div>
                                ) : (
                                    productsToUpdate.map(p => (
                                        <div key={p.id} className="item-atualizar-card">
                                            <div className="card-top">
                                                <div className="card-info">
                                                    <strong>{p.nome}</strong>
                                                    <small>{p.marca}</small>
                                                </div>
                                                <button
                                                    className="btn-remover-mini"
                                                    onClick={() => handleRemoveProduct(p.id)}
                                                >
                                                    <IconX />
                                                </button>
                                            </div>

                                            <div className="card-bottom">
                                                <div className="estoque-atual-badge">
                                                    Atual: {p.estoqueAtual}
                                                </div>
                                                <div className="input-group-update">
                                                    <span>+</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={p.adicionar}
                                                        onChange={(e) => handleQuantityChange(p.id, e.target.value)}
                                                    />
                                                </div>
                                                <div className="estoque-final">
                                                    <IconArrowRight /> {p.novoEstoque}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="painel-footer">
                                <button
                                    className="btn-submit full-width"
                                    onClick={handleSubmit}
                                    disabled={saving || productsToUpdate.length === 0}
                                >
                                    {saving ? "Salvando..." : "Confirmar Atualização"}
                                </button>
                            </div>
                        </div>

                        {/* COLUNA DIREITA: Catálogo de Produtos */}
                        <div className="painel-direito">
                            <div className="painel-header-search">
                                <h3>Catálogo de Produtos</h3>
                                <div className="search-wrapper-table">
                                    <IconSearch />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nome, marca ou código..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="tabela-scroll-container">
                                <table className="tabela-produtos-estoque">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Marca</th>
                                            <th style={{textAlign: 'center'}}>Estoque</th>
                                            <th style={{textAlign: 'center'}}>Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map(produto => {
                                            const isSelected = productsToUpdate.some(p => p.id === produto.id);
                                            return (
                                                <tr
                                                    key={produto.id}
                                                    className={isSelected ? 'selected-row' : ''}
                                                    onClick={() => handleAddProduct(produto)}
                                                >
                                                    <td className="td-nome">{produto.nome}</td>
                                                    <td>{produto.marca || '-'}</td>
                                                    <td style={{textAlign: 'center'}}>
                                                        <EstoqueBadge estoque={produto.estoque} />
                                                    </td>
                                                    <td style={{textAlign: 'center'}}>
                                                        {isSelected ? (
                                                            <span className="check-icon">✓</span>
                                                        ) : (
                                                            <button className="btn-add-mini">
                                                                <IconPlus />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredProducts.length === 0 && (
                                            <tr>
                                                <td colSpan="4" style={{textAlign: 'center', padding: '2rem', color: '#666'}}>
                                                    Nenhum produto encontrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
}

export default AtualizarEstoque;