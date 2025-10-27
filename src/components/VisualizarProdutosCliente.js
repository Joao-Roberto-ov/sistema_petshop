import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import './VisualizarProdutosCliente.css';
import ProdutoDetalhesModal from './ProdutoDetalhesModal';

function VisualizarProdutosCliente({ onBack, onNavigateToCheckout }) {
    const [produtos, setProdutos] = useState([]);
    const [produtosFiltrados, setProdutosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todos');
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);
    const [carrinho, setCarrinho] = useState([]);
    const [mostrarCarrinho, setMostrarCarrinho] = useState(false);

    let imagemPadrao;
    try {
        imagemPadrao = require('../imagens/Produto-sem-foto.jpg');
    } catch {
        imagemPadrao = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="24" dy="200" dx="50"%3ESem imagem%3C/text%3E%3C/svg%3E';
    }

    useEffect(() => {
        fetchProdutos();
    }, []);

    useEffect(() => {
        filtrarProdutos();
    }, [searchTerm, filterCategory, produtos]);

    const fetchProdutos = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get('/produtos/listar', { headers });
            setProdutos(response.data || []);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao buscar produtos.');
        } finally {
            setLoading(false);
        }
    };

    const filtrarProdutos = () => {
        let filtered = produtos;

        if (filterCategory !== 'Todos') {
            filtered = filtered.filter(produto => {
                const animalAlvo = produto.animais_alvo || 'Todos';
                if (animalAlvo === 'Todos') return true;
                return animalAlvo === filterCategory;
            });
        }

        if (searchTerm.trim() !== '') {
            filtered = filtered.filter(produto =>
                produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (produto.marca && produto.marca.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        setProdutosFiltrados(filtered);
    };

    const adicionarAoCarrinho = (produto, e) => {
        if (e && e.stopPropagation) e.stopPropagation();

        setCarrinho(prev => {
            const existente = prev.find(item => item.id === produto.id);
            if (existente) {
                return prev.map(item =>
                    item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
                );
            }
            return [...prev, { ...produto, quantidade: 1 }];
        });
    };

    const alterarQuantidade = (id, delta) => {
        setCarrinho(prev =>
            prev
                .map(item =>
                    item.id === id ? { ...item, quantidade: Math.max(1, item.quantidade + delta) } : item
                )
                .filter(item => item.quantidade > 0)
        );
    };

    const removerProduto = (id) => {
        setCarrinho(prev => prev.filter(item => item.id !== id));
    };

    const totalCarrinho = carrinho.reduce(
        (total, item) => total + (item.preco_venda || 0) * item.quantidade,
        0
    );

    const obterIconeAnimal = (animalAlvo) => {
        if (!animalAlvo || animalAlvo === 'Todos') return '🐾 Todos';
        if (animalAlvo === 'Cães') return '🐕 Cães';
        if (animalAlvo === 'Gatos') return '🐈 Gatos';
        return '🐾 Todos';
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
            {/* Carrinho fixo no canto */}
            <div className="carrinho-flutuante">
                <button
                    className="botao-carrinho-flutuante"
                    onClick={() => setMostrarCarrinho(!mostrarCarrinho)}
                >
                    🛒
                    {carrinho.length > 0 && (
                        <span className="contador-carrinho">
                            {carrinho.reduce((s, i) => s + i.quantidade, 0)}
                        </span>
                    )}
                </button>
            </div>

            {/* Modal lateral do carrinho */}
            {mostrarCarrinho && (
                <div className="carrinho-modal" role="dialog" aria-modal="true">
                    <div className="carrinho-header">
                        <h3>Seu Carrinho</h3>
                        <button onClick={() => setMostrarCarrinho(false)}>✖</button>
                    </div>

                    {carrinho.length === 0 ? (
                        <p>Seu carrinho está vazio.</p>
                    ) : (
                        <>
                            {carrinho.map(item => (
                                <div key={item.id} className="carrinho-item">
                                    <div>
                                        <strong>{item.nome}</strong>
                                        <p>R$ {Number(item.preco_venda).toFixed(2)} x {item.quantidade}</p>
                                    </div>
                                    <div className="carrinho-acoes">
                                        <button onClick={() => alterarQuantidade(item.id, -1)}>-</button>
                                        <button onClick={() => alterarQuantidade(item.id, 1)}>+</button>
                                        <button onClick={() => removerProduto(item.id)}>🗑</button>
                                    </div>
                                </div>
                            ))}

                            <hr />
                            <h4>Total: R$ {totalCarrinho.toFixed(2)}</h4>

                            {/* Botão que leva ao checkout */}
                            <button
                                className="btn-finalizar"
                                onClick={() => onNavigateToCheckout(carrinho)}
                            >
                                Finalizar Compra
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Seções de produtos */}
            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">Nossos Produtos</h1>
                    <p className="animate-fade-in-up">Encontre os melhores produtos para seu companheiro</p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="produtos-filters">
                        <input
                            type="text"
                            className="form-input search-produtos"
                            placeholder="Pesquisar produtos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <div className="category-filters">
                            {['Todos', 'Cães', 'Gatos'].map(cat => (
                                <button
                                    key={cat}
                                    className={`filter-btn ${filterCategory === cat ? 'active' : ''}`}
                                    onClick={() => setFilterCategory(cat)}
                                >
                                    {cat === 'Todos' ? '🐾' : cat === 'Cães' ? '🐕' : '🐈'} {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="produtos-grid">
                        {produtosFiltrados.map(produto => (
                            <div
                                key={produto.id}
                                className="produto-card"
                                onClick={() => setProdutoSelecionado(produto)}
                            >
                                <div className="produto-image-container">
                                    <img
                                        src={produto.url_imagem || imagemPadrao}
                                        alt={produto.nome}
                                        className="produto-image"
                                        onError={(e) => { e.target.src = imagemPadrao; }}
                                    />
                                    {produto.estoque <= 0 && <div className="produto-badge esgotado">Esgotado</div>}
                                    {produto.estoque > 0 && produto.estoque < 10 && (
                                        <div className="produto-badge baixo-estoque">Últimas unidades</div>
                                    )}
                                </div>

                                <div className="produto-content">
                                    <div className="produto-category">{obterIconeAnimal(produto.animais_alvo)}</div>
                                    <h3 className="produto-nome">{produto.nome}</h3>
                                    {produto.marca && <p className="produto-marca">{produto.marca}</p>}
                                    <div className="produto-footer">
                                        <span className="produto-preco">
                                            R$ {produto.preco_venda.toFixed(2).replace('.', ',')}
                                        </span>
                                        <span className="produto-estoque">
                                            {produto.estoque > 0 ? `${produto.estoque} em estoque` : 'Indisponível'}
                                        </span>
                                        <button
                                            className="adicionar-carrinho-btn"
                                            disabled={produto.estoque <= 0}
                                            onClick={(e) => adicionarAoCarrinho(produto, e)}
                                        >
                                            Adicionar ao Carrinho
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {produtosFiltrados.length === 0 && (
                        <div className="no-produtos">
                            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</p>
                            <p style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                {produtos.length === 0 ? 'Sem produtos disponíveis no momento' : 'Nenhum produto encontrado'}
                            </p>
                        </div>
                    )}

                    {produtoSelecionado && (
                        <ProdutoDetalhesModal
                            produto={produtoSelecionado}
                            onClose={() => setProdutoSelecionado(null)}
                            imagemPadrao={imagemPadrao}
                            onAdicionarAoCarrinho={(produto) => adicionarAoCarrinho(produto)}
                        />
                    )}
                </div>
            </section>
        </div>
    );
}

export default VisualizarProdutosCliente;
