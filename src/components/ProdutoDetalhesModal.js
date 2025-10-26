import React from 'react';
import './ProdutoDetalhesModal.css';

function ProdutoDetalhesModal({ produto, onClose, imagemPadrao, onAdicionarAoCarrinho }) {
    if (!produto) return null;

    const obterIconeAnimal = (animalAlvo) => {
        if (!animalAlvo || animalAlvo === 'Todos') return '🐾 Todos os animais';
        if (animalAlvo === 'Cães') return '🐕 Cães';
        if (animalAlvo === 'Gatos') return '🐈 Gatos';
        return '🐾 Todos os animais';
    };

    const handleAdicionarAoCarrinho = () => {
        if (produto.estoque <= 0) return;
        onAdicionarAoCarrinho(produto);
        onClose();
    };

    return (
        <div className="modal-backdrop-produto" onClick={onClose}>
            <div className="modal-content-produto" onClick={e => e.stopPropagation()}>
                <button className="close-button-produto" onClick={onClose}>&times;</button>

                <div className="modal-produto-layout">
                    <div className="modal-produto-imagem">
                        <img
                            src={produto.url_imagem || imagemPadrao}
                            alt={produto.nome}
                            onError={(e) => { e.target.src = imagemPadrao; }}
                        />
                    </div>

                    <div className="modal-produto-info">
                        <div className="modal-produto-categoria">
                            {obterIconeAnimal(produto.animais_alvo)}
                        </div>

                        <h2 className="modal-produto-nome">{produto.nome}</h2>

                        {produto.marca && (
                            <p className="modal-produto-marca">Marca: {produto.marca}</p>
                        )}

                        <div className="modal-produto-preco-container">
                            <span className="modal-produto-preco">
                                R$ {produto.preco_venda.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="modal-produto-estoque-badge">
                                {produto.estoque > 0 ? `${produto.estoque} em estoque` : 'Indisponível'}
                            </span>
                        </div>

                        {produto.descricao && (
                            <div className="modal-produto-descricao">
                                <h3>Descrição</h3>
                                <p>{produto.descricao}</p>
                            </div>
                        )}

                        {produto.estoque <= 0 && (
                            <div className="modal-produto-aviso">
                                ⚠️ Produto temporariamente indisponível
                            </div>
                        )}

                        <button
                            className="botao-adicionar-carrinho"
                            onClick={handleAdicionarAoCarrinho}
                            disabled={produto.estoque <= 0}
                        >
                            🛒 Adicionar ao Carrinho
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProdutoDetalhesModal;
