import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import './CadastrarProduto.css';

//base do forms
const initialState = {
    barcode: '',
    nome: '',
    marca: '',
    categoria: '',
    descricao: '',
    url_imagem: '',
    preco_venda: '',
    estoque: 0
};

function CadastrarProdutoScreen({ onNavigateToHome }) {
    const [formData, setFormData] = useState(initialState);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isBarcodeLocked, setIsBarcodeLocked] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    //evita chamadas excessivas para a API enquanto o user digita
    useEffect(() => {
        //limpa as sugestoes se a barra de busca estiver vazia ou com um item selecionado
        if (!searchQuery || isBarcodeLocked) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            setIsLoadingSuggestions(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`/produtos/buscar-externo?q=${searchQuery}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setSuggestions(response.data);
            } catch (err) {
                //nao mostra erros de busca na tela do user
                console.error("Erro ao buscar sugestões:", err);
                setSuggestions([]);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };

        //timer para fazer a busca 150ms após o usuário parar de digitar
        const timerId = setTimeout(() => {
            fetchSuggestions();
        }, 150);

        //reseta o timer se o user digitar novamente
        return () => clearTimeout(timerId);
    }, [searchQuery, isBarcodeLocked]);


    const handleSuggestionClick = async (barcode) => {
        setSearchQuery('');
        setSuggestions([]);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/produtos/detalhes-externo/${barcode}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            //preenche o formulario com os dados da API
            setFormData({
                barcode: response.data.barcode || '',
                nome: response.data.nome || '',
                marca: response.data.marca || '',
                categoria: response.data.categoria || '',
                descricao: response.data.descricao || '',
                url_imagem: response.data.url_imagem || '',
                preco_venda: '', //deixei o preço e o estoque para o gestor digitar
                estoque: 0
            });
            //bloqueia o campo de código de barras, pois o produto foi encontrado
            setIsBarcodeLocked(true);
        } catch (err) {
            setError('Não foi possível obter os detalhes do produto selecionado.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        //se a barra de busca for alterada, atualiza o searchQuery
        if (name === 'search') {
            setSearchQuery(value);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleClearForm = () => {
        setFormData(initialState);
        setSearchQuery('');
        setSuggestions([]);
        setIsBarcodeLocked(false);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        //validaçao simples
        if (!formData.barcode || !formData.nome || !formData.preco_venda) {
            setError('Código de barras, Nome e Preço são obrigatórios.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const dadosParaEnviar = {
                ...formData,
                preco_venda: parseFloat(formData.preco_venda),
                estoque: parseInt(formData.estoque)
            };

            await axios.post('/produtos/cadastrar', dadosParaEnviar, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setSuccess(`Produto '${formData.nome}' cadastrado com sucesso!`);
            handleClearForm(); //limpa o formulario apos o sucesso

        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao cadastrar o produto.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="product-container">
            <div className="product-card">
                <div className="product-header">
                    <h1>Gerenciar Produtos</h1>
                    <p>Busque por um produto na base de dados externa ou cadastre um item novo.</p>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {/* busca */}
                <div className="search-section">
                    <label htmlFor="search" className="search-label">
                        Buscar Produto por Nome ou Código de Barras
                    </label>
                    <input
                        type="text"
                        id="search"
                        name="search"
                        className="search-input"
                        placeholder="Digite para buscar..."
                        value={searchQuery}
                        onChange={handleInputChange}
                        disabled={isBarcodeLocked}
                    />
                    {isLoadingSuggestions && <div className="manual-info">Buscando...</div>}
                    {suggestions.length > 0 && (
                        <div className="suggestions-list">
                            {suggestions.map(s => (
                                <div key={s.barcode} className="suggestion-item" onClick={() => handleSuggestionClick(s.barcode)}>
                                    <strong>{s.nome}</strong>
                                    <span>({s.marca})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>


                {/* forms */}
                <form onSubmit={handleSubmit}>
                    {!isBarcodeLocked && (
                         <p className="manual-info">
                            Se não encontrar o produto, preencha os campos manualmente abaixo.
                         </p>
                    )}

                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label className="form-label">Código de Barras *</label>
                            <input type="text" name="barcode" className="form-input" value={formData.barcode} onChange={handleInputChange} required disabled={isBarcodeLocked} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nome do Produto *</label>
                            <input type="text" name="nome" className="form-input" value={formData.nome} onChange={handleInputChange} required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Marca</label>
                            <input type="text" name="marca" className="form-input" value={formData.marca} onChange={handleInputChange} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Preço de Venda (R$) *</label>
                            <input type="number" step="0.01" name="preco_venda" className="form-input" value={formData.preco_venda} onChange={handleInputChange} required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Estoque Inicial *</label>
                            <input type="number" name="estoque" className="form-input" value={formData.estoque} onChange={handleInputChange} required />
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">Descrição / Ingredientes</label>
                            <textarea name="descricao" className="form-input" rows="4" value={formData.descricao} onChange={handleInputChange}></textarea>
                        </div>

                        {formData.url_imagem && (
                             <div className="form-group">
                                <label className="form-label">Preview da Imagem</label>
                                <img src={formData.url_imagem} alt="Preview" className="product-image-preview" />
                            </div>
                        )}
                    </div>

                    <div className="edit-buttons" style={{marginTop: '2rem'}}>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar Produto'}
                        </button>
                        <button type="button" className="btn-cancel" onClick={handleClearForm}>
                            Limpar Formulário
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CadastrarProdutoScreen;