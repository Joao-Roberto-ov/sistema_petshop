import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import './Prontuario.css';

function ProntuarioPet({ pet, onBack }) {
    const [activeTab, setActiveTab] = useState('consultas');
    // Separa observações do histórico geral
    const [historico, setHistorico] = useState({ consultas: [], vacinas: [], servicos: [] });
    const [observacoesList, setObservacoesList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formConsulta, setFormConsulta] = useState({ resumo: '', detalhes: '', valor: '' });
    const [formVacina, setFormVacina] = useState({ nome: '', data_aplicacao: '', tem_reforco: false, data_reforco: '' });

    // State específico para nova observação
    const [obsTitulo, setObsTitulo] = useState('');
    const [obsDetalhes, setObsDetalhes] = useState('');

    useEffect(() => {
        if(pet && pet.id) {
            carregarDadosCompletos();
        }
    }, [pet]);

    // --- FUNÇÃO AUXILIAR DE MÁSCARA (Mesma do CadastrarProduto.js) ---
    const formatarReal = (value) => {
        // remove tudo que nao é digito
        let numero = value.replace(/\D/g, '');

        // converte para numero e divide por 100 para ter centavos
        numero = (Number(numero) / 100).toFixed(2);

        // formata com separadores brasileiros
        return numero.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const carregarDadosCompletos = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            // 1. Carrega Histórico (Consultas, Vacinas, Serviços)
            const resHist = await axios.get(`/historico/completo/${pet.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 2. Carrega Observações
            let resObsData = [];
            try {
                const resObs = await axios.get(`/observacoes/pet/${pet.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                resObsData = resObs.data;
            } catch (e) {
                console.warn("Não foi possível carregar observações dedicadas", e);
            }

            if(resHist.data.success) {
                const allData = resHist.data.historico;
                setHistorico({
                    consultas: allData.filter(i => i.tipo_servico === 'Consulta'),
                    vacinas: resHist.data.vacinas,
                    servicos: allData.filter(i => i.tipo_servico !== 'Consulta' && i.tipo_servico !== 'Observação'),
                });
            }

            setObservacoesList(resObsData || []);

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

            // --- LIMPEZA DO VALOR (R$ 1.000,00 -> 1000.00) ---
            const valorLimpo = formConsulta.valor
                ? formConsulta.valor.replace(/\./g, '').replace(',', '.')
                : '0';

            await axios.post('/historico/', {
                pet_id: pet.id,
                tipo_servico: 'Consulta',
                data_hora: new Date().toISOString(),
                resumo: formConsulta.resumo,
                detalhes: formConsulta.detalhes,
                valor: parseFloat(valorLimpo) || 0 // Envia como float limpo
            }, { headers: { Authorization: `Bearer ${token}` } });

            setFormConsulta({ resumo: '', detalhes: '', valor: '' });
            carregarDadosCompletos();
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
            carregarDadosCompletos();
            alert("Vacina registrada!");
        } catch(err) { alert("Erro ao salvar vacina."); }
    };

    // --- NOVA LÓGICA DE OBSERVAÇÃO ---
    const handleSalvarObservacao = async (e) => {
        e.preventDefault();

        if(!obsDetalhes.trim()) {
            alert("O conteúdo da observação é obrigatório.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const payload = {
                pet_id: parseInt(pet.id),
                titulo: obsTitulo || 'Observação',
                descricao: obsDetalhes
            };

            // Correção anterior: Usar o OAuth2 scheme no back e enviar header correto aqui
            await axios.post('/observacoes/', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setObsTitulo('');
            setObsDetalhes('');
            carregarDadosCompletos();
            alert("Observação salva com sucesso!");

        } catch(err) {
            console.error("Erro ao salvar observação:", err);
            const msg = err.response?.data?.detail
                ? JSON.stringify(err.response.data.detail)
                : "Erro ao salvar observação.";
            alert(`Erro: ${msg}`);
        }
    };

    const handleDeletarObservacao = async (id) => {
        if(!window.confirm("Tem certeza que deseja excluir esta observação?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/observacoes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            carregarDadosCompletos();
        } catch(err) {
            alert("Erro ao deletar observação.");
        }
    };

    const TabButton = ({ name, label }) => (
        <button
            className={`tab-btn ${activeTab === name ? 'active' : ''}`}
            onClick={() => setActiveTab(name)}
        >
            {label}
        </button>
    );

    const getServiceClass = (tipo) => {
        if (!tipo) return 'servico';
        const t = tipo.toLowerCase();
        if (t.includes('consulta')) return 'consulta';
        if (t.includes('vacina')) return 'vacina';
        return 'servico';
    };

    if (loading) return <div className="loading-msg">Carregando prontuário...</div>;

    return (
        <div className="prontuario-container">
            <div className="prontuario-header">
                <h2>Prontuário: {pet.nome}</h2>
                <button className="btn-voltar-prontuario" onClick={onBack}>Voltar</button>
            </div>

            <div className="tabs-header">
                <TabButton name="consultas" label="Consultas Médicas" />
                <TabButton name="vacinas" label="Carteira de Vacinação" />
                <TabButton name="servicos" label="Serviços de Bem-Estar" />
                <TabButton name="observacoes" label="Observações" />
            </div>

            <div className="tab-content">
                {/* ABA CONSULTAS */}
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
                                    {/* INPUT ATUALIZADO PARA USAR A MÁSCARA */}
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formConsulta.valor}
                                        onChange={e => setFormConsulta({...formConsulta, valor: formatarReal(e.target.value)})}
                                        placeholder="0,00"
                                    />
                                </div>
                                <button type="submit" className="btn-submit">Salvar Consulta</button>
                            </form>
                        </div>

                        <h4>Histórico de Consultas</h4>
                        {historico.consultas.map(c => (
                            <div key={c.id} className="history-item consulta">
                                <div className="history-header">
                                    <span className="history-title">{new Date(c.data_hora).toLocaleDateString()} - {c.resumo}</span>
                                    <span className="history-meta">{c.funcionario_nome}</span>
                                </div>
                                <div className="history-body">{c.detalhes}</div>
                                {c.valor && <div className="history-price">Valor: R$ {c.valor.toFixed(2)}</div>}
                            </div>
                        ))}
                        {historico.consultas.length === 0 && <p className="empty-msg">Nenhuma consulta registrada.</p>}
                    </div>
                )}

                {/* ABA VACINAS */}
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
                                        <input type="date" className="form-input" value={formVacina.data_reforco} onChange={e => setFormVacina({...formVacina, data_reforco: e.target.value})} min={formVacina.data_aplicacao} required />
                                    </div>
                                )}
                                <button type="submit" className="btn-submit">Registrar Aplicação</button>
                            </form>
                        </div>
                        <h4>Carteira de Vacinação</h4>
                        {historico.vacinas.map(v => (
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

                {/* ABA SERVIÇOS */}
                {activeTab === 'servicos' && (
                    <div className="fade-in">
                        <h4>Histórico de Serviços</h4>
                        {historico.servicos.length === 0 ? <p className="empty-msg">Nenhum serviço concluído.</p> :
                         historico.servicos.map(s => (
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

                {/* ABA OBSERVAÇÕES */}
                {activeTab === 'observacoes' && (
                    <div className="fade-in">
                        <div className="form-section">
                            <h4>Adicionar Nova Observação</h4>
                            <div className="observation-form">
                                <div className="form-group">
                                    <label>Título:</label>
                                    <input
                                        type="text" className="form-input"
                                        value={obsTitulo} onChange={e => setObsTitulo(e.target.value)}
                                        placeholder="Ex: Comportamento, Alimentação..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Descrição:</label>
                                    <textarea
                                        className="form-input" rows="4"
                                        value={obsDetalhes} onChange={e => setObsDetalhes(e.target.value)}
                                        placeholder="Detalhes da observação..."
                                        style={{resize: 'vertical'}}
                                    />
                                </div>
                                <button className="btn-submit" onClick={handleSalvarObservacao}>Salvar Observação</button>
                            </div>
                        </div>

                        <h4>Lista de Observações</h4>
                        {observacoesList.length === 0 ? (
                            <p className="empty-msg">Nenhuma observação registrada.</p>
                        ) : (
                            observacoesList.map(obs => (
                                <div key={obs.id} className="history-item observacao">
                                    <div className="history-header">
                                        <span className="history-title">{obs.titulo || 'Observação'}</span>
                                        <span className="history-meta">
                                            {new Date(obs.data_criacao).toLocaleString()} - {obs.funcionario_nome || 'Sistema'}
                                        </span>
                                    </div>
                                    <div className="history-body" style={{whiteSpace: 'pre-wrap'}}>
                                        {obs.descricao}
                                    </div>
                                    <div className="history-footer">
                                        <button className="btn-delete" onClick={() => handleDeletarObservacao(obs.id)}>🗑️ Excluir</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProntuarioPet;