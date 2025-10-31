import React, { useEffect, useState } from "react";
import axios from '../api/axios'; // Importa a instância local do axios

function RegistrarVenda({ onBack }) {
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [itens, setItens] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [statusPagamento, setStatusPagamento] = useState("pendente");

  // --- INÍCIO DA MODIFICAÇÃO (Toast) ---
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  // Função para exibir o toast
  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'error' });
    }, 4000); // O toast desaparece após 4 segundos
  };
  // --- FIM DA MODIFICAÇÃO (Toast) ---

  useEffect(() => {
    buscarClientes();
    buscarProdutos();
    buscarServicos();
  }, []);

  const buscarClientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get("/users", {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      setClientes(res.data);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  const buscarProdutos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get("/produtos/listar", {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      setProdutos(res.data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const buscarServicos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get("/servicos", {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      setServicos(res.data);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
    }
  };

  // --- INÍCIO DA MODIFICAÇÃO (Função async + Fetch de Estoque) ---
  const adicionarItem = async (tipo, item) => {
    const jaExiste = itens.find(
      (i) => i.id_item === item.id && i.tipo === tipo
    );
    const quantidadeNoCarrinho = jaExiste ? jaExiste.quantidade : 0;

    if (tipo === 'produto') {
        let estoqueReal;
        try {
            // 1. Busca o estoque em tempo real
            const token = localStorage.getItem('token');
            const response = await axios.get(`/produtos/${item.id}/estoque`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            estoqueReal = response.data.estoque;

            // Atualiza o estoque na lista local 'produtos'
            setProdutos(prev => prev.map(p =>
                p.id === item.id ? { ...p, estoque: estoqueReal } : p
            ));

        } catch (err) {
            console.error("Erro ao buscar estoque:", err);
            showToast("Erro ao verificar estoque. Tente novamente.", 'error');
            return;
        }

        // 2. Valida usando o estoque real
        if (quantidadeNoCarrinho + 1 > estoqueReal) {
            showToast(`Estoque insuficiente para "${item.nome}". Disponível: ${estoqueReal}`, 'error');
            return;
        }
    }
    // --- FIM DA MODIFICAÇÃO ---

    if (jaExiste) {
      const atualizados = itens.map((i) =>
        i.id_item === item.id && i.tipo === tipo
          ? { ...i, quantidade: i.quantidade + 1 }
          : i
      );
      setItens(atualizados);
    } else {
      setItens([
        ...itens,
        {
          tipo,
          id_item: item.id,
          nome: item.nome,
          quantidade: 1,
          preco_unitario: item.preco_venda || item.preco || 0,
          estoque: item.estoque // Armazena o estoque (mesmo que stale, é usado na validação final)
        },
      ]);
    }
  };

  const removerItem = (index) => {
    const novos = [...itens];
    novos.splice(index, 1);
    setItens(novos);
  };

  const total = itens.reduce(
    (acc, i) => acc + i.quantidade * i.preco_unitario,
    0
  );

  const registrarVenda = async () => {
    if (!clienteSelecionado) {
      showToast("Selecione um cliente!", 'error');
      return;
    }
    if (itens.length === 0) {
      showToast("Adicione pelo menos um item à venda.", 'error');
      return;
    }

    // Validação de segurança final no frontend (o backend fará a validação principal)
    for (const item of itens) {
        if (item.tipo === 'produto') {
            const produtoDoEstoque = produtos.find(p => p.id === item.id_item);
            if (produtoDoEstoque && item.quantidade > produtoDoEstoque.estoque) {
                showToast(`Erro: Estoque de "${item.nome}" mudou. Disponível: ${produtoDoEstoque.estoque}, Pedido: ${item.quantidade}.`, 'error');
                buscarProdutos(); // Atualiza a lista
                return;
            }
        }
    }

    const venda = {
      cliente_id: clienteSelecionado.id,
      forma_pagamento: formaPagamento,
      status_pagamento: statusPagamento,
      itens,
    };

    try {
      await axios.post("/funcionario/registrar-venda", venda, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      // --- MODIFICAÇÃO (Usa Toast) ---
      showToast("Venda registrada com sucesso!", 'success');
      setItens([]);
      setClienteSelecionado(null);
      buscarProdutos();
    } catch (error) {
      console.error("Erro ao registrar venda:", error);
      // --- MODIFICAÇÃO (Usa Toast) ---
      showToast("Erro: " + (error.response?.data?.detail || error.message), 'error');
      if (error.response?.status === 400 || error.response?.status === 404) {
          buscarProdutos();
      }
    }
  };

  //estilos
  const styles = {
    container: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "flex-start",
      gap: "20px",
      backgroundColor: "#f3f3f3",
      padding: "40px",
      minHeight: "100vh",
      maxWidth: "1400px",
      margin: "0 auto",
      width: "100%",
    },
    painelEsquerdo: {
      flex: 2,
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    },
    painelDireito: {
      flex: 1,
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    title: {
      fontSize: "22px",
      fontWeight: "bold",
      marginBottom: "15px",
      textAlign: "center",
    },
    horizontalScroll: {
      display: "flex",
      overflowX: "auto",
      gap: "10px",
      padding: "10px 0",
    },
    cardItem: {
      flex: "0 0 auto",
      border: "1px solid #ddd",
      borderRadius: "10px",
      padding: "10px",
      backgroundColor: "#fafafa",
      minWidth: "150px",
      textAlign: "center",
      boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    },
    estoqueInfo: {
        fontSize: '0.85rem',
        color: '#666',
        margin: '5px 0 0 0',
        fontWeight: '500'
    },
    buttonAdd: {
      backgroundColor: "#4CAF50",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "5px 10px",
      cursor: "pointer",
      marginTop: "5px",
    },
    buttonAddDisabled: {
      backgroundColor: "#9e9e9e",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "5px 10px",
      cursor: "not-allowed",
      marginTop: "5px",
    },
    listaCarrinho: {
      flex: 1,
      overflowY: "auto",
      marginBottom: "15px",
      border: "1px solid #eee",
      borderRadius: "8px",
      padding: "10px",
    },
    itemCarrinho: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "10px",
      padding: "8px",
      borderBottom: "1px solid #eee",
    },
    btnRemover: {
      backgroundColor: "#f44336",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      padding: "5px 8px",
      cursor: "pointer",
    },
    select: {
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      marginBottom: "10px",
    },
    buttonAction: {
      width: "100%",
      padding: "12px",
      border: "none",
      borderRadius: "8px",
      backgroundColor: "#2196F3",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
      marginTop: "10px",
    },
    inputBusca: {
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      marginBottom: "10px",
    },
    listaClientes: {
      maxHeight: "150px",
      overflowY: "auto",
      border: "1px solid #eee",
      borderRadius: "8px",
      marginBottom: "20px",
      backgroundColor: "#fafafa",
    },
    clienteItem: {
      padding: "8px",
      cursor: "pointer",
    },
    total: {
      textAlign: "right",
      fontWeight: "bold",
      fontSize: "18px",
      marginTop: "10px",
    },
  };

  //jsx
  return (
    <div style={styles.container}>
      {/* --- INÍCIO DA MODIFICAÇÃO (JSX do Toast) --- */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1050,
          padding: '1rem 1.5rem',
          // Cor baseada no tipo (success ou error)
          backgroundColor: toast.type === 'success' ? '#28a745' : '#dc3545',
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
      {/* --- FIM DA MODIFICAÇÃO --- */}


      {/* Painel esquerdo */}
      <div style={styles.painelEsquerdo}>
        <h2 style={styles.title}>Registrar Venda</h2>

        <input
          type="text"
          placeholder="Buscar cliente..."
          style={styles.inputBusca}
          value={buscaCliente}
          onChange={(e) => setBuscaCliente(e.target.value)}
        />

        <div style={styles.listaClientes}>
          {clientes
            .filter((c) =>
              c.nome.toLowerCase().includes(buscaCliente.toLowerCase())
            )
            .map((c) => (
              <div
                key={c.id}
                style={{
                  ...styles.clienteItem,
                  backgroundColor:
                    clienteSelecionado?.id === c.id ? "#d0f0d0" : "transparent",
                }}
                onClick={() => setClienteSelecionado(c)}
              >
                {c.nome}
              </div>
            ))}
        </div>

        <h3>Serviços</h3>
        <div style={styles.horizontalScroll}>
          {servicos.map((s) => (
            <div key={s.id} style={styles.cardItem}>
              <strong>{s.nome}</strong>
              <p>R$ {s.preco}</p>
              <button
                style={styles.buttonAdd}
                onClick={() => adicionarItem("servico", s)}
              >
                Adicionar
              </button>
            </div>
          ))}
        </div>

        <h3>Produtos</h3>
        <div style={styles.horizontalScroll}>
          {produtos.map((p) => (
            <div key={p.id} style={styles.cardItem}>
              <strong>{p.nome}</strong>
              <p>R$ {p.preco_venda}</p>
              <p style={{
                  ...styles.estoqueInfo,
                  color: p.estoque <= 0 ? '#e74c3c' : '#666'
              }}>
                Estoque: {p.estoque}
              </p>
              <button
                style={p.estoque <= 0 ? styles.buttonAddDisabled : styles.buttonAdd}
                onClick={() => adicionarItem("produto", p)}
                disabled={p.estoque <= 0}
              >
                Adicionar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Painel direito */}
      <div style={styles.painelDireito}>
        <div>
          <h3 style={styles.title}>Carrinho</h3>
          <div style={styles.listaCarrinho}>
            {itens.length === 0 && <p>Nenhum item adicionado.</p>}
            {itens.map((i, index) => (
              <div key={index} style={styles.itemCarrinho}>
                <span>
                  {i.nome} ({i.quantidade}x)
                </span>
                <span>R$ {(i.quantidade * i.preco_unitario).toFixed(2)}</span>
                <button
                  style={styles.btnRemover}
                  onClick={() => removerItem(index)}
                >
                  X
                </button>
              </div>
            ))}
          </div>

          <div style={styles.total}>Total: R$ {total.toFixed(2)}</div>

          <select
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
            style={styles.select}
          >
            <option>Dinheiro</option>
            <option>Cartão de crédito</option>
            <option>Cartão de débito</option>
            <option>Pix</option>
          </select>

          <select
            value={statusPagamento}
            onChange={(e) => setStatusPagamento(e.target.value)}
            style={styles.select}
          >
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
          </select>
        </div>

        <div>
          <button style={styles.buttonAction} onClick={registrarVenda}>
            Registrar Venda
          </button>
          <button
            style={{ ...styles.buttonAction, backgroundColor: "#777" }}
            onClick={onBack}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegistrarVenda;