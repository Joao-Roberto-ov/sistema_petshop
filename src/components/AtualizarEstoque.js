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

// Componente da Badge de Estoque
const EstoqueBadge = ({ estoque }) => {
    let styles = {
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.875rem',
        fontWeight: '500',
        display: 'inline-block',
        minWidth: '100px',
        textAlign: 'center'
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

    const texto = estoque <= 0 ? `Esgotado (${estoque})` : estoque < 10 ? `Baixo (${estoque})` : `Em Estoque (${estoque})`;

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

    // Filtra produtos para o dropdown, excluindo os que já estão na lista
    const filteredProducts = useMemo(() => {
        if (searchTerm === '') return [];

        const productsInList = new Set(productsToUpdate.map(p => p.id));

        return allProducts.filter(p =>
            !productsInList.has(p.id) &&
            p.nome.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10); // Limita a 10 sugestões
    }, [searchTerm, allProducts, productsToUpdate]);

    const handleAddProduct = (produto) => {
        setProductsToUpdate(prev => [
            ...prev,
            {
                id: produto.id,
                nome: produto.nome,
                estoqueAtual: produto.estoque,
                adicionar: 1, // Inicia com 1
                novoEstoque: produto.estoque + 1
            }
        ]);
        setSearchTerm('');
    };

    const handleRemoveProduct = (produtoId) => {
        setProductsToUpdate(prev => prev.filter(p => p.id !== produtoId));
    };

    const handleQuantityChange = (produtoId, value) => {
        // Garante que o valor seja 1 ou mais
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
                        Adicione produtos e informe a quantidade recebida para atualizar o estoque.
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
                    <div className="estoque-card">

                        {error && <div className="message error-message">{error}</div>}
                        {success && <div className="message success-message">{success}</div>}

                        {/* 1. Seleção de Produto */}
                        <div className="search-section">
                            <label className="form-label">Buscar Produto</label>
                            <div className="search-wrapper">
                                <IconSearch />
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Digite o nome do produto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            {filteredProducts.length > 0 && (
                                <div className="suggestions-list">
                                    {filteredProducts.map(p => (
                                        <div
                                            key={p.id}
                                            className="suggestion-item"
                                            onClick={() => handleAddProduct(p)}
                                        >
                                            {p.nome} <small>({p.marca || 'Sem marca'})</small>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Lista de Produtos para Atualizar */}
                        <div className="lista-atualizar">
                            <h3>Produtos Selecionados</h3>
                            {productsToUpdate.length === 0 ? (
                                <p className="lista-vazia">Nenhum produto adicionado à lista.</p>
                            ) : (
                                productsToUpdate.map(p => (
                                    <div key={p.id} className="item-atualizar">
                                        <div className="item-info">
                                            <strong>{p.nome}</strong>
                                            <EstoqueBadge estoque={p.estoqueAtual} />
                                        </div>
                                        <div className="item-inputs">
                                            <label>Adicionar:</label>
                                            <input
                                                type="number"
                                                className="input-qtd"
                                                min="1"
                                                value={p.adicionar}
                                                onChange={(e) => handleQuantityChange(p.id, e.target.value)}
                                            />
                                            <span className="novo-estoque-label">
                                                <IconArrowRight /> Novo Estoque:
                                            </span>
                                            <input
                                                type="text"
                                                className="input-novo-estoque"
                                                value={p.novoEstoque}
                                                readOnly
                                                disabled
                                            />
                                        </div>
                                        <button
                                            className="btn-remover"
                                            onClick={() => handleRemoveProduct(p.id)}
                                            title="Remover"
                                        >
                                            <IconX />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* 3. Botão de Salvar */}
                        {productsToUpdate.length > 0 && (
                            <div className="footer-actions">
                                <button
                                    className="btn-submit"
                                    onClick={handleSubmit}
                                    disabled={saving}
                                >
                                    {saving ? "Salvando..." : `Salvar Alterações (${productsToUpdate.length})`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AtualizarEstoque;