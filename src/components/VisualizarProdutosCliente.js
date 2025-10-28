import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import './VisualizarProdutosCliente.css';
import ProdutoDetalhesModal from './ProdutoDetalhesModal';

function VisualizarProdutosCliente({ onBack }) {
    const [produtos, setProdutos] = useState([]);
    const [produtosFiltrados, setProdutosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todos');
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);

    //try-catch para importar a imagem
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

            //se nao tiver token, tenta buscar sem autenticação
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await axios.get('/produtos/listar', { headers });
            setProdutos(response.data);
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

        //filtro por busca
        if (searchTerm.trim() !== '') {
            filtered = filtered.filter(produto =>
                produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (produto.marca && produto.marca.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        setProdutosFiltrados(filtered);
    };

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
            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">Nossos Produtos</h1>
                    <p className="animate-fade-in-up">
                        Encontre os melhores produtos para seu companheiro
                    </p>
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
                            <button
                                className={`filter-btn ${filterCategory === 'Todos' ? 'active' : ''}`}
                                onClick={() => setFilterCategory('Todos')}
                            >
                                Todos
                            </button>
                            <button
                                className={`filter-btn ${filterCategory === 'Cães' ? 'active' : ''}`}
                                onClick={() => setFilterCategory('Cães')}
                            >
                                🐕 Cães
                            </button>
                            <button
                                className={`filter-btn ${filterCategory === 'Gatos' ? 'active' : ''}`}
                                onClick={() => setFilterCategory('Gatos')}
                            >
                                🐈 Gatos
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="text-center" style={{marginBottom: '2rem'}}>
                        <p className="section-description">
                            {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''} encontrado{produtosFiltrados.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="produtos-grid">
                        {produtosFiltrados.map(produto => (
                            <div
                                key={produto.id}
                                className="produto-card"
                                onClick={() => setProdutoSelecionado(produto)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="produto-image-container">
                                    <img
                                        src={produto.url_imagem || imagemPadrao}
                                        alt={produto.nome}
                                        className="produto-image"
                                        onError={(e) => { e.target.src = imagemPadrao; }}
                                    />
                                    {produto.estoque <= 0 && (
                                        <div className="produto-badge esgotado">Esgotado</div>
                                    )}
                                    {produto.estoque > 0 && produto.estoque < 10 && (
                                        <div className="produto-badge baixo-estoque">Últimas unidades</div>
                                    )}
                                </div>

                                <div className="produto-content">
                                    <div className="produto-category">
                                        {obterIconeAnimal(produto.animais_alvo)}
                                    </div>
                                    <h3 className="produto-nome">{produto.nome}</h3>
                                    {produto.marca && (
                                        <p className="produto-marca">{produto.marca}</p>
                                    )}
                                    <div className="produto-footer">
                                        <span className="produto-preco">
                                            R$ {produto.preco_venda.toFixed(2).replace('.', ',')}
                                        </span>
                                        <span className="produto-estoque">
                                            {produto.estoque > 0 ? `${produto.estoque} em estoque` : 'Indisponível'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {produtosFiltrados.length === 0 && (
                        <div className="no-produtos">
                            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</p>
                            <p style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                {produtos.length === 0
                                    ? 'Sem produtos disponíveis no momento'
                                    : 'Nenhum produto encontrado'}
                            </p>
                            <p style={{ fontSize: '1rem', color: '#9ca3af' }}>
                                {produtos.length === 0
                                    ? 'Estamos trabalhando para adicionar novos produtos em breve.'
                                    : 'Tente ajustar os filtros ou buscar por outro termo.'}
                            </p>
                        </div>
                    )}

                    {produtoSelecionado && (
                        <ProdutoDetalhesModal
                            produto={produtoSelecionado}
                            onClose={() => setProdutoSelecionado(null)}
                            imagemPadrao={imagemPadrao}
                        />
                    )}
                </div>
            </section>
        </div>
    );
}

export default VisualizarProdutosCliente;