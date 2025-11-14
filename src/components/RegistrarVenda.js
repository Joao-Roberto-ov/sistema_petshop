import React, { useEffect, useState } from "react";
import axios from '../api/axios'; // Importa a instância local do axios
import './RegistrarVenda.css'; // Vamos adicionar estilos de modal

// (Req 2) Modal para capturar dados do agendamento
const ModalAgendamentoVenda = ({ isOpen, onClose, onConfirm, servicoNome, clienteId }) => {
    const [pets, setPets] = useState([]);
    const [petId, setPetId] = useState("");
    const [data, setData] = useState("");
    const [hora, setHora] = useState("");
    const [error, setError] = useState("");

    // Busca os pets do cliente selecionado
    useEffect(() => {
        if (isOpen && clienteId) {
            setError("");
            setPetId("");
            setData("");
            setHora("");

            const fetchPetsCliente = async () => {
                try {
                    // Usamos a rota pública de pets do cliente
                    const res = await axios.get(`/pets/cliente/${clienteId}`);
                    setPets(res.data || []);
                } catch (err) {
                    console.error("Erro ao buscar pets do cliente:", err);
                    setError("Erro ao buscar pets do cliente.");
                    setPets([]);
                }
            };
            fetchPetsCliente();
        }
    }, [isOpen, clienteId]);

    const handleConfirm = () => {
        if (!petId || !data || !hora) {
            setError("Preencha todos os campos do agendamento.");
            return;
        }

        // (Req 2) Formata a data e hora para o padrão ISO (UTC)
        const dataHoraISO = `${data}T${hora}:00.000Z`;

        onConfirm({
            pet_id: parseInt(petId),
            data_hora: dataHoraISO, // Envia como string ISO
            observacoes: "Agendado via Venda Balcão"
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay-venda">
            <div className="modal-container-venda">
                <h3>Agendar: {servicoNome}</h3>
                {error && <p className="error-text">{error}</p>}

                <div className="form-group-venda">
                    <label>Pet do Cliente:</label>
                    <select value={petId} onChange={e => setPetId(e.target.value)}>
                        <option value="">Selecione um Pet</option>
                        {pets.length > 0 ? (
                            pets.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.raca})</option>)
                        ) : (
                            <option disabled>Nenhum pet encontrado</option>
                        )}
                    </select>
                </div>
                <div className="form-group-venda">
                    <label>Data:</label>
                    <input type="date" value={data} onChange={e => setData(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-group-venda">
                    <label>Hora:</label>
                    <input type="time" value={hora} onChange={e => setHora(e.target.value)} />
                </div>
                <div className="modal-buttons-venda">
                    <button className="btn-cancelar-venda" onClick={onClose}>Cancelar</button>
                    <button className="btn-confirmar-venda" onClick={handleConfirm}>Confirmar Agendamento</button>
                </div>
            </div>
        </div>
    );
};


function RegistrarVenda({ onBack }) {
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [itens, setItens] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  // (Req 1) Status removido, será sempre pendente

  // (Req 2) Controle do Modal de Agendamento
  const [modalAgendamentoOpen, setModalAgendamentoOpen] = useState(false);
  const [servicoPendente, setServicoPendente] = useState(null); // Guarda o serviço clicado

  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 4000);
  };

  useEffect(() => {
    buscarClientes();
    buscarProdutos();
    buscarServicos();
  }, []);

  const buscarClientes = async () => {
    try {
      const res = await axios.get("/users");
      setClientes(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (error) {
      console.error("Erro clientes:", error);
      setClientes([]);
    }
  };

  const buscarProdutos = async () => {
    try {
      const res = await axios.get("/produtos/listar");
      setProdutos(res.data || []);
    } catch (error) { console.error(error); }
  };

  const buscarServicos = async () => {
    try {
      const res = await axios.get("/servicos");
      setServicos(res.data || []);
    } catch (error) { console.error(error); }
  };

  // (Req 2) Etapa 1: Iniciar adição de item
  const iniciarAdicaoItem = (tipo, item) => {
      if (tipo === 'servico') {
          // Se for serviço, abre o modal de agendamento
          if (!clienteSelecionado) {
              showToast("Selecione um cliente antes de adicionar serviços.", "error");
              return;
          }
          setServicoPendente(item);
          setModalAgendamentoOpen(true);
      } else {
          // Se for produto, adiciona direto
          adicionarItemCarrinho(tipo, item);
      }
  };

  // (Req 2) Etapa 2: Confirmação do modal
  const confirmarAgendamentoServico = (dadosAgendamento) => {
      // Adiciona o serviço ao carrinho JUNTO com os dados do agendamento
      adicionarItemCarrinho('servico', servicoPendente, dadosAgendamento);
      setServicoPendente(null);
  };

  // (Req 2) Etapa 3: Adicionar item ao carrinho (agora aceita infoAgendamento)
  const adicionarItemCarrinho = (tipo, item, infoAgendamento = null) => {
    const novoItem = {
        tipo,
        id_item: item.id,
        nome: item.nome,
        quantidade: 1,
        preco_unitario: item.preco_venda || item.preco || 0,
        estoque: item.estoque, // Apenas para referência visual
        info_agendamento: infoAgendamento // (Req 2) Guarda dados do agendamento
    };

    // Se for produto, verifica estoque localmente
    if (tipo === 'produto') {
        const jaExiste = itens.find(i => i.id_item === item.id && i.tipo === 'produto');
        const qtdNoCarrinho = jaExiste ? jaExiste.quantidade : 0;

        if (qtdNoCarrinho + 1 > item.estoque) {
            showToast(`Estoque insuficiente para "${item.nome}". Disponível: ${item.estoque}`, 'error');
            return;
        }

        if (jaExiste) {
            setItens(itens.map(i => i.id_item === item.id && i.tipo === 'produto' ? {...i, quantidade: i.quantidade + 1} : i));
        } else {
            setItens([...itens, novoItem]);
        }
    } else {
        // (Req 2) Sempre adiciona serviços como nova linha
        setItens([...itens, novoItem]);
    }
  };


  const removerItem = (index) => {
    const novos = [...itens];
    novos.splice(index, 1);
    setItens(novos);
  };

  const total = itens.reduce((acc, i) => acc + i.quantidade * i.preco_unitario, 0);

  const registrarVenda = async () => {
    if (!clienteSelecionado) {
      showToast("Selecione um cliente!", 'error');
      return;
    }
    if (itens.length === 0) {
      showToast("Adicione pelo menos um item à venda.", 'error');
      return;
    }

    const venda = {
      cliente_id: clienteSelecionado.id,
      forma_pagamento: formaPagamento,
      // (Req 1) Status removido, o backend define como 'Pendente'
      itens, // Itens agora contêm info_agendamento se for serviço
    };

    try {
      await axios.post("/vendas/", venda); // Rota base (POST)
      showToast("Venda registrada como PENDENTE! Aguardando pagamento.", 'success');
      setItens([]);
      setClienteSelecionado(null);
      setBuscaCliente("");
      // Atualiza lista de produtos para refletir estoque (embora só baixe no pagamento)
      buscarProdutos();
    } catch (error) {
      console.error("Erro ao registrar venda:", error);
      showToast("Erro: " + (error.response?.data?.detail || error.message), 'error');
    }
  };

  // Estilos inline simplificados
  const styles = {
    container: { display: "flex", flexDirection: "row", gap: "20px", padding: "20px", maxWidth: "1400px", margin: "0 auto" },
    painelEsquerdo: { flex: 2, backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
    painelDireito: { flex: 1, backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", height: 'fit-content', position: 'sticky', top: '20px' },
    title: { fontSize: "22px", fontWeight: "bold", marginBottom: "15px", textAlign: "center" },
    horizontalScroll: { display: "flex", overflowX: "auto", gap: "10px", padding: "10px 0", borderTop: '1px solid #eee', borderBottom: '1px solid #eee' },
    cardItem: { flex: "0 0 auto", border: "1px solid #ddd", borderRadius: "10px", padding: "10px", backgroundColor: "#fafafa", minWidth: "150px", textAlign: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
    buttonAdd: { backgroundColor: "#4CAF50", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", marginTop: "5px" },
    buttonAddDisabled: { backgroundColor: "#9e9e9e", cursor: "not-allowed" },
    listaCarrinho: { flex: 1, minHeight: '300px', overflowY: "auto", marginBottom: "15px", border: "1px solid #eee", borderRadius: "8px", padding: "10px" },
    itemCarrinho: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", padding: "8px", borderBottom: "1px solid #eee" },
    btnRemover: { backgroundColor: "#f44336", color: "#fff", border: "none", borderRadius: "5px", padding: "5px 8px", cursor: "pointer" },
    select: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "10px" },
    buttonAction: { width: "100%", padding: "12px", border: "none", borderRadius: "8px", backgroundColor: "#2196F3", color: "#fff", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
    inputBusca: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "10px" },
    listaClientes: { maxHeight: "150px", overflowY: "auto", border: "1px solid #eee", borderRadius: "8px", marginBottom: "20px", backgroundColor: "#fafafa" },
    clienteItem: { padding: "8px", cursor: "pointer" },
    total: { textAlign: "right", fontWeight: "bold", fontSize: "18px", marginTop: "10px" },
  };

  return (
    <div style={styles.container}>
      {toast.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1050,
          padding: '1rem 1.5rem', backgroundColor: toast.type === 'success' ? '#28a745' : '#dc3545',
          color: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '1rem', fontWeight: '500'
        }}>
          {toast.message}
        </div>
      )}

      {/* (Req 2) Modal de Agendamento */}
      <ModalAgendamentoVenda
        isOpen={modalAgendamentoOpen}
        onClose={() => setModalAgendamentoOpen(false)}
        onConfirm={confirmarAgendamentoServico}
        servicoNome={servicoPendente?.nome}
        clienteId={clienteSelecionado?.id}
      />

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
          {Array.isArray(clientes) && clientes
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
                onClick={() => iniciarAdicaoItem("servico", s)}
              >
                Agendar
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
              <p style={{color: p.estoque <= 0 ? 'red' : 'green'}}>
                Estoque: {p.estoque}
              </p>
              <button
                style={{...styles.buttonAdd, ...(p.estoque <= 0 ? styles.buttonAddDisabled : {})}}
                onClick={() => iniciarAdicaoItem("produto", p)}
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
          <h3 style={styles.title}>Cliente: {clienteSelecionado?.nome || "Nenhum"}</h3>
          <div style={styles.listaCarrinho}>
            {itens.length === 0 && <p>Nenhum item adicionado.</p>}
            {itens.map((i, index) => (
              <div key={index} style={styles.itemCarrinho}>
                <span>
                  {i.nome} ({i.quantidade}x)
                  {i.info_agendamento && <span style={{fontSize: '0.8em', color: 'blue', display: 'block'}}>📅 Agendado</span>}
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

          {/* (Req 1) Seletor de status removido */}

        </div>

        <div>
          <button style={styles.buttonAction} onClick={registrarVenda}>
            Registrar Venda (Pendente)
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