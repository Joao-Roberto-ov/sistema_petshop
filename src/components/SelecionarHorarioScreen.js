import React, { useState, useEffect, useMemo } from 'react';
import axios from '../api/axios';
import './SelecionarHorarioScreen.css';

// Ícones
const IconArrowLeft = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);
const IconCheck = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const IconInfo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
);
const IconPencil = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

// Mapa JS (Date.getDay() -> Nome da tabela no Banco)
// 0 = Domingo no JS
const DIAS_SEMANA_MAP_JS = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado"
];

function SelecionarHorarioScreen({
    servico,
    agendamentoParaReagendar,
    onBack,
    onAgendamentoSuccess
}) {

    const modoReagendamento = Boolean(agendamentoParaReagendar);

    const servicoDetalhes = useMemo(() => {
        return modoReagendamento
            ? {
                id: agendamentoParaReagendar.servico_id,
                nome: agendamentoParaReagendar.servico_nome,
                duracao: agendamentoParaReagendar.servico_duracao
              }
            : servico;
    }, [modoReagendamento, agendamentoParaReagendar, servico]);

    const [meusPets, setMeusPets] = useState([]);
    const [loadingPets, setLoadingPets] = useState(true);
    const [selectedPetId, setSelectedPetId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [especialistas, setEspecialistas] = useState([]);
    const [loadingEspecialistas, setLoadingEspecialistas] = useState(false);
    const [selectedFuncionarioId, setSelectedFuncionarioId] = useState('');
    const [agendando, setAgendando] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [clienteId, setClienteId] = useState(null);

    // --- NOVOS ESTADOS PARA CONFIGURAÇÃO DE HORÁRIOS ---
    const [configHorarios, setConfigHorarios] = useState(null); // Armazena a config como objeto { "Segunda-feira": {...}, ... }
    const [loadingConfig, setLoadingConfig] = useState(true);
    // ---------------------------------------------------

    const formatDateForInput = (date) => date.toISOString().split('T')[0];
    const formatTime = (dateTimeString) => {
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
        } catch { return 'Inválido'; }
    };

    // Busca pets e id do cliente
    useEffect(() => {
        const fetchClienteE = async () => {
            setLoadingPets(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                if (modoReagendamento) {
                    setClienteId(agendamentoParaReagendar.cliente_id || true);
                    setSelectedPetId(agendamentoParaReagendar.pet_id);
                    setMeusPets([{
                        id: agendamentoParaReagendar.pet_id,
                        nome: agendamentoParaReagendar.pet_nome,
                        raca: '(Reagendamento)'
                    }]);
                } else {
                    const userDataRes = await axios.get('/users/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    setClienteId(userDataRes.data.id);

                    const petsResponse = await axios.get('/pets', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    setMeusPets(petsResponse.data);
                    if (petsResponse.data.length > 0) {
                        setSelectedPetId(petsResponse.data[0].id);
                    }
                }
            } catch (err) {
                console.error("Erro ao buscar dados:", err);
                setError('Erro ao carregar dados. Tente novamente.');
            } finally {
                setLoadingPets(false);
            }
        };
        fetchClienteE();
    }, [modoReagendamento, agendamentoParaReagendar]);

    // --- BUSCAR CONFIGURAÇÃO DE HORÁRIOS ---
    useEffect(() => {
        const fetchConfigHorarios = async () => {
            setLoadingConfig(true);
            try {
                const response = await axios.get("/admin/config/horarios");
                if (Array.isArray(response.data)) {
                    // Transforma array em objeto para acesso rápido: { "Domingo": { manha_ativa: true... }, ... }
                    const mapa = response.data.reduce((acc, dia) => {
                        acc[dia.dia_semana] = dia;
                        return acc;
                    }, {});
                    setConfigHorarios(mapa);
                }
            } catch (err) {
                console.error("Erro ao buscar config de horários:", err);
                // Não bloqueia o fluxo, mas a validação no front pode falhar (fallback no back)
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchConfigHorarios();
    }, []);

    // Busca especialistas
    useEffect(() => {
        const fetchEspecialistas = async () => {
            if (!servicoDetalhes?.id || modoReagendamento) {
                setEspecialistas([]);
                setSelectedFuncionarioId('');
                return;
            }

            setLoadingEspecialistas(true);
            try {
                const response = await axios.get(`/funcionario/especialistas/${servicoDetalhes.id}`);
                setEspecialistas(response.data || []);
                setSelectedFuncionarioId('');
            } catch (err) {
                console.error("Erro ao buscar especialistas:", err);
                setEspecialistas([]);
                setSelectedFuncionarioId('');
            } finally {
                setLoadingEspecialistas(false);
            }
        };

        fetchEspecialistas();
    }, [servicoDetalhes, modoReagendamento]);

    // Busca horários disponíveis
    useEffect(() => {
        if (!servicoDetalhes?.id || !selectedDate) {
            setAvailableSlots([]);
            return;
        }

        const fetchAvailableSlots = async () => {
            setLoadingSlots(true);
            setError('');
            setSelectedSlot('');
            try {
                const params = {
                    servico_id: servicoDetalhes.id,
                    data_consulta: selectedDate
                };

                if (modoReagendamento) {
                    params.agendamento_id_excluir = agendamentoParaReagendar.id;
                }

                const response = await axios.get('/agendamentos/disponibilidade', { params });
                setAvailableSlots(response.data.horarios || []);
            } catch (err) {
                console.error("Erro ao buscar horários:", err);
                // Se o erro for 400 (dia fechado), a mensagem vem do backend, mas vamos tratar no front também
                if (err.response?.status !== 400) {
                    setError(err.response?.data?.detail || 'Erro ao buscar horários disponíveis.');
                }
                setAvailableSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchAvailableSlots();
    }, [servicoDetalhes, selectedDate, modoReagendamento, agendamentoParaReagendar]);


    const getSelectedSlotObject = () => {
        try {
            return JSON.parse(selectedSlot);
        } catch (e) {
            return null;
        }
    }

    // --- VERIFICAÇÃO SE O DIA ESTÁ ABERTO ---
    const getDiaStatus = () => {
        if (!configHorarios || !selectedDate) return { aberto: true };

        // Cria a data considerando o fuso local para pegar o dia da semana correto
        const dataObj = new Date(selectedDate + "T00:00:00");
        const diaSemanaStr = DIAS_SEMANA_MAP_JS[dataObj.getDay()];

        const configDia = configHorarios[diaSemanaStr];

        if (!configDia) return { aberto: true }; // Se não achar config, assume aberto (backend valida)

        // Verifica se tem pelo menos um turno ativo
        const aberto = configDia.manha_ativa || configDia.tarde_ativa;

        return {
            aberto,
            mensagem: aberto ? "" : `O Petshop não funciona ${diaSemanaStr === 'Sábado' || diaSemanaStr === 'Domingo' ? 'no' : 'na'} ${diaSemanaStr}.`
        };
    };

    const handleSubmit = async () => {
        const slotObj = getSelectedSlotObject();

        if (!selectedPetId || !slotObj || (!clienteId && !modoReagendamento)) {
            setError('Por favor, selecione um pet e um horário.');
            return;
        }
        setAgendando(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');

            if (modoReagendamento) {
                const reagendarData = {
                    nova_data_hora_inicio: slotObj.inicio
                };
                const response = await axios.put(
                    `/agendamentos/${agendamentoParaReagendar.id}/reagendar`,
                    reagendarData,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                setSuccess(response.data.message || 'Agendamento reagendado com sucesso!');

            } else {
                const agendamentoData = {
                    cliente_id: clienteId,
                    pet_id: parseInt(selectedPetId),
                    servico_id: servicoDetalhes.id,
                    data_hora_inicio: slotObj.inicio,
                    funcionario_id: selectedFuncionarioId ? parseInt(selectedFuncionarioId) : null
                };
                const response = await axios.post('/agendamentos', agendamentoData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setSuccess(response.data.message || 'Agendamento realizado com sucesso!');
            }

            setSelectedSlot('');
            setSelectedFuncionarioId('');
             if (onAgendamentoSuccess) {
                 setTimeout(() => onAgendamentoSuccess(), 2000);
             }
        } catch (err) {
            console.error("Erro ao submeter:", err);
             let errorMsg = `Erro ao ${modoReagendamento ? 'reagendar' : 'agendar'}.`;
             if (err.response?.status === 409) {
                 if (err.response?.data?.detail.includes("funcionário")) {
                      errorMsg = err.response?.data?.detail || 'Ops! Este funcionário já está ocupado neste horário. Escolha outro horário ou funcionário.';
                 } else {
                      errorMsg = err.response?.data?.detail || 'Ops! Este horário foi ocupado. Por favor, escolha outro.';
                 }
                 const currentSelectedDate = selectedDate;
                 setSelectedDate('');
                 setTimeout(() => setSelectedDate(currentSelectedDate), 10);
             } else {
                 errorMsg = err.response?.data?.detail || errorMsg;
             }
            setError(errorMsg);
        } finally {
            setAgendando(false);
        }
    };

    const today = formatDateForInput(new Date());
    const selectedSlotObj = getSelectedSlotObject();

    // Verifica status do dia selecionado
    const diaStatus = getDiaStatus();
    const diaFechado = !diaStatus.aberto;

    return (
        <div className="agendamento-container">
            <button onClick={onBack} className="back-button">
                <IconArrowLeft /> {modoReagendamento ? 'Voltar (sem salvar)' : 'Voltar para Serviços'}
            </button>

            <div className="agendamento-card">
                <div className="agendamento-header">
                    <h2>{modoReagendamento ? 'Reagendar Serviço' : 'Agendar Serviço'}</h2>
                    <p>{servicoDetalhes?.nome || 'Serviço'}</p>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="form-group-agendamento">
                    <label htmlFor="petSelect">Pet:</label>
                    {loadingPets ? (<p>Carregando...</p>) : (
                        <select
                            id="petSelect"
                            className="form-input-agendamento"
                            value={selectedPetId}
                            onChange={(e) => setSelectedPetId(e.target.value)}
                            disabled={agendando || modoReagendamento || meusPets.length === 0}
                        >
                            {meusPets.length === 0 && !modoReagendamento && (<option value="">Cadastre um pet primeiro</option>)}
                            {meusPets.map(pet => (<option key={pet.id} value={pet.id}>{pet.nome} {pet.raca ? `(${pet.raca})` : ''}</option>))}
                        </select>
                    )}
                    {meusPets.length === 0 && !loadingPets && !modoReagendamento && (
                        <p className="info-message" style={{marginTop: '0.5rem'}}><IconInfo /> Você ainda não cadastrou nenhum pet.</p>
                    )}
                </div>

                <div className="form-group-agendamento">
                    <label htmlFor="dateSelect">Selecione a {modoReagendamento ? 'Nova ' : ''}Data:</label>
                    <input type="date" id="dateSelect" className="form-input-agendamento" value={selectedDate} min={today} onChange={(e) => setSelectedDate(e.target.value)} disabled={agendando}/>
                </div>

                {/* --- MENSAGEM DE DIA FECHADO --- */}
                {diaFechado && (
                    <div className="info-message" style={{ backgroundColor: '#fee2e2', color: '#991b1b', borderLeft: '4px solid #dc2626' }}>
                        <IconInfo /> {diaStatus.mensagem}
                    </div>
                )}

                {!modoReagendamento && (especialistas.length > 0 || loadingEspecialistas) && (
                     <div className="form-group-agendamento">
                        <label htmlFor="funcionarioSelect">Preferência de Funcionário (Opcional):</label>
                        {loadingEspecialistas ? (
                            <p>Carregando especialistas...</p>
                        ) : (
                            <select
                                id="funcionarioSelect"
                                className="form-input-agendamento"
                                value={selectedFuncionarioId}
                                onChange={(e) => setSelectedFuncionarioId(e.target.value)}
                                disabled={agendando || diaFechado}
                            >
                                <option value="">Qualquer Funcionário Disponível</option>
                                {especialistas.map(func => (
                                    <option key={func.id} value={func.id}>
                                        {func.nome} (Especialista)
                                    </option>
                                ))}
                            </select>
                        )}
                        {especialistas.length === 0 && !loadingEspecialistas && (
                             <p className="slot-info" style={{marginTop: '0.25rem'}}>
                                Não há especialistas específicos para este serviço.
                             </p>
                        )}
                    </div>
                )}

                <div className="form-group-agendamento">
                    <label htmlFor="slotSelect">Selecione o {modoReagendamento ? 'Novo ' : ''}Horário de Início:</label>
                    {loadingSlots ? (<p>Verificando horários...</p>)
                     : diaFechado ? (<p className="slot-info">Selecione uma data válida para ver os horários.</p>)
                     : availableSlots.length === 0 ? (<p className="info-message"><IconInfo /> Nenhum horário disponível para esta data/serviço{selectedFuncionarioId ? '/funcionário' : ''}.</p>)
                     : (
                        <select
                            id="slotSelect"
                            className="form-input-agendamento"
                            value={selectedSlot}
                            onChange={(e) => setSelectedSlot(e.target.value)}
                            disabled={agendando || loadingSlots || loadingPets || !selectedPetId || (meusPets.length === 0 && !modoReagendamento)}
                        >
                            <option value="">-- Escolha um horário --</option>
                            {availableSlots.map(slot => (<option key={slot.inicio} value={JSON.stringify(slot)}>{formatTime(slot.inicio)}</option>))}
                        </select>
                    )}
                    {selectedSlotObj && servicoDetalhes?.duracao && (
                        <p className="slot-info">Duração: {servicoDetalhes.duracao} min. Término: {formatTime(selectedSlotObj.fim)}</p>
                    )}
                </div>

                <button
                    className="btn-confirmar-agendamento"
                    onClick={handleSubmit}
                    disabled={agendando || loadingSlots || loadingPets || !selectedPetId || !selectedSlot || (meusPets.length === 0 && !modoReagendamento) || diaFechado}
                    style={modoReagendamento ? {backgroundColor: '#3498db'} : {}}
                >
                    {agendando ? (modoReagendamento ? 'Reagendando...' : 'Agendando...')
                               : (modoReagendamento ? <><IconPencil /> Confirmar Reagendamento</> : <><IconCheck /> Confirmar Agendamento</>)}
                </button>
            </div>
        </div>
    );
}

export default SelecionarHorarioScreen;