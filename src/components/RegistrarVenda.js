import React, { useEffect, useState } from "react";
import axios from "axios";

function RegistrarVenda({ onBack }) {
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [itens, setItens] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [statusPagamento, setStatusPagamento] = useState("pendente");

  useEffect(() => {
    buscarClientes();
    buscarProdutos();
    buscarServicos();
  }, []);

  const buscarClientes = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/users");
      setClientes(res.data);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  const buscarProdutos = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/produtos/listar");
      setProdutos(res.data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const buscarServicos = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/servicos");
      setServicos(res.data);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
    }
  };

  const adicionarItem = (tipo, item) => {
    const jaExiste = itens.find(
      (i) => i.id_item === item.id && i.tipo === tipo
    );
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
          preco_unitario: item.preco || 0,
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
      alert("Selecione um cliente!");
      return;
    }

    const venda = {
      cliente_id: clienteSelecionado.id,
      forma_pagamento: formaPagamento,
      status_pagamento: statusPagamento,
      itens,
    };

    try {
      await axios.post("http://localhost:8000/api/funcionario/registrar-venda", venda, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      alert("Venda registrada com sucesso!");
      setItens([]);
      setClienteSelecionado(null);
    } catch (error) {
      console.error("Erro ao registrar venda:", error);
      alert("Erro ao registrar venda");
    }
  };

  // ==================== ESTILOS ====================
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
    buttonAdd: {
      backgroundColor: "#4CAF50",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "5px 10px",
      cursor: "pointer",
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

  // ==================== JSX ====================
  return (
    <div style={styles.container}>
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
              <p>R$ {p.preco}</p>
              <button
                style={styles.buttonAdd}
                onClick={() => adicionarItem("produto", p)}
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
