import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import './Prontuario.css';

function ProntuarioPet({ pet, onBack }) {
    const [activeTab, setActiveTab] = useState('consultas');
    const [historico, setHistorico] = useState({ consultas: [], vacinas: [], servicos: [], observacoes: [] });
    const [loading, setLoading] = useState(true);

    const [formConsulta, setFormConsulta] = useState({ resumo: '', detalhes: '', valor: '' });
    const [formVacina, setFormVacina] = useState({ nome: '', data_aplicacao: '', tem_reforco: false, data_reforco: '' });
    const [novaObservacao, setNovaObservacao] = useState('');

    useEffect(() => {
        carregarDados();
    }, [pet.id]);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/historico/completo/${pet.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if(res.data.success) {
                const allData = res.data.historico;
                setHistorico({
                    consultas: allData.filter(i => i.tipo_servico === 'Consulta'),
                    vacinas: res.data.vacinas,
                    servicos: allData.filter(i => i.tipo_servico !== 'Consulta' && i.tipo_servico !== 'Observação'),
                    observacoes: allData.filter(i => i.tipo_servico === 'Observação')
                });
            }
        } catch (err) {
            console.error("Erro ao carregar prontuário:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSalvarConsulta = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/historico/', {
                pet_id: pet.id,
                tipo_servico: 'Consulta',
                data_hora: new Date().toISOString(),
                resumo: formConsulta.resumo,
                detalhes: formConsulta.detalhes,
                valor: parseFloat(formConsulta.valor) || 0
            }, { headers: { Authorization: `Bearer ${token}` } });

            setFormConsulta({ resumo: '', detalhes: '', valor: '' });
            carregarDados();
            alert("Consulta registrada!");
        } catch(err) { alert("Erro ao salvar consulta."); }
    };

    const handleSalvarVacina = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = {
                pet_id: pet.id,
                nome_vacina: formVacina.nome,
                data_aplicacao: formVacina.data_aplicacao,
                funcionario_id: null
            };
            if (formVacina.tem_reforco) {
                payload.data_proxima_dose = formVacina.data_reforco;
            }

            await axios.post('/vacinas/', payload, { headers: { Authorization: `Bearer ${token}` } });
            setFormVacina({ nome: '', data_aplicacao: '', tem_reforco: false, data_reforco: '' });
            carregarDados();
            alert("Vacina registrada!");
        } catch(err) { alert("Erro ao salvar vacina."); }
    };

    // Correção do erro 422: O backend agora aceita "Observação"
    const handleSalvarObservacao = async () => {
        if(!novaObservacao.trim()) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post('/historico/', {
                pet_id: pet.id,
                tipo_servico: 'Observação',
                data_hora: new Date().toISOString(),
                resumo: 'Nova Observação',
                detalhes: novaObservacao,
                valor: 0
            }, { headers: { Authorization: `Bearer ${token}` } });
            setNovaObservacao('');
            carregarDados();
        } catch(err) {
            console.error(err);
            alert("Erro ao salvar observação. Verifique se o backend foi atualizado.");
        }
    };

    const handleDeletarItem = async (id, tipo) => {
        if(!window.confirm("Tem certeza?")) return;
        try {
            const token = localStorage.getItem('token');
            // Se for vacina usa rota de vacinas (se existir delete), senão usa histórico
            const endpoint = tipo === 'vacina' ? `/vacinas/${id}` : `/historico/${id}`;

            await axios.delete(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            carregarDados();

        } catch(err) { alert("Erro ao deletar."); }
    };

    const TabButton = ({ name, label }) => (
        <button
            className={`tab-btn ${activeTab === name ? 'active' : ''}`}
            onClick={() => setActiveTab(name)}
        >
            {label}
        </button>
    );

    // Helper para definir a classe com base no tipo de serviço (caso venha do banco)
    const getServiceClass = (tipo) => {
        if (!tipo) return 'servico';
        const t = tipo.toLowerCase();
        if (t.includes('consulta')) return 'consulta';
        if (t.includes('vacina')) return 'vacina';
        if (t.includes('observa')) return 'observacao';
        return 'servico';
    };

    if (loading) return <div className="loading-msg">Carregando prontuário...</div>;

    return (
        <div className="prontuario-container">
            <div className="prontuario-header">
                <h2>Prontuário: {pet.nome}</h2>
                <button className="btn-voltar" onClick={onBack}>Voltar</button>
            </div>

            <div className="tabs-header">
                <TabButton name="consultas" label="Consultas Médicas" />
                <TabButton name="vacinas" label="Carteira de Vacinação" />
                <TabButton name="servicos" label="Serviços de Bem-Estar" />
                <TabButton name="observacoes" label="Observações" />
            </div>

            <div className="tab-content">

                {/* --- ABA CONSULTAS --- */}
                {activeTab === 'consultas' && (
                    <div className="fade-in">
                        <div className="form-section">
                            <h4>Nova Consulta</h4>
                            <form onSubmit={handleSalvarConsulta}>
                                <div className="form-group">
                                    <label>Resumo/Título:</label>
                                    <input type="text" className="form-input" value={formConsulta.resumo} onChange={e => setFormConsulta({...formConsulta, resumo: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>Detalhes (Anamnese, Exames, Diagnóstico):</label>
                                    <textarea className="form-input" rows="4" value={formConsulta.detalhes} onChange={e => setFormConsulta({...formConsulta, detalhes: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>Valor (R$):</label>
                                    <input type="number" className="form-input" value={formConsulta.valor} onChange={e => setFormConsulta({...formConsulta, valor: e.target.value})} />
                                </div>
                                <button type="submit" className="btn-submit">Salvar Consulta</button>
                            </form>
                        </div>

                        <h4>Histórico de Consultas</h4>
                        {historico.consultas.map(c => (
                            // Uso da classe 'consulta' para definir a cor verde
                            <div key={c.id} className="history-item consulta">
                                <div className="history-header">
                                    <span className="history-title">{new Date(c.data_hora).toLocaleDateString()} - {c.resumo}</span>
                                    <span className="history-meta">{c.funcionario_nome}</span>
                                </div>
                                <div className="history-body">{c.detalhes}</div>
                                <div className="history-footer">
                                    <button className="btn-delete" onClick={() => handleDeletarItem(c.id, 'historico')}>🗑️</button>
                                </div>
                            </div>
                        ))}
                        {historico.consultas.length === 0 && <p className="empty-msg">Nenhuma consulta registrada.</p>}
                    </div>
                )}

                {/* --- ABA VACINAS --- */}
                {activeTab === 'vacinas' && (
                    <div className="fade-in">
                        <div className="form-section">
                            <h4>Registrar Vacina/Medicação</h4>
                            <form onSubmit={handleSalvarVacina}>
                                <div className="form-group">
                                    <label>Nome da Vacina/Remédio:</label>
                                    <input type="text" className="form-input" value={formVacina.nome} onChange={e => setFormVacina({...formVacina, nome: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>Data Aplicação:</label>
                                    <input type="date" className="form-input" value={formVacina.data_aplicacao} onChange={e => setFormVacina({...formVacina, data_aplicacao: e.target.value})} required />
                                </div>
                                <div className="form-group checkbox-group">
                                    <input type="checkbox" id="reforco" checked={formVacina.tem_reforco} onChange={e => setFormVacina({...formVacina, tem_reforco: e.target.checked})} />
                                    <label htmlFor="reforco">Agendar Reforço?</label>
                                </div>
                                {formVacina.tem_reforco && (
                                    <div className="form-group">
                                        <label>Data Reforço:</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formVacina.data_reforco}
                                            onChange={e => setFormVacina({...formVacina, data_reforco: e.target.value})}
                                            min={formVacina.data_aplicacao}
                                            required
                                        />
                                    </div>
                                )}
                                <button type="submit" className="btn-submit">Registrar Aplicação</button>
                            </form>
                        </div>

                        <h4>Carteira de Vacinação</h4>
                        {historico.vacinas.map(v => (
                            // Uso da classe 'vacina' para definir a cor verde claro
                            <div key={v.id} className="history-item vacina">
                                <div className="history-header">
                                    <span className="history-title">{v.nome_vacina}</span>
                                    <span className="history-meta">Aplicado: {new Date(v.data_aplicacao).toLocaleDateString()}</span>
                                </div>
                                {v.data_proxima_dose && (
                                    <div className="history-body" style={{color: '#e67e22', fontWeight: 'bold'}}>
                                        Próxima dose: {new Date(v.data_proxima_dose).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        ))}
                         {historico.vacinas.length === 0 && <p className="empty-msg">Nenhuma vacina registrada.</p>}
                    </div>
                )}

                {/* --- ABA SERVIÇOS (Read-Only) --- */}
                {activeTab === 'servicos' && (
                    <div className="fade-in">
                        <h4>Histórico de Serviços (Banho, Tosa, etc.)</h4>
                        {historico.servicos.length === 0 ? <p className="empty-msg">Nenhum serviço concluído.</p> :
                         historico.servicos.map(s => (
                            // Uso da função helper para definir a classe (geralmente 'servico' - roxo)
                            <div key={s.id} className={`history-item ${getServiceClass(s.tipo_servico)}`}>
                                <div className="history-header">
                                    <span className="history-title">{s.tipo_servico}</span>
                                    <span className="history-price">R$ {s.valor}</span>
                                </div>
                                <div className="history-meta">{new Date(s.data_hora).toLocaleString()}</div>
                                <div className="history-body">{s.resumo}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- ABA OBSERVAÇÕES --- */}
                {activeTab === 'observacoes' && (
                    <div className="fade-in">
                        <div className="form-section">
                            <h4>Adicionar Observação</h4>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Escreva uma observação..."
                                    value={novaObservacao}
                                    onChange={e => setNovaObservacao(e.target.value)}
                                />
                                <button className="btn-submit" style={{ width: 'auto' }} onClick={handleSalvarObservacao}>Adicionar</button>
                            </div>
                        </div>

                        <h4>Lista de Observações</h4>
                        {historico.observacoes.map(obs => (
                            // Uso da classe 'observacao' para definir a cor amarela
                            <div key={obs.id} className="history-item observacao">
                                <div className="history-body" style={{ flex: 1 }}>
                                    <small className="history-meta">{new Date(obs.data_hora).toLocaleDateString()} - </small>
                                    {obs.detalhes}
                                </div>
                                <button className="btn-delete" onClick={() => handleDeletarItem(obs.id, 'historico')}>🗑️</button>
                            </div>
                        ))}
                        {historico.observacoes.length === 0 && <p className="empty-msg">Nenhuma observação registrada.</p>}
                    </div>
                )}

            </div>
        </div>
    );
}

export default ProntuarioPet;