import React, { useState } from "react";
import axios from "../../api/axios";
import * as XLSX from "xlsx";

const FluxoCaixaResumoMensal = ({ onBack }) => {
  const [mesInicio, setMesInicio] = useState("");
  const [mesFim, setMesFim] = useState("");
  const [resumoMensal, setResumoMensal] = useState([]);
  const [detalhesMes, setDetalhesMes] = useState({});
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Modal de detalhe de venda
  const [modalAberto, setModalAberto] = useState(false);
  const [vendaDetalhada, setVendaDetalhada] = useState(null);

  const buscarRelatorio = async () => {
    if (!mesInicio || !mesFim) {
      setErro("Selecione os meses de início e fim.");
      return;
    }
    setErro("");
    setLoading(true);

    try {
      const dataInicio = mesInicio + "-01";
      const dataFimParts = mesFim.split("-");
      const ultimoDia = new Date(dataFimParts[0], parseInt(dataFimParts[1]), 0).getDate();
      const dataFim = `${mesFim}-${ultimoDia}`;

      const [resVendas, resDespesas] = await Promise.all([
        axios.get("/vendas/", {
            params: { data_inicio: dataInicio, data_fim: dataFim }
        }),
        axios.get("/admin/despesas", {
            baseURL: '/',
            params: { data_inicio: dataInicio, data_fim: dataFim }
        }),
      ]);

      const vendas = resVendas.data || [];
      const despesas = resDespesas.data || [];

      const resumo = {};
      const formatMes = (data) => {
        const d = new Date(data);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      };

      vendas.forEach(v => {
        // --- CORREÇÃO 1: Filtrar apenas vendas PAGAS ---
        // Se o status não existir ou não for 'pago' (case insensitive), ignora.
        if (!v.status_pagamento || v.status_pagamento.toLowerCase() !== 'pago') {
            return;
        }

        const mes = formatMes(v.criado_em);
        if (!resumo[mes]) resumo[mes] = { vendas: 0, despesas: 0, detalhesVendas: [], detalhesDespesas: [] };
        resumo[mes].vendas += parseFloat(v.total || 0);
        resumo[mes].detalhesVendas.push(v);
      });

      despesas.forEach(d => {
        const mes = formatMes(d.data);
        if (!resumo[mes]) resumo[mes] = { vendas: 0, despesas: 0, detalhesVendas: [], detalhesDespesas: [] };
        resumo[mes].despesas += parseFloat(d.valor || 0);
        resumo[mes].detalhesDespesas.push(d);
      });

      const resumoArray = Object.entries(resumo)
        .map(([mes, valores]) => ({
          mes,
          totalVendas: valores.vendas,
          totalDespesas: valores.despesas,
          saldo: valores.vendas - valores.despesas,
          detalhesVendas: valores.detalhesVendas,
          detalhesDespesas: valores.detalhesDespesas
        }))
        .sort((a, b) => a.mes.localeCompare(b.mes));

      setResumoMensal(resumoArray);
    } catch (err) {
      console.error(err);
      setErro("Erro ao buscar dados do relatório.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDetalhes = (mes) => {
    setDetalhesMes((prev) => ({ ...prev, [mes]: !prev[mes] }));
  };

  const abrirModalVenda = async (id) => {
    try {
      const res = await axios.get(`/vendas/${id}`);
      setVendaDetalhada(res.data);
      setModalAberto(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar detalhes da venda.");
    }
  };

  // --- CORREÇÃO 2: Simplificar Exportação para Excel ---
  // Agora tratamos 'v.itens' como string, criando uma linha por venda.
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    resumoMensal.forEach((r) => {
      // Se não houver vendas, cria uma linha vazia indicando isso
      const vendasDetalhes = r.detalhesVendas.length > 0
        ? r.detalhesVendas.map((v) => ({
            "ID Venda": v.id,
            "Data": new Date(v.criado_em).toLocaleDateString("pt-BR"),
            "Cliente": v.cliente_nome || "Consumidor Final",
            "Funcionário": v.funcionario_nome || "N/A",
            "Forma Pagamento": v.forma_pagamento,
            "Status": v.status_pagamento, // Será sempre 'Pago' devido ao filtro
            "Itens Vendidos": v.itens,    // A string concatenada vinda do banco
            "Total da Venda": parseFloat(v.total || 0).toFixed(2),
          }))
        : [{ "ID Venda": "Nenhuma venda registrada neste mês" }];

      const sheetVendas = XLSX.utils.json_to_sheet(vendasDetalhes);
      XLSX.utils.book_append_sheet(wb, sheetVendas, `Vendas ${r.mes}`);

      // Despesas detalhadas
      const despesasDetalhes = r.detalhesDespesas.map((d) => ({
        "ID Despesa": d.id,
        "Descrição": d.descricao,
        "Valor": parseFloat(d.valor).toFixed(2),
        "Data": new Date(d.data).toLocaleDateString("pt-BR"),
      }));

      const sheetDespesas = XLSX.utils.json_to_sheet(despesasDetalhes);
      XLSX.utils.book_append_sheet(wb, sheetDespesas, `Despesas ${r.mes}`);
    });

    XLSX.writeFile(wb, `Fluxo_Caixa_${mesInicio}_a_${mesFim}.xlsx`);
  };

  const styles = {
    container: { maxWidth: "1000px", margin: "0 auto", padding: "2rem", fontFamily: "Inter, sans-serif", backgroundColor: "#f5f7fa", color: "#1f2937" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
    headerTitle: { fontSize: "2rem", fontWeight: 700 },
    headerButton: { backgroundColor: "#6b7280", color: "#fff", padding: "0.5rem 1rem", borderRadius: "0.375rem", cursor: "pointer", border: "none" },
    filtros: { display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem", alignItems: "flex-end" },
    filtroItem: { display: "flex", flexDirection: "column" },
    label: { fontWeight: 600, marginBottom: "0.25rem" },
    input: { padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" },
    button: { padding: "0.5rem 1rem", borderRadius: "0.375rem", cursor: "pointer", fontWeight: 600, border: "none" },
    erro: { color: "#dc2626", marginBottom: "1rem", fontWeight: 600 },

    resumoCard: {
      padding: "1.25rem 1.5rem",
      borderRadius: "0.75rem",
      marginBottom: "1rem",
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
      alignItems: "center",
      gap: "0.5rem",
      backgroundColor: "#fff",
      boxShadow: "0 6px 15px rgba(0,0,0,0.08)",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer"
    },
    resumoCardPositive: { borderLeft: "5px solid #16a34a" },
    resumoCardNegative: { borderLeft: "5px solid #dc2626" },
    resumoMes: { fontWeight: 700, fontSize: "1.125rem" },
    resumoValor: { fontWeight: 600 },
    detalhes: { backgroundColor: "#fefefe", padding: "1rem", borderRadius: "0.5rem", marginTop: "0.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
    table: { width: "100%", borderCollapse: "collapse", marginBottom: "1rem" },
    th: { padding: "0.5rem", borderBottom: "1px solid #e5e7eb", textAlign: "left", backgroundColor: "#f3f4f6", fontWeight: 600 },
    td: { padding: "0.5rem", borderBottom: "1px solid #e5e7eb" },

    // Modal
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: "#fff",
      padding: "2rem",
      borderRadius: "0.5rem",
      width: "600px",
      maxHeight: "80%",
      overflowY: "auto",
      position: "relative"
    },
    closeButton: {
      position: "absolute",
      top: "1rem",
      right: "1rem",
      cursor: "pointer",
      background: "none",
      border: "none",
      fontSize: "1.25rem"
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>Fluxo de Caixa Mensal</h2>
        <button style={styles.headerButton} onClick={onBack}>Voltar</button>
      </div>

      <div style={styles.filtros}>
        <div style={styles.filtroItem}>
          <label style={styles.label}>Mês Início</label>
          <input type="month" value={mesInicio} onChange={(e) => setMesInicio(e.target.value)} style={styles.input} />
        </div>
        <div style={styles.filtroItem}>
          <label style={styles.label}>Mês Fim</label>
          <input type="month" value={mesFim} onChange={(e) => setMesFim(e.target.value)} style={styles.input} />
        </div>
        <button style={{ ...styles.button, backgroundColor: "#2563eb", color: "#fff" }} onClick={buscarRelatorio} disabled={loading}>
          {loading ? "Carregando..." : "Buscar"}
        </button>
        {resumoMensal.length > 0 && (
          <button style={{ ...styles.button, backgroundColor: "#16a34a", color: "#fff" }} onClick={exportarExcel}>
            Baixar Excel
          </button>
        )}
      </div>

      {erro && <p style={styles.erro}>{erro}</p>}

      {resumoMensal.map((r) => (
        <div key={r.mes}>
          <div
            style={{
              ...styles.resumoCard,
              ...(r.saldo >= 0 ? styles.resumoCardPositive : styles.resumoCardNegative)
            }}
            onClick={() => toggleDetalhes(r.mes)}
          >
            <div style={styles.resumoMes}>{r.mes}</div>
            <div style={styles.resumoValor}>Vendas: R$ {r.totalVendas.toFixed(2)}</div>
            <div style={styles.resumoValor}>Despesas: R$ {r.totalDespesas.toFixed(2)}</div>
            <div style={styles.resumoValor}>Saldo: R$ {r.saldo.toFixed(2)}</div>
            <div style={{ justifySelf: "end", fontWeight: 500, color: "#2563eb" }}>
              {detalhesMes[r.mes] ? "Ocultar ▴" : "Detalhes ▾"}
            </div>
          </div>

          {detalhesMes[r.mes] && (
            <div style={styles.detalhes}>
              <h4 style={{ marginBottom: "0.5rem" }}>Vendas (Pagas)</h4>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Data</th>
                    <th style={styles.th}>Cliente</th>
                    <th style={styles.th}>Itens</th>
                    <th style={styles.th}>Valor</th>
                    <th style={styles.th}>Detalhar</th>
                  </tr>
                </thead>
                <tbody>
                  {r.detalhesVendas.length === 0 ? (
                      <tr><td colSpan="5" style={{...styles.td, textAlign: "center"}}>Nenhuma venda paga neste mês.</td></tr>
                  ) : (
                      r.detalhesVendas.map(v => (
                        <tr key={v.id}>
                          <td style={styles.td}>{new Date(v.criado_em).toLocaleDateString("pt-BR")}</td>
                          <td style={styles.td}>{v.cliente_nome}</td>
                          <td style={{...styles.td, fontSize: '0.85rem', color: '#555'}}>{v.itens}</td>
                          <td style={styles.td}>R$ {parseFloat(v.total).toFixed(2)}</td>
                          <td style={styles.td}>
                            <button style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", cursor: "pointer", backgroundColor: "#2563eb", color: "#fff", border: "none" }}
                              onClick={() => abrirModalVenda(v.id)}>
                              Detalhes
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>

              <h4 style={{ marginBottom: "0.5rem" }}>Despesas</h4>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Data</th>
                    <th style={styles.th}>Descrição</th>
                    <th style={styles.th}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {r.detalhesDespesas.map(d => (
                    <tr key={d.id}>
                      <td style={styles.td}>{new Date(d.data).toLocaleDateString("pt-BR")}</td>
                      <td style={styles.td}>{d.descricao}</td>
                      <td style={styles.td}>R$ {parseFloat(d.valor).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {modalAberto && vendaDetalhada && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button style={styles.closeButton} onClick={() => setModalAberto(false)}>✕</button>
            <h3>Venda ID: {vendaDetalhada.id}</h3>
            <p>Cliente: {vendaDetalhada.cliente_id}</p>
            <p>Funcionário: {vendaDetalhada.funcionario_id}</p>
            <p>Forma de Pagamento: {vendaDetalhada.forma_pagamento}</p>
            <p>Status Pagamento: {vendaDetalhada.status_pagamento}</p>
            <p>Data: {new Date(vendaDetalhada.criado_em).toLocaleDateString("pt-BR")}</p>

            <h4>Itens Detalhados</h4>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nome</th>
                  <th style={styles.th}>Quantidade</th>
                  <th style={styles.th}>Preço Unitário</th>
                  <th style={styles.th}>Total</th>
                </tr>
              </thead>
              <tbody>
                {vendaDetalhada.itens.map((item, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{item.nome}</td>
                    <td style={styles.td}>{item.quantidade}</td>
                    <td style={styles.td}>R$ {parseFloat(item.preco_unitario).toFixed(2)}</td>
                    <td style={styles.td}>R$ {(item.quantidade * item.preco_unitario).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FluxoCaixaResumoMensal;