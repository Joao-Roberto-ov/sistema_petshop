import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RegistrarVenda({ onBack }) {
  const [clientes, setClientes] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);

  const [formaPagamento, setFormaPagamento] = useState('');
  const [statusPagamento, setStatusPagamento] = useState('pendente');

  // Busca inicial de produtos e serviços
  useEffect(() => {
    axios.get('/api/produtos')
      .then(res => setProdutos(res.data))
      .catch(err => console.error('Erro ao buscar produtos:', err));

    axios.get('/api/servicos')
      .then(res => setServicos(res.data))
      .catch(err => console.error('Erro ao buscar serviços:', err));

    axios.get('/api/cliente/getAll')
      .then(res => setClientes(res.data))
      .catch(err => console.error('Erro ao buscar clientes:', err));
  }, []);

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(buscaCliente.toLowerCase())
  );

  // Adicionar item ao carrinho
  const adicionarAoCarrinho = (tipo, item) => {
    const existente = carrinho.find(i => i.tipo === tipo && i.id_item === item.id);
    if (existente) {
      setCarrinho(carrinho.map(i =>
        i === existente ? { ...i, quantidade: i.quantidade + 1 } : i
      ));
    } else {
      setCarrinho([...carrinho, {
        tipo,
        id_item: item.id,
        nome: item.nome,
        quantidade: 1,
        preco_unitario: item.preco
      }]);
    }
  };

  // Remover item do carrinho
  const removerDoCarrinho = (index) => {
    const novo = [...carrinho];
    novo.splice(index, 1);
    setCarrinho(novo);
  };

  // Enviar venda
  const registrarVenda = async () => {
    if (!clienteSelecionado) {
      alert('Selecione um cliente antes de registrar a venda.');
      return;
    }

    if (!formaPagamento) {
      alert('Escolha uma forma de pagamento.');
      return;
    }

    if (carrinho.length === 0) {
      alert('Adicione pelo menos um item ao carrinho.');
      return;
    }

    const venda = {
      cliente_id: clienteSelecionado.id,
      forma_pagamento: formaPagamento,
      status_pagamento: statusPagamento,
      itens: carrinho
    };

    try {
      await axios.post('/api/funcionario/registrar-venda', venda);
      alert('Venda registrada com sucesso!');
      setCarrinho([]);
      setClienteSelecionado(null);
      setFormaPagamento('');
      setStatusPagamento('pendente');
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar venda.');
    }
  };

  return (
    <div className="container mt-4">
      <h2>Registrar Venda</h2>
      <button className="btn btn-secondary mb-3" onClick={onBack}>Voltar</button>

      {/* Seleção de Cliente */}
      <div className="card p-3 mb-4">
        <h5>Selecionar Cliente</h5>
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Buscar cliente..."
          value={buscaCliente}
          onChange={e => setBuscaCliente(e.target.value)}
        />
        <ul className="list-group">
          {clientesFiltrados.map(cliente => (
            <li
              key={cliente.id}
              className={`list-group-item ${clienteSelecionado?.id === cliente.id ? 'active' : ''}`}
              onClick={() => setClienteSelecionado(cliente)}
              style={{ cursor: 'pointer' }}
            >
              {cliente.nome}
            </li>
          ))}
        </ul>
        {clienteSelecionado && (
          <div className="mt-2 alert alert-info">
            Cliente selecionado: <strong>{clienteSelecionado.nome}</strong>
          </div>
        )}
      </div>

      {/* Tabelas de Produtos e Serviços */}
      <div className="row">
        <div className="col-md-6">
          <h5>Produtos</h5>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Preço (R$)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(prod => (
                <tr key={prod.id}>
                  <td>{prod.nome}</td>
                  <td>{prod.preco}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => adicionarAoCarrinho('produto', prod)}
                    >
                      Adicionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-md-6">
          <h5>Serviços</h5>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Preço (R$)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {servicos.map(serv => (
                <tr key={serv.id}>
                  <td>{serv.nome}</td>
                  <td>{serv.preco}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => adicionarAoCarrinho('servico', serv)}
                    >
                      Adicionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Carrinho */}
      <div className="card p-3 mt-4">
        <h5>Carrinho</h5>
        {carrinho.length === 0 ? (
          <p>Nenhum item adicionado.</p>
        ) : (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nome</th>
                <th>Qtd</th>
                <th>Preço Unit.</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {carrinho.map((item, index) => (
                <tr key={index}>
                  <td>{item.tipo}</td>
                  <td>{item.nome}</td>
                  <td>{item.quantidade}</td>
                  <td>R$ {item.preco_unitario}</td>
                  <td>R$ {(item.quantidade * item.preco_unitario).toFixed(2)}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => removerDoCarrinho(index)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagamento */}
      <div className="card p-3 mt-4">
        <h5>Pagamento</h5>
        <div className="mb-2">
          <label>Forma de Pagamento:</label>
          <select
            className="form-select"
            value={formaPagamento}
            onChange={e => setFormaPagamento(e.target.value)}
          >
            <option value="">Selecione...</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="cartao_credito">Cartão de Crédito</option>
            <option value="cartao_debito">Cartão de Débito</option>
            <option value="pix">PIX</option>
          </select>
        </div>

        <div className="mb-2">
          <label>Status do Pagamento:</label>
          <select
            className="form-select"
            value={statusPagamento}
            onChange={e => setStatusPagamento(e.target.value)}
          >
            <option value="pendente">Pendente</option>
            <option value="concluido">Concluído</option>
          </select>
        </div>
      </div>

      <button className="btn btn-primary mt-3" onClick={registrarVenda}>
        Registrar Venda
      </button>
    </div>
  );
}

export default RegistrarVenda;
