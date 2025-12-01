import React, { useState, useEffect, useMemo } from 'react';
import axios from '../../api/axios';
import './SelecionarHorarioScreen.css';

// Ícones
const IconArrowLeft = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
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


function ReagendamentoGestorScreen({
    agendamentoParaReagendar,
    onBack,
    onAgendamentoSuccess
}) {

    const servicoDetalhes = useMemo(() => {
        if (!agendamentoParaReagendar) return null;
        return {
            id: agendamentoParaReagendar.servico_id,
            nome: agendamentoParaReagendar.servico_nome,
            duracao: agendamentoParaReagendar.servico_duracao
        };
    }, [agendamentoParaReagendar]);

    const [meusPets, setMeusPets] = useState([]);
    const [loadingPets, setLoadingPets] = useState(true);
    const [selectedPetId, setSelectedPetId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState('');

    const [agendando, setAgendando] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [clienteId, setClienteId] = useState(null); // Apenas para validação

    const formatDateForInput = (date) => date.toISOString().split('T')[0];
    const formatTime = (dateTimeString) => {
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
        } catch { return 'Inválido'; }
    };

    //pega os dados do pet e cliente direto da prop
    useEffect(() => {
        setLoadingPets(true);
        setError('');
        if (agendamentoParaReagendar) {
            // Define os dados necessários sem chamadas de API de cliente
            setClienteId(agendamentoParaReagendar.cliente_id || true);
            setSelectedPetId(agendamentoParaReagendar.pet_id);
            setMeusPets([{
                id: agendamentoParaReagendar.pet_id,
                nome: agendamentoParaReagendar.pet_nome,
                raca: '(Reagendamento)'
            }]);
            setLoadingPets(false);
        } else {
            setError('Erro: Dados do agendamento não foram fornecidos.');
            setLoadingPets(false);
        }
    }, [agendamentoParaReagendar]);


    // useEffect para buscar horários
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
                    data_consulta: selectedDate,
                    agendamento_id_excluir: agendamentoParaReagendar.id //sempre inclui id para excluir
                };

                const response = await axios.get('/agendamentos/disponibilidade', { params });
                setAvailableSlots(response.data.horarios || []);
            } catch (err) {
                console.error("Erro ao buscar horários:", err);
                setError(err.response?.data?.detail || 'Erro ao buscar horários disponíveis.');
                setAvailableSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchAvailableSlots();
    }, [servicoDetalhes, selectedDate, agendamentoParaReagendar]);


    const getSelectedSlotObject = () => {
        try {
            return JSON.parse(selectedSlot);
        } catch (e) {
            return null;
        }
    }

    const handleSubmit = async () => {
        const slotObj = getSelectedSlotObject();

        if (!selectedPetId || !slotObj || !clienteId) {
            setError('Por favor, selecione um horário.');
            return;
        }
        setAgendando(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const reagendarData = {
                nova_data_hora_inicio: slotObj.inicio
            };

            const response = await axios.put(
                `/agendamentos/admin/${agendamentoParaReagendar.id}/reagendar`, //rota do admin
                reagendarData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            setSuccess(response.data.message || 'Agendamento reagendado com sucesso!');

            setSelectedSlot('');
             if (onAgendamentoSuccess) {
                 setTimeout(() => onAgendamentoSuccess(), 2000);
             }
        } catch (err) {
            console.error("Erro ao submeter reagendamento (gestor):", err);
             let errorMsg = `Erro ao reagendar.`;
             if (err.response?.status === 409) {
                 errorMsg = err.response?.data?.detail || 'Ops! Este horário foi ocupado. Por favor, escolha outro.';
                 //atualiza os horários
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

    return (
        <div className="agendamento-container">
            <button onClick={onBack} className="back-button">
                <IconArrowLeft /> Voltar (sem salvar)
            </button>

            <div className="agendamento-card">
                <div className="agendamento-header">
                    <h2>Reagendar Serviço (Gestor)</h2>
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
                            disabled={true}
                        >
                            {meusPets.map(pet => (<option key={pet.id} value={pet.id}>{pet.nome} {pet.raca ? `(${pet.raca})` : ''}</option>))}
                        </select>
                    )}
                </div>

                <div className="form-group-agendamento">
                    <label htmlFor="dateSelect">Selecione a Nova Data:</label>
                    <input type="date" id="dateSelect" className="form-input-agendamento" value={selectedDate} min={today} onChange={(e) => setSelectedDate(e.target.value)} disabled={agendando}/>
                </div>
                <div className="form-group-agendamento">
                    <label htmlFor="slotSelect">Selecione o Novo Horário de Início:</label>
                    {loadingSlots ? (<p>Verificando horários...</p>)
                     : availableSlots.length === 0 ? (<p className="info-message"><IconInfo /> Nenhum horário disponível para esta data/serviço.</p>)
                     : (
                        <select
                            id="slotSelect"
                            className="form-input-agendamento"
                            value={selectedSlot}
                            onChange={(e) => setSelectedSlot(e.target.value)}
                            disabled={agendando || loadingSlots || loadingPets || !selectedPetId}
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
                    disabled={agendando || loadingSlots || loadingPets || !selectedPetId || !selectedSlot}
                    style={{backgroundColor: '#3498db'}}
                >
                    {agendando ? 'Reagendando...' : <><IconPencil /> Confirmar Reagendamento</>}
                </button>
            </div>
        </div>
    );
}

export default ReagendamentoGestorScreen;