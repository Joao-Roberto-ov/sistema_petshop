import React, { useEffect, useState } from "react";
import "./ModalConfigEmpresa.css";

const diasSemana = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const ModalConfigEmpresa = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [novoHorario, setNovoHorario] = useState({ dia_semana: diasSemana[0], abre: "", fecha: "" });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      fetchHorarios();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      const response = await fetch("http://localhost:8000/admin/config/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Erro ao buscar config:", error);
    }
  };

  const fetchHorarios = async () => {
    try {
      const response = await fetch("http://localhost:8000/admin/config/horarios", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setHorarios(data || []);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
    }
  };

  const handleSalvarConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/admin/config/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao salvar configuração");
      }

      alert("Configuração atualizada!");
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizarHorario = async (id, horario) => {
    try {
      const response = await fetch(`http://localhost:8000/admin/config/horarios/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(horario),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao atualizar horário");
      }

      fetchHorarios();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleAdicionarHorario = async () => {
    if (!novoHorario.dia_semana || !novoHorario.abre || !novoHorario.fecha) {
      alert("Preencha todos os campos do novo horário.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/admin/config/horarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...novoHorario, fechado: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao adicionar horário");
      }

      setNovoHorario({ dia_semana: diasSemana[0], abre: "", fecha: "" });
      fetchHorarios();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <h2>Configuração da Empresa</h2>

        {config ? (
          <div className="config-section">
            <label>Nome da Empresa:</label>
            <input
              type="text"
              value={config.nome_empresa || ""}
              onChange={(e) => setConfig({ ...config, nome_empresa: e.target.value })}
            />

            <label>Endereço:</label>
            <input
              type="text"
              value={config.endereco || ""}
              onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
            />

            <label>Telefone:</label>
            <input
              type="text"
              value={config.telefone || ""}
              onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
            />

            <label>URL do Logo:</label>
            <input
              type="text"
              value={config.logo_url || ""}
              onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
            />

            <button className="btn-salvar" onClick={handleSalvarConfig} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        ) : (
          <p>Carregando configurações...</p>
        )}

        <hr />

        <h3>Horários de Funcionamento</h3>
        <div className="horarios-list">
          {horarios.length > 0 ? (
            horarios.map((h) => (
              <div key={h.id} className="horario-item">
                <select
                  value={h.dia_semana}
                  onChange={(e) =>
                    handleAtualizarHorario(h.id, { ...h, dia_semana: e.target.value })
                  }
                >
                  {diasSemana.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={h.abre}
                  onChange={(e) =>
                    handleAtualizarHorario(h.id, { ...h, abre: e.target.value })
                  }
                />
                <input
                  type="time"
                  value={h.fecha}
                  onChange={(e) =>
                    handleAtualizarHorario(h.id, { ...h, fecha: e.target.value })
                  }
                />
              </div>
            ))
          ) : (
            <p>Nenhum horário cadastrado.</p>
          )}
        </div>

        <div className="novo-horario">
          <h4>Adicionar novo horário</h4>
          <select
            value={novoHorario.dia_semana}
            onChange={(e) => setNovoHorario({ ...novoHorario, dia_semana: e.target.value })}
          >
            {diasSemana.map((dia) => (
              <option key={dia} value={dia}>
                {dia}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={novoHorario.abre}
            onChange={(e) => setNovoHorario({ ...novoHorario, abre: e.target.value })}
          />
          <input
            type="time"
            value={novoHorario.fecha}
            onChange={(e) => setNovoHorario({ ...novoHorario, fecha: e.target.value })}
          />
          <button className="btn-adicionar" onClick={handleAdicionarHorario}>
            Adicionar
          </button>
        </div>

        <button className="btn-fechar" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
};

export default ModalConfigEmpresa;
