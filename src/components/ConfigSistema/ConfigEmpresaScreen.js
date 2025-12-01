import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import "./ConfigEmpresaScreen.css";

const diasSemana = [
  "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira",
  "Sexta-feira", "Sábado", "Domingo"
];

// Função auxiliar para gerar horários em intervalos de 30 min
const gerarHorarios = (inicioStr, fimStr) => {
    const horarios = [];
    let [horaInicio, minInicio] = inicioStr.split(':').map(Number);
    let [horaFim, minFim] = fimStr.split(':').map(Number);

    let atual = new Date();
    atual.setHours(horaInicio, minInicio, 0, 0);

    let fim = new Date();
    fim.setHours(horaFim, minFim, 0, 0);

    while (atual <= fim) {
        const h = atual.getHours().toString().padStart(2, '0');
        const m = atual.getMinutes().toString().padStart(2, '0');
        horarios.push(`${h}:${m}`);
        // Incrementa 30 minutos
        atual.setMinutes(atual.getMinutes() + 30);
    }
    return horarios;
};

// Intervalos base fixos
const OPCOES_MANHA_GERAL = gerarHorarios("05:00", "12:00");
const OPCOES_TARDE_GERAL = gerarHorarios("13:00", "19:00");

function ConfigEmpresaScreen({ onBack }) {
  const [config, setConfig] = useState({
      endereco: "",
      telefone: "",
      email: ""
  });
  const [horarios, setHorarios] = useState([]);

  // Estado para novo horário (se ainda for usar, mas o foco mudou para a lista fixa)
  const [novoHorario, setNovoHorario] = useState({
      dia_semana: diasSemana[0],
      abre: "08:00",
      fecha: "12:00"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- MÁSCARA DE TELEFONE ---
  const mascaraTelefone = (value) => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "").slice(0, 11);
    let result = "";
    if (digits.length > 0) result = "(" + digits.substring(0, 2);
    if (digits.length > 2) result += ") " + digits.substring(2, 7);
    if (digits.length > 7) result += "-" + digits.substring(7, 11);
    return result;
  };

  const handleTelefoneChange = (e) => {
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
      setError("Erro ao carregar configurações gerais.");
    }
  };

  const fetchHorarios = async () => {
    try {
      const response = await axios.get("/admin/config/horarios");
      if (Array.isArray(response.data)) {
          // Garante que os horários venham formatados HH:MM (apenas os 5 primeiros chars)
          const dadosFormatados = response.data.map(h => ({
              ...h,
              inicio_manha: h.inicio_manha ? h.inicio_manha.substring(0, 5) : "08:00",
              fim_manha: h.fim_manha ? h.fim_manha.substring(0, 5) : "12:00",
              inicio_tarde: h.inicio_tarde ? h.inicio_tarde.substring(0, 5) : "13:00",
              fim_tarde: h.fim_tarde ? h.fim_tarde.substring(0, 5) : "18:00",
          }));
          setHorarios(dadosFormatados);
      } else {
          setHorarios([]);
      }
    } catch (err) {
      console.error("Erro ao buscar horários:", err);
      setError("Erro ao carregar horários.");
    }
  };

  const handleSalvarConfig = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
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

  // Atualiza o estado local
  const handleHorarioChange = (index, field, value) => {
      const novosHorarios = [...horarios];

      // Lógica de validação/ajuste automático
      if (field === 'inicio_manha') {
          // Se mudou o início da manhã, verifica se o fim é válido
          // O fim deve ser maior que o início. Se não for, ajusta para o próximo slot (30 min depois) ou o fim do turno
          if (value >= novosHorarios[index].fim_manha) {
             // Tenta setar o fim para 1 hora depois, ou o máximo (12:00)
             const [h, m] = value.split(':').map(Number);
             let novaHora = h + 1;
             const novoFim = `${novaHora.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
             novosHorarios[index].fim_manha = novaHora > 12 ? "12:00" : novoFim;
          }
      }

      if (field === 'inicio_tarde') {
          if (value >= novosHorarios[index].fim_tarde) {
             const [h, m] = value.split(':').map(Number);
             let novaHora = h + 1;
             const novoFim = `${novaHora.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
             novosHorarios[index].fim_tarde = novaHora > 19 ? "19:00" : novoFim;
          }
      }

      novosHorarios[index][field] = value;
      setHorarios(novosHorarios);

      // Salva automaticamente no banco (exceto se for só digitação, mas aqui é select)
      salvarHorarioIndividual(novosHorarios[index]);
  };

  const salvarHorarioIndividual = async (horario) => {
      try {
          await axios.put(`/admin/config/horarios/${horario.id}`, horario);
      } catch (err) {
          console.error("Erro ao salvar horário:", err);
          alert(`Erro ao salvar o horário de ${horario.dia_semana}. Verifique a conexão.`);
      }
  };

  // Funções de filtragem para os Selects
  const getOpcoesFimManha = (inicioSelecionado) => {
      // Filtra opções que sejam ESTRITAMENTE MAIORES que o início
      return OPCOES_MANHA_GERAL.filter(op => op > inicioSelecionado);
  };

  const getOpcoesFimTarde = (inicioSelecionado) => {
      return OPCOES_TARDE_GERAL.filter(op => op > inicioSelecionado);
  };

  return (
    <div className="config-container">
      <div className="config-card">
        <div className="config-header">
            <h1>Configurações da Empresa</h1>
            <p>Gerencie as informações institucionais e horários de funcionamento.</p>
        </div>

        {error && <div className="message error-message">{error}</div>}
        {success && <div className="message success-message">{success}</div>}

        {/* Seção de Dados Gerais */}
        <form onSubmit={handleSalvarConfig} className="config-form">
            <h3>Dados Gerais</h3>
            <div className="form-group">
                <label>E-mail de Contato</label>
                <input
                    type="email"
                    className="form-input"
                    value={config.email}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
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
              {loading ? "Salvando..." : "Salvar Dados Gerais"}
            </button>
        </form>

        <hr className="divider" />

        {/* Seção de Horários */}
        <div className="horarios-section">
            <h3>Horários de Funcionamento</h3>
            <p className="hint-text">
                Defina os turnos de atendimento. Os horários de fim se ajustam automaticamente após o início.
            </p>

            <div className="horarios-grid-container">
                {horarios.map((h, index) => (
                    <div key={h.id} className="dia-row">
                        <div className="dia-label">{h.dia_semana}</div>

                        {/* Turno Manhã */}
                        <div className={`turno-box ${!h.manha_ativa ? 'disabled' : ''}`}>
                            <div className="turno-header">
                                <span>Manhã</span>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={h.manha_ativa}
                                        onChange={(e) => {
                                            const novoValor = e.target.checked;
                                            handleHorarioChange(index, 'manha_ativa', novoValor);
                                        }}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            <div className="turno-inputs">
                                {/* Select Início Manhã */}
                                <select
                                    className="form-select time-select"
                                    value={h.inicio_manha}
                                    disabled={!h.manha_ativa}
                                    onChange={(e) => handleHorarioChange(index, 'inicio_manha', e.target.value)}
                                >
                                    {OPCOES_MANHA_GERAL.slice(0, -1).map(op => ( // Remove 12:00 do início
                                        <option key={op} value={op}>{op}</option>
                                    ))}
                                </select>

                                <span className="separator">às</span>

                                {/* Select Fim Manhã (Filtrado) */}
                                <select
                                    className="form-select time-select"
                                    value={h.fim_manha}
                                    disabled={!h.manha_ativa}
                                    onChange={(e) => handleHorarioChange(index, 'fim_manha', e.target.value)}
                                >
                                    {getOpcoesFimManha(h.inicio_manha).map(op => (
                                        <option key={op} value={op}>{op}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Turno Tarde */}
                        <div className={`turno-box ${!h.tarde_ativa ? 'disabled' : ''}`}>
                            <div className="turno-header">
                                <span>Tarde</span>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={h.tarde_ativa}
                                        onChange={(e) => {
                                            const novoValor = e.target.checked;
                                            handleHorarioChange(index, 'tarde_ativa', novoValor);
                                        }}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            <div className="turno-inputs">
                                {/* Select Início Tarde */}
                                <select
                                    className="form-select time-select"
                                    value={h.inicio_tarde}
                                    disabled={!h.tarde_ativa}
                                    onChange={(e) => handleHorarioChange(index, 'inicio_tarde', e.target.value)}
                                >
                                    {OPCOES_TARDE_GERAL.slice(0, -1).map(op => ( // Remove 19:00 do início
                                        <option key={op} value={op}>{op}</option>
                                    ))}
                                </select>

                                <span className="separator">às</span>

                                {/* Select Fim Tarde (Filtrado) */}
                                <select
                                    className="form-select time-select"
                                    value={h.fim_tarde}
                                    disabled={!h.tarde_ativa}
                                    onChange={(e) => handleHorarioChange(index, 'fim_tarde', e.target.value)}
                                >
                                    {getOpcoesFimTarde(h.inicio_tarde).map(op => (
                                        <option key={op} value={op}>{op}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
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