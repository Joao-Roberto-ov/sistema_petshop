import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

// --- INÍCIO DAS FUNÇÕES HELPER ---

// Capitaliza a primeira letra de cada palavra
const capitalizeText = (value) => {
    if (!value) return '';
    return value
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Formata o CEP em tempo real (00000-000)
const formatCEP = (value) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (digits.length <= 5) {
        return digits;
    }
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`; // Limita em 8 dígitos
};

// Permite apenas números (e impede a tecla "e")
const allowNumbersOnly = (value) => {
    return value.replace(/[^0-9]/g, '');
};

// Permite apenas letras e espaços (para o campo Estado)
const allowTextOnly = (value) => {
    return value.replace(/[^a-zA-Z\s]/g, '');
};

// Impede que o usuário digite "e" ou "-" em campos numéricos
const handleNumberKeyDown = (e) => {
    if (e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
        e.preventDefault();
    }
};

// --- FIM DAS FUNÇÕES HELPER ---


function Checkout({ carrinho, setCarrinho, onBack }) { // Recebe setCarrinho
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(''); // Erro do SERVIDOR (ex: estoque)
    const [success, setSuccess] = useState('');
    const [userData, setUserData] = useState(null);
    const [formaPagamento, setFormaPagamento] = useState('pix');
    const [retiradaNaLoja, setRetiradaNaLoja] = useState(false);

    // --- NOVO: Estado para o Toast (Req 1) ---
    const [toast, setToast] = useState({ show: false, message: '' });

    // Estado do endereço
    const [endereco, setEndereco] = useState({
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
    });

    const [formErrors, setFormErrors] = useState({});

    const validationError = Object.values(formErrors).some(msg => msg !== null)
                            ? 'Por favor, preencha todos os campos de endereço obrigatórios.'
                            : '';

    // --- NOVO: Função para exibir o toast (Req 1) ---
    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => {
            setToast({ show: false, message: '' });
        }, 4000); // O toast desaparece após 4 segundos
    };

    // Função para validar o formulário
    const validateForm = () => {
        if (retiradaNaLoja) {
            setFormErrors({});
            return true;
        }

        const errors = {};
        if (!endereco.rua.trim()) errors.rua = 'Rua é obrigatória';
        if (!endereco.numero.trim()) errors.numero = 'Número é obrigatório';
        if (!endereco.bairro.trim()) errors.bairro = 'Bairro é obrigatório';
        if (!endereco.cidade.trim()) errors.cidade = 'Cidade é obrigatória';
        if (!endereco.estado.trim()) errors.estado = 'Estado é obrigatório';
        if (endereco.cep.replace(/\D/g, '').length !== 8) errors.cep = 'CEP deve ter 8 dígitos';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };


    useEffect(() => {
        const savedUser = localStorage.getItem('userData');
        const token = localStorage.getItem('token');

        if (!token || !savedUser) {
            setError('Você precisa estar logado para finalizar a compra.');
        } else {
            const parsedUser = JSON.parse(savedUser);
            setUserData(parsedUser);
            setEndereco(prev => ({
                ...prev,
                rua: capitalizeText(parsedUser.endereco || ''),
            }));
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (error) setError('');

        switch (name) {
            case 'rua':
            case 'bairro':
            case 'cidade':
                formattedValue = capitalizeText(value);
                break;
            case 'estado':
                formattedValue = capitalizeText(allowTextOnly(value));
                break;
            case 'numero':
                formattedValue = allowNumbersOnly(value);
                break;
            case 'cep':
                formattedValue = formatCEP(value);
                break;
            default:
                break;
        }

        setEndereco(prev => ({ ...prev, [name]: formattedValue }));

        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // --- NOVO: Funções para alterar carrinho (Req 2) ---
    const handleAlterarQuantidade = (id, delta) => {
        if (!setCarrinho) return;

        setCarrinho(prev =>
            prev
                .map(item => {
                    if (item.id === id) {
                        const novaQuantidade = item.quantidade + delta;

                        // Valida estoque
                        if (delta > 0 && novaQuantidade > item.estoque) {
                            showToast(`Estoque insuficiente de '${item.nome}'. Disponível: ${item.estoque}`);
                            return item; // Não altera
                        }

                        // Remove se a quantidade for 0 ou menor
                        if (novaQuantidade < 1) {
                            return null;
                        }

                        return { ...item, quantidade: novaQuantidade };
                    }
                    return item;
                })
                .filter(Boolean) // Filtra os itens que ficaram nulos (removidos)
        );
    };

    const handleRemoverProduto = (id) => {
        if (!setCarrinho) return;
        setCarrinho(prev => prev.filter(item => item.id !== id));
    };
    // --- FIM (Req 2) ---


    const finalizarCompra = async () => {
        if (!userData) {
            setError('Usuário não autenticado.');
            return;
        }
        if (carrinho.length === 0) {
            setError('Carrinho vazio.');
            return;
        }

        if (!validateForm()) {
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
                endereco_entrega: retiradaNaLoja ? null : {
                    ...endereco,
                    cep: endereco.cep.replace(/\D/g, '')
                },
                retirada_na_loja: retiradaNaLoja,
                itens: carrinho.map(item => ({
                    tipo: 'produto',
                    id_item: item.id,
                    nome: item.nome,
                    quantidade: item.quantidade || 1,
                    preco_unitario: item.preco_venda || 0
                }))
            };

            const response = await axios.post('/checkout', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(`Compra realizada com sucesso! ID: ${response.data.id_venda}, Total: R$ ${response.data.total?.toFixed(2) || '0.00'}`);

            if (setCarrinho) {
                setCarrinho([]);
            }

        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.response?.data?.mensagem || 'Erro ao finalizar a compra.';

            // --- INÍCIO: Lógica do Toast (Req 1) ---
            // Tenta extrair a mensagem de estoque
            const stockErrorMatch = errorMsg.match(/Estoque insuficiente para '(.*)'. Pedido: .*, Disponível: (.*)/);

            if (stockErrorMatch) {
                const productName = stockErrorMatch[1];
                const availableStock = stockErrorMatch[2];
                // Mostra o erro formatado no toast
                showToast(`Estoque insuficiente de '${productName}'. Disponível: ${availableStock}`);
            } else {
                // Mostra outros erros (ex: validação) no 'error' normal
                setError(errorMsg);
            }
            // --- FIM (Req 1) ---

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
        alignItems: 'center',
        padding: '0.75rem 0.5rem',
        borderBottom: '1px solid #ddd'
    };

    // --- NOVO: Estilos para controles de quantidade (Req 2) ---
    const quantityControlStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
    };

    const quantityButtonStyle = {
        background: '#f0f0f0',
        border: '1px solid #ddd',
        borderRadius: '50%',
        width: '28px',
        height: '28px',
        cursor: 'pointer',
        fontSize: '1.2rem',
        lineHeight: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };
    // --- FIM (Req 2) ---

    const inputStyle = {
        width: '100%',
        padding: '0.5rem',
        marginBottom: '1rem',
        borderRadius: '4px',
        border: '1px solid #ccc'
    };

    const errorInputStyle = {
        ...inputStyle,
        border: '1px solid red',
        backgroundColor: '#fff7f7'
    };

    const errorTextStyle = {
        color: 'red',
        fontSize: '0.8rem',
        marginTop: '-0.75rem',
        marginBottom: '1rem'
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
            {/* --- INÍCIO: Toast JSX (Req 1) --- */}
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 1050,
                    padding: '1rem 1.5rem',
                    backgroundColor: '#dc3545', // Vermelho para erro
                    color: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: '1rem',
                    fontWeight: '500',
                    animation: 'fadeInOut 4s forwards'
                }}>
                    {toast.message}
                </div>
            )}
            {/* CSS para animação do toast */}
            <style>
                {`@keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(-20px); }
                    10% { opacity: 1; transform: translateY(0); }
                    90% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-20px); }
                }`}
            </style>
            {/* --- FIM (Req 1) --- */}

            <h1>Checkout</h1>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
            {validationError && !retiradaNaLoja && <div style={{ color: 'red', marginBottom: '1rem' }}>{validationError}</div>}

            {success && <div style={{ color: 'green', marginBottom: '1rem' }}>{success}</div>}

            <h2>Produtos no Carrinho</h2>
            {carrinho.length === 0 ? (
                <p>Seu carrinho está vazio.</p>
            ) : (
                carrinho.map(item => (
                    // --- INÍCIO: Lista de produtos atualizada (Req 2) ---
                    <div key={item.id} style={productStyle}>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 'bold' }}>{item.nome}</span>
                            <br/>
                            <span style={{ fontSize: '0.9rem', color: '#555' }}>
                                R$ {(item.preco_venda || 0).toFixed(2)} / un.
                            </span>
                        </div>
                        <div style={quantityControlStyle}>
                            <button style={quantityButtonStyle} onClick={() => handleAlterarQuantidade(item.id, -1)}>-</button>
                            <span style={{ padding: '0 0.75rem', fontSize: '1.1rem', minWidth: '30px', textAlign: 'center' }}>{item.quantidade}</span>
                            <button style={quantityButtonStyle} onClick={() => handleAlterarQuantidade(item.id, 1)}>+</button>
                        </div>
                        <div style={{ ...quantityControlStyle, marginLeft: '1rem' }}>
                            <span style={{ fontWeight: 'bold', minWidth: '70px', textAlign: 'right' }}>
                                R$ {(item.preco_venda * item.quantidade).toFixed(2)}
                            </span>
                            <button
                                style={{...quantityButtonStyle, backgroundColor: '#f8d7da', color: '#dc3545', marginLeft: '1rem', border: '1px solid #f5c6cb'}}
                                onClick={() => handleRemoverProduto(item.id)}
                                title="Remover item"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                    // --- FIM (Req 2) ---
                ))
            )}


            {!retiradaNaLoja && (
                <>
                    <h2>Endereço de Entrega</h2>
                    <input
                        style={formErrors.rua ? errorInputStyle : inputStyle}
                        type="text"
                        name="rua"
                        placeholder="Rua"
                        value={endereco.rua}
                        onChange={handleInputChange}
                    />
                    {formErrors.rua && <div style={errorTextStyle}>{formErrors.rua}</div>}

                    <input
                        style={formErrors.numero ? errorInputStyle : inputStyle}
                        type="text"
                        inputMode="numeric"
                        name="numero"
                        placeholder="Número"
                        value={endereco.numero}
                        onChange={handleInputChange}
                        onKeyDown={handleNumberKeyDown}
                    />
                    {formErrors.numero && <div style={errorTextStyle}>{formErrors.numero}</div>}

                    <input
                        style={formErrors.bairro ? errorInputStyle : inputStyle}
                        type="text"
                        name="bairro"
                        placeholder="Bairro"
                        value={endereco.bairro}
                        onChange={handleInputChange}
                    />
                    {formErrors.bairro && <div style={errorTextStyle}>{formErrors.bairro}</div>}

                    <input
                        style={formErrors.cidade ? errorInputStyle : inputStyle}
                        type="text"
                        name="cidade"
                        placeholder="Cidade"
                        value={endereco.cidade}
                        onChange={handleInputChange}
                    />
                    {formErrors.cidade && <div style={errorTextStyle}>{formErrors.cidade}</div>}

                    <input
                        style={formErrors.estado ? errorInputStyle : inputStyle}
                        type="text"
                        name="estado"
                        placeholder="Estado"
                        value={endereco.estado}
                        onChange={handleInputChange}
                    />
                    {formErrors.estado && <div style={errorTextStyle}>{formErrors.estado}</div>}

                    <input
                        style={formErrors.cep ? errorInputStyle : inputStyle}
                        type="text"
                        inputMode="numeric"
                        name="cep"
                        placeholder="CEP (00000-000)"
                        value={endereco.cep}
                        onChange={handleInputChange}
                        onKeyDown={handleNumberKeyDown}
                        maxLength="9"
                    />
                    {formErrors.cep && <div style={errorTextStyle}>{formErrors.cep}</div>}
                </>
            )}

            <div style={{ marginBottom: '1rem' }}>
                <label>
                    <input
                        type="checkbox"
                        checked={retiradaNaLoja}
                        onChange={() => {
                            setRetiradaNaLoja(!retiradaNaLoja);
                            setFormErrors({});
                        }}
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
                <button
                    style={btnFinalizar}
                    onClick={finalizarCompra}
                    disabled={loading || (Object.values(formErrors).some(msg => msg !== null) && !retiradaNaLoja)}
                >
                    {loading ? 'Processando...' : 'Finalizar Compra'}
                </button>
                <button style={btnVoltar} onClick={onBack}>Voltar</button>
            </div>
        </div>
    );
}

export default Checkout;