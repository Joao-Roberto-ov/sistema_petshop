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

// --- (Req 2) Modal Agendamento (MANTIDO IGUAL) ---
const ModalAgendamentoVenda = ({ isOpen, onClose, onConfirm, servico, clienteId }) => {
    const [pets, setPets] = useState([]);
    const [petId, setPetId] = useState("");
    const [data, setData] = useState("");
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && clienteId) {
            setError(""); setPetId(""); setData(""); setSelectedSlot(""); setAvailableSlots([]);
            const fetchPetsCliente = async () => {
                try {
                    const res = await axios.get(`/pets/cliente/${clienteId}`);
                    setPets(Array.isArray(res.data) ? res.data : []);
                } catch (err) {
                    console.error("Erro ao buscar pets:", err);
                    if (err.response?.status !== 404) setError("Erro ao buscar pets.");
                }
            };
            fetchPetsCliente();
        }
    }, [isOpen, clienteId]);

    useEffect(() => {
        if (!data || !servico?.id) { setAvailableSlots([]); return; }
        const fetchSlots = async () => {
            setLoadingSlots(true); setError("");
            try {
                const response = await axios.get('/agendamentos/disponibilidade', {
                    params: { servico_id: servico.id, data_consulta: data }
                });
                setAvailableSlots(response.data.horarios || []);
            } catch (err) {
                if (err.response?.status === 400) setError("O Petshop não funciona nesta data.");
                else setError("Erro ao carregar horários.");
                setAvailableSlots([]);
            } finally { setLoadingSlots(false); }
        };
        fetchSlots();
    }, [data, servico]);

    const handleConfirm = () => {
        if (!petId || !data || !selectedSlot) { setError("Preencha todos os campos."); return; }
        let slotObj;
        try { slotObj = JSON.parse(selectedSlot); } catch (e) { return; }
        onConfirm({ pet_id: parseInt(petId), data_hora: slotObj.inicio, observacoes: "Agendado via Venda Balcão" });
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
                </div>
                <div className="form-group-venda">
                    <label>Data:</label>
                    <input type="date" value={data} min={new Date().toISOString().split('T')[0]}
                        onChange={e => { setData(e.target.value); setSelectedSlot(""); }} />
                </div>
                <div className="form-group-venda">
                    <label>Horário:</label>
                    {loadingSlots ? <p>Buscando...</p> : (
                        <select value={selectedSlot} onChange={e => setSelectedSlot(e.target.value)} disabled={!data || !availableSlots.length}>
                            <option value="">{availableSlots.length === 0 && data ? "Indisponível" : "-- Selecione --"}</option>
                            {availableSlots.map((slot, i) => (
                                <option key={i} value={JSON.stringify(slot)}>{formatTime(slot.inicio)} - {formatTime(slot.fim)}</option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="modal-buttons-venda">
                    <button className="btn-cancelar-venda" onClick={onClose}>Cancelar</button>
                    <button className="btn-confirmar-venda" onClick={handleConfirm} disabled={!selectedSlot || !petId}>Confirmar</button>
                </div>
            </div>
        </div>
    );
};

// --- (NOVO) Modal de Sucesso / Recibo ---
const ModalReciboVenda = ({ isOpen, vendaId, onNovaVenda }) => {
    if (!isOpen) return null;

const handleVisualizarPDF = () => {
    const backendBaseURL = 'http://localhost:8000/api'; 
    
    const url = `${backendBaseURL}/vendas/${vendaId}/recibo`; 
    
    window.open(url, '_blank');
};

    const handleEnviarEmail = () => {
        // AC1: Placeholder para envio de e-mail
        alert(`Solicitação enviada! O recibo da venda #${vendaId} será enviado para o e-mail do cliente.`);
        // Ex: axios.post(`/vendas/${vendaId}/enviar-recibo`);
    };

    return (
        <div className="modal-overlay-venda">
            <div className="modal-container-venda" style={{ textAlign: 'center', maxWidth: '400px' }}>
                <div style={{ color: '#28a745', marginBottom: '15px' }}>
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h3 style={{marginBottom: '10px'}}>Venda #{vendaId} Realizada!</h3>
                <p style={{color: '#666', marginBottom: '25px'}}>O que deseja fazer agora?</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button className="btn-confirmar-venda" onClick={handleVisualizarPDF} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem' }}>
                        <span>📄</span> Visualizar / Imprimir Recibo
                    </button>

                    <button className="btn-cancelar-venda" onClick={handleEnviarEmail} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', background: 'white', border: '1px solid #ccc' }}>
                        <span>✉️</span> Enviar por E-mail
                    </button>
                </div>

                <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                    <button onClick={onNovaVenda} style={{ background: 'transparent', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}>
                        Fechar e iniciar nova venda
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
function RegistrarVenda({ onBack }) {
    const [clientes, setClientes] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [buscaCliente, setBuscaCliente] = useState("");
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [itens, setItens] = useState([]);
    const [formaPagamento, setFormaPagamento] = useState("Dinheiro");

    // Modais e UI
    const [modalAgendamentoOpen, setModalAgendamentoOpen] = useState(false);
    const [servicoPendente, setServicoPendente] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    
    // Novo Estado para Recibo
    const [vendaConcluidaId, setVendaConcluidaId] = useState(null);

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
            let lista = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setClientes(lista);
        } catch (error) { console.error(error); setClientes([]); }
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
            setServicoPendente(item);
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
            const qtd = jaExiste ? jaExiste.quantidade : 0;
            if (qtd + 1 > item.estoque) {
                showToast(`Estoque insuficiente para "${item.nome}".`, 'error');
                return;
            }
            if (jaExiste) {
                setItens(itens.map(i => i.id_item === item.id && i.tipo === 'produto' ? { ...i, quantidade: i.quantidade + 1 } : i));
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

    // --- LÓGICA DE REGISTRO DA VENDA ATUALIZADA ---
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
            const res = await axios.post("/vendas/", venda);
            
            // CORREÇÃO AQUI: Prioriza 'id_venda' (retorno do backend) ou 'id'
            const idVenda = res.data.venda?.id_venda || res.data.id || res.data.venda_id; 

            if (idVenda) {
                setVendaConcluidaId(idVenda); // Abre o Modal de Recibo
                showToast("Venda registrada com sucesso!", 'success');
            } else {
                // Mensagem de fallback atualizada caso o ID não venha em nenhum formato
                showToast("Venda salva, mas ID não encontrado no formato esperado.", 'warning');
                handleNovaVenda();
            }

        } catch (error) {
            console.error("Erro venda:", error);
            showToast("Erro: " + (error.response?.data?.detail || error.message), 'error');
        }
    };

    // --- RESETAR TELA PARA NOVA VENDA ---
    const handleNovaVenda = () => {
        setVendaConcluidaId(null);
        setItens([]);
        setClienteSelecionado(null);
        setBuscaCliente("");
        setFormaPagamento("Dinheiro");
        buscarProdutos(); // Atualiza estoque na visualização
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
                    color: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '1rem'
                }}>
                    {toast.message}
                </div>
            )}

            {/* Modal de Agendamento */}
            <ModalAgendamentoVenda
                isOpen={modalAgendamentoOpen}
                onClose={() => setModalAgendamentoOpen(false)}
                onConfirm={confirmarAgendamentoServico}
                servico={servicoPendente}
                clienteId={clienteSelecionado?.id}
            />

            {/* (NOVO) Modal de Recibo - Aparece após concluir a venda */}
            <ModalReciboVenda 
                isOpen={!!vendaConcluidaId}
                vendaId={vendaConcluidaId}
                onNovaVenda={handleNovaVenda}
            />

            <div style={styles.painelEsquerdo}>
                <h2 style={styles.title}>Registrar Venda (Balcão)</h2>
                
                {/* Busca Cliente */}
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Buscar Cliente (Opcional para produtos)</label>
                <input type="text" placeholder="Digite o nome..." style={styles.inputBusca}
                    value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} />

                <div style={styles.listaClientes}>
                    {clientes.length === 0 && <div style={{ padding: '10px', color: '#888' }}>Carregando...</div>}
                    {clientes.filter(c => c.nome?.toLowerCase().includes(buscaCliente.toLowerCase())).map(c => (
                        <div key={c.id} style={{ ...styles.clienteItem, backgroundColor: clienteSelecionado?.id === c.id ? "#d0f0d0" : "transparent" }}
                            onClick={() => setClienteSelecionado(c)}>
                            {c.nome} <span style={{ fontSize: '0.8em', color: '#666' }}>({c.email})</span>
                        </div>
                    ))}
                </div>

                {/* Serviços */}
                <h3 style={{ marginTop: '20px', color: '#444' }}>Serviços (Requer Cliente)</h3>
                <div style={styles.horizontalScroll}>
                    {servicos.map((s) => (
                        <div key={s.id} style={styles.cardItem}>
                            <strong>{s.nome}</strong>
                            <p style={{ color: '#2196F3', fontWeight: 'bold' }}>R$ {s.preco}</p>
                            <button style={styles.buttonAdd} onClick={() => iniciarAdicaoItem("servico", s)}>Agendar</button>
                        </div>
                    ))}
                </div>

                {/* Produtos */}
                <h3 style={{ color: '#444' }}>Produtos</h3>
                <div style={styles.horizontalScroll}>
                    {produtos.map((p) => (
                        <div key={p.id} style={styles.cardItem}>
                            <strong>{p.nome}</strong>
                            <p style={{ color: '#4CAF50', fontWeight: 'bold' }}>R$ {p.preco_venda}</p>
                            <p style={{ fontSize: '0.8em', color: p.estoque <= 0 ? 'red' : 'gray' }}>Estoque: {p.estoque}</p>
                            <button style={{ ...styles.buttonAdd, ...(p.estoque <= 0 ? styles.buttonAddDisabled : {}) }}
                                onClick={() => iniciarAdicaoItem("produto", p)} disabled={p.estoque <= 0}>Adicionar</button>
                        </div>
                    ))}
                </div>
            </div>

            <div style={styles.painelDireito}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={styles.title}>
                        Cliente: <span style={{ color: clienteSelecionado ? '#2E7D32' : '#F57C00' }}>
                            {clienteSelecionado?.nome || "Não Selecionado"}
                        </span>
                    </h3>

                    <div style={styles.listaCarrinho}>
                        {itens.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>Carrinho vazio.</p>}
                        {itens.map((i, index) => (
                            <div key={index} style={styles.itemCarrinho}>
                                <div>
                                    <span style={{ fontWeight: 'bold', display: 'block' }}>{i.nome}</span>
                                    <span style={{ fontSize: '0.9em', color: '#666' }}>{i.quantidade}x R$ {Number(i.preco_unitario).toFixed(2)}</span>
                                    {i.info_agendamento && <span style={{ fontSize: '0.8em', color: '#2196F3', display: 'block' }}>📅 {new Date(i.info_agendamento.data_hora).toLocaleDateString()}</span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontWeight: 'bold' }}>R$ {(i.quantidade * i.preco_unitario).toFixed(2)}</span>
                                    <button style={styles.btnRemover} onClick={() => removerItem(index)}>X</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={styles.total}>Total: R$ {total.toFixed(2)}</div>

                    <label style={{ fontWeight: 'bold' }}>Pagamento:</label>
                    <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} style={styles.select}>
                        <option>Dinheiro</option>
                        <option>Cartão de crédito</option>
                        <option>Cartão de débito</option>
                        <option>Pix</option>
                    </select>
                </div>

                <div>
                    <button style={styles.buttonAction} onClick={registrarVenda}>Finalizar Venda</button>
                    <button style={{ ...styles.buttonAction, backgroundColor: "#777" }} onClick={onBack}>Voltar</button>
                </div>
            </div>
        </div>
    );
}

export default RegistrarVenda;