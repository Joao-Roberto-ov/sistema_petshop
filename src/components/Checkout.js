import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

function Checkout({ carrinho, onBack }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userData, setUserData] = useState(null);
    const [formaPagamento, setFormaPagamento] = useState('pix');
    const [retiradaNaLoja, setRetiradaNaLoja] = useState(false);
    const [endereco, setEndereco] = useState({
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
    });

    useEffect(() => {
        const savedUser = localStorage.getItem('userData');
        const token = localStorage.getItem('token');

        if (!token || !savedUser) {
            setError('Você precisa estar logado para finalizar a compra.');
        } else {
            setUserData(JSON.parse(savedUser));
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEndereco(prev => ({ ...prev, [name]: value }));
    };

const finalizarCompra = async () => {
    if (!userData) {
        setError('Usuário não autenticado.');
        return;
    }
    if (carrinho.length === 0) {
        setError('Carrinho vazio.');
        return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
        const token = localStorage.getItem('token');

        const payload = {
            cliente_id: userData.id,
            forma_pagamento: formaPagamento,
            endereco_entrega: retiradaNaLoja ? null : endereco,
            retirada_na_loja: retiradaNaLoja,
            itens: carrinho.map(item => ({
                tipo: 'produto', // ou 'servico', conforme item
                id_item: item.id,
                nome: item.nome,
                quantidade: item.quantidade || 1,
                preco_unitario: item.preco || 0
            }))
        };

        const response = await axios.post('/checkout', payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        setSuccess(`Compra realizada com sucesso! ID: ${response.data.id_venda}, Total: R$ ${response.data.total?.toFixed(2) || '0.00'}`);
    } catch (err) {
        setError(err.response?.data?.mensagem || 'Erro ao finalizar a compra.');
    } finally {
        setLoading(false);
    }
};



    const containerStyle = {
        maxWidth: '800px',
        margin: '2rem auto',
        padding: '1.5rem',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
    };

    const productStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.5rem 0',
        borderBottom: '1px solid #ddd'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.5rem',
        marginBottom: '1rem',
        borderRadius: '4px',
        border: '1px solid #ccc'
    };

    const buttonStyle = {
        padding: '0.75rem 1.5rem',
        marginRight: '1rem',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    };

    const btnFinalizar = { ...buttonStyle, backgroundColor: '#28a745', color: '#fff' };
    const btnVoltar = { ...buttonStyle, backgroundColor: '#6c757d', color: '#fff' };

    return (
        <div style={containerStyle}>
            <h1>Checkout</h1>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
            {success && <div style={{ color: 'green', marginBottom: '1rem' }}>{success}</div>}

            <h2>Produtos no Carrinho</h2>
            {carrinho.length === 0 ? (
                <p>Seu carrinho está vazio.</p>
            ) : (
                carrinho.map(item => (
                    <div key={item.id} style={productStyle}>
                        <span>{item.nome}</span>
                        <span>Qtd: {item.quantidade || 1}</span>
                        <span>R$ {(item.preco_venda || 0).toFixed(2)}</span>
                    </div>
                ))
            )}


            {!retiradaNaLoja && (
                <>
                    <h2>Endereço de Entrega</h2>
                    <input
                        style={inputStyle}
                        type="text"
                        name="rua"
                        placeholder="Rua"
                        value={endereco.rua}
                        onChange={handleInputChange}
                    />
                    <input
                        style={inputStyle}
                        type="text"
                        name="numero"
                        placeholder="Número"
                        value={endereco.numero}
                        onChange={handleInputChange}
                    />
                    <input
                        style={inputStyle}
                        type="text"
                        name="bairro"
                        placeholder="Bairro"
                        value={endereco.bairro}
                        onChange={handleInputChange}
                    />
                    <input
                        style={inputStyle}
                        type="text"
                        name="cidade"
                        placeholder="Cidade"
                        value={endereco.cidade}
                        onChange={handleInputChange}
                    />
                    <input
                        style={inputStyle}
                        type="text"
                        name="estado"
                        placeholder="Estado"
                        value={endereco.estado}
                        onChange={handleInputChange}
                    />
                    <input
                        style={inputStyle}
                        type="text"
                        name="cep"
                        placeholder="CEP"
                        value={endereco.cep}
                        onChange={handleInputChange}
                    />
                </>
            )}

            <div style={{ marginBottom: '1rem' }}>
                <label>
                    <input
                        type="checkbox"
                        checked={retiradaNaLoja}
                        onChange={() => setRetiradaNaLoja(!retiradaNaLoja)}
                        style={{ marginRight: '0.5rem' }}
                    />
                    Retirar na loja
                </label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label>
                    Forma de pagamento:
                    <select
                        value={formaPagamento}
                        onChange={(e) => setFormaPagamento(e.target.value)}
                        style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '4px' }}
                    >
                        <option value="pix">PIX</option>
                        <option value="cartao">Cartão</option>
                    </select>
                </label>
            </div>

            <div>
                <button style={btnFinalizar} onClick={finalizarCompra} disabled={loading}>
                    {loading ? 'Processando...' : 'Finalizar Compra'}
                </button>
                <button style={btnVoltar} onClick={onBack}>Voltar</button>
            </div>
        </div>
    );
}

export default Checkout;