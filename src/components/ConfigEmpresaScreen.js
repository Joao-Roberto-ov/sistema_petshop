import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import "./ConfigEmpresaScreen.css";

const diasSemana = [
  "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira",
  "Sexta-feira", "Sábado", "Domingo"
];

function ConfigEmpresaScreen({ onBack }) {
  const [config, setConfig] = useState({
      endereco: "",
      telefone: "",
      email: ""
  });
  const [horarios, setHorarios] = useState([]);
  const [novoHorario, setNovoHorario] = useState({ dia_semana: diasSemana[0], abre: "", fecha: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- MÁSCARA DE TELEFONE (Igual ao MeuPerfilScreen) ---
  const mascaraTelefone = (value) => {
    if (!value) return "";
    // Remove tudo que não é dígito e limita a 11 caracteres
    const digits = value.replace(/\D/g, "").slice(0, 11);

    let result = "";
    if (digits.length > 0) {
        result = "(" + digits.substring(0, 2);
    }
    if (digits.length > 2) {
        result += ") " + digits.substring(2, 7);
    }
    if (digits.length > 7) {
        result += "-" + digits.substring(7, 11);
    }
    return result;
  };

  const handleTelefoneChange = (e) => {
      // Apenas aplica a máscara diretamente
      const valorMascarado = mascaraTelefone(e.target.value);
      setConfig({ ...config, telefone: valorMascarado });
  };

  useEffect(() => {
    fetchConfig();
    fetchHorarios();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get("/admin/config/");
      setConfig({
          endereco: response.data.endereco || "",
          telefone: mascaraTelefone(response.data.telefone || ""),
          email: response.data.email || ""
      });
    } catch (err) {
      console.error("Erro ao buscar config:", err);
      setError("Erro ao carregar configurações.");
    }
  };

  const fetchHorarios = async () => {
    try {
      const response = await axios.get("/admin/config/horarios");
      if (Array.isArray(response.data)) {
          setHorarios(response.data);
      } else {
          console.warn("API retornou formato inválido para horários:", response.data);
          setHorarios([]);
      }
    } catch (err) {
      console.error("Erro ao buscar horários:", err);
      setHorarios([]);
    }
  };

  const handleSalvarConfig = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Removemos a formatação antes de enviar para o banco, se desejar salvar limpo.
      // Se preferir salvar formatado, envie 'config' direto.
      // Aqui estou enviando formatado para manter consistência com o que é exibido.
      await axios.put("/admin/config/", config);
      setSuccess("Dados da empresa atualizados com sucesso!");
    } catch (err) {
      console.error(err);
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail[0].msg);
      } else {
          setError(err.response?.data?.detail || "Erro ao salvar configuração.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizarHorario = async (id, horario) => {
    try {
      await axios.put(`/admin/config/horarios/${id}`, horario);
      fetchHorarios();
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar horário");
    }
  };

  const handleAdicionarHorario = async () => {
    if (!novoHorario.dia_semana || !novoHorario.abre || !novoHorario.fecha) {
      alert("Preencha todos os campos do novo horário.");
      return;
    }

    try {
      await axios.post("/admin/config/horarios", { ...novoHorario, fechado: false });
      setNovoHorario({ dia_semana: diasSemana[0], abre: "", fecha: "" });
      fetchHorarios();
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar horário");
    }
  };

  const handleExcluirHorario = async (id) => {
      if(!window.confirm("Tem certeza que deseja remover este horário?")) return;
      try {
          await axios.delete(`/admin/config/horarios/${id}`);
          fetchHorarios();
      } catch (err) {
          console.error(err);
          alert("Erro ao excluir horário");
      }
  }

  return (
    <div className="config-container">
      <div className="config-card">
        <div className="config-header">
            <h1>Configurações da Empresa</h1>
            <p>Gerencie as informações institucionais e horários de funcionamento.</p>
        </div>

        {error && <div className="message error-message">{error}</div>}
        {success && <div className="message success-message">{success}</div>}

        {/* Seção de Dados da Empresa */}
        <form onSubmit={handleSalvarConfig} className="config-form">
            <h3>Dados Gerais</h3>

            <div className="form-group">
                <label>E-mail de Contato</label>
                <input
                  type="email"
                  className="form-input"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  placeholder="exemplo@empresa.com"
                  required
                />
            </div>

            <div className="form-group">
                <label>Telefone</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.telefone}
                  onChange={handleTelefoneChange}
                  placeholder="(00) 00000-0000"
                  maxLength="15"
                />
            </div>

            <div className="form-group">
                <label>Endereço</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.endereco}
                  onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
                />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
        </form>

        <hr className="divider" />

        {/* Seção de Horários */}
        <div className="horarios-section">
            <h3>Horários de Funcionamento</h3>

            <div className="novo-horario-box">
                <h4>Adicionar Novo Horário</h4>
                <div className="horario-inputs">
                    <select
                        className="form-select"
                        value={novoHorario.dia_semana}
                        onChange={(e) => setNovoHorario({ ...novoHorario, dia_semana: e.target.value })}
                    >
                        {diasSemana.map((dia) => (
                        <option key={dia} value={dia}>{dia}</option>
                        ))}
                    </select>
                    <input
                        type="time"
                        className="form-input time-input"
                        value={novoHorario.abre}
                        onChange={(e) => setNovoHorario({ ...novoHorario, abre: e.target.value })}
                    />
                    <span className="separator">até</span>
                    <input
                        type="time"
                        className="form-input time-input"
                        value={novoHorario.fecha}
                        onChange={(e) => setNovoHorario({ ...novoHorario, fecha: e.target.value })}
                    />
                    <button className="btn-add" type="button" onClick={handleAdicionarHorario}>
                        +
                    </button>
                </div>
            </div>

            <div className="horarios-list">
            {Array.isArray(horarios) && horarios.length > 0 ? (
                horarios.map((h) => (
                <div key={h.id} className="horario-item">
                    <select
                    className="form-select small"
                    value={h.dia_semana}
                    onChange={(e) => handleAtualizarHorario(h.id, { ...h, dia_semana: e.target.value })}
                    >
                    {diasSemana.map((dia) => (
                        <option key={dia} value={dia}>{dia}</option>
                    ))}
                    </select>
                    <input
                    type="time"
                    className="form-input time-input small"
                    value={h.abre}
                    onChange={(e) => handleAtualizarHorario(h.id, { ...h, abre: e.target.value })}
                    />
                    <span className="separator">-</span>
                    <input
                    type="time"
                    className="form-input time-input small"
                    value={h.fecha}
                    onChange={(e) => handleAtualizarHorario(h.id, { ...h, fecha: e.target.value })}
                    />
                    <button className="btn-delete" onClick={() => handleExcluirHorario(h.id)} title="Remover">
                        🗑️
                    </button>
                </div>
                ))
            ) : (
                <p className="no-data">Nenhum horário cadastrado.</p>
            )}
            </div>
        </div>

        <div className="footer-actions">
            <button className="btn-back" onClick={onBack}>
              Voltar
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigEmpresaScreen;