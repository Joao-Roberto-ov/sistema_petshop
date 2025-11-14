import React, { useEffect, useState } from "react";
import axios from '../api/axios';
import './RegistrarVenda.css';

// --- Helper para formatar hora ---
const formatTime = (dateTimeString) => {
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    } catch { return 'Inválido'; }
};

// (Req 2) Modal para capturar dados do agendamento com VALIDAÇÃO DE HORÁRIO
const ModalAgendamentoVenda = ({ isOpen, onClose, onConfirm, servico, clienteId }) => {
    const [pets, setPets] = useState([]);
    const [petId, setPetId] = useState("");
    const [data, setData] = useState("");

    // Novos estados para validação de horário
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(""); // Guarda o objeto do slot (inicio/fim)
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState("");

    // Busca os pets do cliente selecionado
    useEffect(() => {
        if (isOpen && clienteId) {
            setError("");
            setPetId("");
            setData("");
            setSelectedSlot("");
            setAvailableSlots([]);

            const fetchPetsCliente = async () => {
                try {
                    const res = await axios.get(`/pets/cliente/${clienteId}`);
                    // Validação de array
                    const listaPets = Array.isArray(res.data) ? res.data : [];
                    setPets(listaPets);
                } catch (err) {
                    console.error("Erro ao buscar pets:", err);
                    setPets([]);
                    if (err.response?.status !== 404) {
                        setError("Erro ao buscar pets do cliente.");
                    }
                }
            };
            fetchPetsCliente();
        }
    }, [isOpen, clienteId]);

    // (Novo) Busca horários disponíveis quando Data ou Serviço mudam
    useEffect(() => {
        if (!data || !servico?.id) {
            setAvailableSlots([]);
            return;
        }

        const fetchSlots = async () => {
            setLoadingSlots(true);
            setError("");
            try {
                const response = await axios.get('/agendamentos/disponibilidade', {
                    params: {
                        servico_id: servico.id,
                        data_consulta: data
                    }
                });
                setAvailableSlots(response.data.horarios || []);
            } catch (err) {
                console.error("Erro ao buscar horários:", err);
                // Se for erro 400 (dia fechado), mostramos mensagem amigável
                if (err.response?.status === 400) {
                    setError("O Petshop não funciona nesta data ou horário.");
                } else {
                    setError("Erro ao carregar horários disponíveis.");
                }
                setAvailableSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [data, servico]);

    const handleConfirm = () => {
        if (!petId || !data || !selectedSlot) {
            setError("Preencha todos os campos e selecione um horário válido.");
            return;
        }

        // Recupera o objeto do slot (que está como string JSON no value do select)
        let slotObj;
        try {
            slotObj = JSON.parse(selectedSlot);
        } catch (e) {
            setError("Horário inválido.");
            return;
        }

        // A dataHora já vem completa do backend (ISO com timezone UTC)
        // Ex: "2024-11-15T14:00:00+00:00"

        onConfirm({
            pet_id: parseInt(petId),
            data_hora: slotObj.inicio, // Envia a data/hora exata retornada pelo backend
            observacoes: "Agendado via Venda Balcão"
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay-venda">
            <div className="modal-container-venda">
                <h3>Agendar: {servico?.nome}</h3>
                {error && <p className="error-text">{error}</p>}

                <div className="form-group-venda">
                    <label>Pet do Cliente:</label>
                    <select value={petId} onChange={e => setPetId(e.target.value)}>
                        <option value="">Selecione um Pet</option>
                        {pets.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.raca})</option>)}
                    </select>
                    {pets.length === 0 && <small style={{color: '#666', display: 'block', marginTop: '5px'}}>Nenhum pet encontrado para este cliente.</small>}
                </div>

                <div className="form-group-venda">
                    <label>Data:</label>
                    <input
                        type="date"
                        value={data}
                        onChange={e => {
                            setData(e.target.value);
                            setSelectedSlot(""); // Limpa horário ao mudar data
                        }}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>

                <div className="form-group-venda">
                    <label>Horário Disponível:</label>
                    {loadingSlots ? (
                        <p style={{fontSize: '0.9rem', color: '#666'}}>Buscando horários...</p>
                    ) : (
                        <select
                            value={selectedSlot}
                            onChange={e => setSelectedSlot(e.target.value)}
                            disabled={!data || availableSlots.length === 0}
                        >
                            <option value="">
                                {availableSlots.length === 0 && data
                                    ? "Nenhum horário vago ou dia fechado"
                                    : "-- Selecione um horário --"}
                            </option>
                            {availableSlots.map((slot, index) => (
                                <option key={index} value={JSON.stringify(slot)}>
                                    {formatTime(slot.inicio)} - {formatTime(slot.fim)}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="modal-buttons-venda">
                    <button className="btn-cancelar-venda" onClick={onClose}>Cancelar</button>
                    <button
                        className="btn-confirmar-venda"
                        onClick={handleConfirm}
                        disabled={!selectedSlot || !petId}
                    >
                        Confirmar
                    </button>
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

  const [modalAgendamentoOpen, setModalAgendamentoOpen] = useState(false);
  const [servicoPendente, setServicoPendente] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  useEffect(() => {
    buscarClientes();
    buscarProdutos();
    buscarServicos();
  }, []);

  const buscarClientes = async () => {
    try {
      const res = await axios.get("/users/");
      let listaClientes = [];
      if (Array.isArray(res.data)) {
          listaClientes = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
          listaClientes = res.data.data;
      }
      setClientes(listaClientes);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      setClientes([]);
    }
  };

  const buscarProdutos = async () => {
    try {
      const res = await axios.get("/produtos/listar");
      setProdutos(Array.isArray(res.data) ? res.data : []);
    } catch (error) { console.error(error); }
  };

  const buscarServicos = async () => {
    try {
      const res = await axios.get("/servicos");
      setServicos(Array.isArray(res.data) ? res.data : []);
    } catch (error) { console.error(error); }
  };

  const iniciarAdicaoItem = (tipo, item) => {
      if (tipo === 'servico') {
          if (!clienteSelecionado) {
              showToast("Selecione um cliente antes de agendar serviços.", "error");
              return;
          }
          setServicoPendente(item); // Passa o objeto completo do serviço
          setModalAgendamentoOpen(true);
      } else {
          adicionarItemCarrinho(tipo, item);
      }
  };

  const confirmarAgendamentoServico = (dadosAgendamento) => {
      adicionarItemCarrinho('servico', servicoPendente, dadosAgendamento);
      setServicoPendente(null);
  };

  const adicionarItemCarrinho = (tipo, item, infoAgendamento = null) => {
    const novoItem = {
        tipo,
        id_item: item.id,
        nome: item.nome,
        quantidade: 1,
        preco_unitario: item.preco_venda || item.preco || 0,
        estoque: item.estoque,
        info_agendamento: infoAgendamento
    };

    if (tipo === 'produto') {
        const jaExiste = itens.find(i => i.id_item === item.id && i.tipo === 'produto');
        const qtdNoCarrinho = jaExiste ? jaExiste.quantidade : 0;

        if (qtdNoCarrinho + 1 > item.estoque) {
            showToast(`Estoque insuficiente para "${item.nome}".`, 'error');
            return;
        }

        if (jaExiste) {
            setItens(itens.map(i => i.id_item === item.id && i.tipo === 'produto' ? {...i, quantidade: i.quantidade + 1} : i));
        } else {
            setItens([...itens, novoItem]);
        }
    } else {
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
    const temServico = itens.some(i => i.tipo === 'servico');

    if (temServico && !clienteSelecionado) {
        showToast("Para agendar serviços, selecione um cliente.", 'error');
        return;
    }

    if (itens.length === 0) {
      showToast("Adicione itens à venda.", 'error');
      return;
    }

    const venda = {
      cliente_id: clienteSelecionado ? clienteSelecionado.id : null,
      forma_pagamento: formaPagamento,
      itens,
    };

    try {
      await axios.post("/vendas/", venda);
      showToast("Venda registrada com sucesso! Status: Pendente.", 'success');
      setItens([]);
      setClienteSelecionado(null);
      setBuscaCliente("");
      buscarProdutos();
    } catch (error) {
      console.error("Erro venda:", error);
      showToast("Erro: " + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const styles = {
    container: { display: "flex", flexDirection: "row", gap: "20px", padding: "20px", maxWidth: "1400px", margin: "0 auto", height: 'calc(100vh - 100px)' },
    painelEsquerdo: { flex: 2, backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", overflowY: 'auto' },
    painelDireito: { flex: 1, backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" },
    title: { fontSize: "22px", fontWeight: "bold", marginBottom: "15px", textAlign: "center", color: '#333' },
    horizontalScroll: { display: "flex", overflowX: "auto", gap: "10px", padding: "10px 0", borderTop: '1px solid #eee', borderBottom: '1px solid #eee', marginBottom: '20px' },
    cardItem: { flex: "0 0 auto", border: "1px solid #ddd", borderRadius: "10px", padding: "10px", backgroundColor: "#fafafa", minWidth: "160px", textAlign: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
    buttonAdd: { backgroundColor: "#4CAF50", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", marginTop: "8px", width: '100%' },
    buttonAddDisabled: { backgroundColor: "#9e9e9e", cursor: "not-allowed" },
    listaCarrinho: { flex: 1, overflowY: "auto", marginBottom: "15px", border: "1px solid #eee", borderRadius: "8px", padding: "10px" },
    itemCarrinho: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", padding: "8px", borderBottom: "1px solid #eee" },
    btnRemover: { backgroundColor: "#f44336", color: "#fff", border: "none", borderRadius: "5px", padding: "5px 8px", cursor: "pointer" },
    select: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "10px" },
    buttonAction: { width: "100%", padding: "12px", border: "none", borderRadius: "8px", backgroundColor: "#2196F3", color: "#fff", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
    inputBusca: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "10px" },
    listaClientes: { maxHeight: "200px", overflowY: "auto", border: "1px solid #eee", borderRadius: "8px", marginBottom: "20px", backgroundColor: "#fafafa" },
    clienteItem: { padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee" },
    total: { textAlign: "right", fontWeight: "bold", fontSize: "18px", marginTop: "10px", marginBottom: "10px" },
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

      {/* Passando a prop 'servico' corretamente (objeto completo, não só o nome) */}
      <ModalAgendamentoVenda
        isOpen={modalAgendamentoOpen}
        onClose={() => setModalAgendamentoOpen(false)}
        onConfirm={confirmarAgendamentoServico}
        servico={servicoPendente}
        clienteId={clienteSelecionado?.id}
      />

      <div style={styles.painelEsquerdo}>
        <h2 style={styles.title}>Registrar Venda (Balcão)</h2>

        <label style={{fontWeight:'bold', display:'block', marginBottom:'5px'}}>Buscar Cliente (Opcional para produtos)</label>
        <input
          type="text"
          placeholder="Digite o nome do cliente..."
          style={styles.inputBusca}
          value={buscaCliente}
          onChange={(e) => setBuscaCliente(e.target.value)}
        />

        <div style={styles.listaClientes}>
          {clientes.length === 0 && <div style={{padding:'10px', color:'#888'}}>Carregando ou nenhum cliente...</div>}

          {clientes
            .filter((c) => c.nome && c.nome.toLowerCase().includes(buscaCliente.toLowerCase()))
            .map((c) => (
              <div
                key={c.id}
                style={{
                  ...styles.clienteItem,
                  backgroundColor: clienteSelecionado?.id === c.id ? "#d0f0d0" : "transparent",
                  fontWeight: clienteSelecionado?.id === c.id ? "bold" : "normal"
                }}
                onClick={() => setClienteSelecionado(c)}
              >
                {c.nome} <span style={{fontSize:'0.8em', color:'#666'}}>({c.email})</span>
              </div>
            ))}
        </div>

        <h3 style={{marginTop: '20px', color: '#444'}}>Serviços (Requer Cliente)</h3>
        <div style={styles.horizontalScroll}>
          {servicos.map((s) => (
            <div key={s.id} style={styles.cardItem}>
              <strong>{s.nome}</strong>
              <p style={{color: '#2196F3', fontWeight: 'bold'}}>R$ {s.preco}</p>
              <button
                style={styles.buttonAdd}
                onClick={() => iniciarAdicaoItem("servico", s)}
              >
                Agendar
              </button>
            </div>
          ))}
        </div>

        <h3 style={{color: '#444'}}>Produtos</h3>
        <div style={styles.horizontalScroll}>
          {produtos.map((p) => (
            <div key={p.id} style={styles.cardItem}>
              <strong>{p.nome}</strong>
              <p style={{color: '#4CAF50', fontWeight: 'bold'}}>R$ {p.preco_venda}</p>
              <p style={{fontSize: '0.8em', color: p.estoque <= 0 ? 'red' : 'gray'}}>
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

      <div style={styles.painelDireito}>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
          <h3 style={styles.title}>
            Cliente: <span style={{color: clienteSelecionado ? '#2E7D32' : '#F57C00'}}>
                {clienteSelecionado?.nome || "Não Selecionado (Venda Avulsa)"}
            </span>
          </h3>

          <div style={styles.listaCarrinho}>
            {itens.length === 0 && <p style={{textAlign:'center', color:'#999', marginTop:'40px'}}>O carrinho está vazio.</p>}
            {itens.map((i, index) => (
              <div key={index} style={styles.itemCarrinho}>
                <div>
                  <span style={{fontWeight: 'bold', display: 'block'}}>{i.nome}</span>
                  <span style={{fontSize: '0.9em', color: '#666'}}>
                    {i.quantidade}x R$ {Number(i.preco_unitario).toFixed(2)}
                  </span>
                  {i.info_agendamento && <span style={{fontSize: '0.8em', color: '#2196F3', display: 'block'}}>📅 {new Date(i.info_agendamento.data_hora).toLocaleDateString()} {new Date(i.info_agendamento.data_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <span style={{fontWeight: 'bold'}}>R$ {(i.quantidade * i.preco_unitario).toFixed(2)}</span>
                    <button style={styles.btnRemover} onClick={() => removerItem(index)}>X</button>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.total}>Total: R$ {total.toFixed(2)}</div>

          <label style={{fontWeight:'bold', display:'block', marginBottom:'5px'}}>Forma de Pagamento:</label>
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
        </div>

        <div>
          <button style={styles.buttonAction} onClick={registrarVenda}>
            Finalizar Venda (Pendente)
          </button>
          <button style={{ ...styles.buttonAction, backgroundColor: "#777" }} onClick={onBack}>
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegistrarVenda;