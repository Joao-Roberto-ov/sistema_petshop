import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './PetHistoryModal.css';

function PetHistoryModal({ pet, onClose }) {
    const [history, setHistory] = useState({ consultas: [], servicos: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!pet) return;

        const fetchHistory = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`/pets/${pet.id}/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setHistory(response.data);
            } catch (err) {
                setError('Não foi possível carregar o histórico.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [pet]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>&times;</button>
                <h2>Histórico de {pet.nome}</h2>
                {loading && <p>Carregando histórico...</p>}
                {error && <p className="error-message">{error}</p>}

                {!loading && !error && (
                    <div className="history-sections">
                        <div className="history-section">
                            <h3>Consultas Médicas</h3>
                            {history.consultas.length > 0 ? (
                                <ul>
                                    {history.consultas.map((item, index) => (
                                        <li key={`consulta-${index}`}>
                                            <strong>{item.servico_realizado}</strong>
                                            <span>Por: {item.funcionario}</span>
                                            <span>Data: {formatDate(item.data_hora)}</span>
                                            <span>Valor: R$ {item.valor.toFixed(2).replace('.', ',')}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>Nenhum serviço médico realizado.</p>
                            )}
                        </div>

                        <div className="history-section">
                            <h3>Serviços de Bem-Estar</h3>
                            {history.servicos.length > 0 ? (
                                <ul>
                                    {history.servicos.map((item, index) => (
                                        <li key={`servico-${index}`}>
                                            <strong>{item.servico_realizado}</strong>
                                            <span>Por: {item.funcionario}</span>
                                            <span>Data: {formatDate(item.data_hora)}</span>
                                            <span>Valor: R$ {item.valor.toFixed(2).replace('.', ',')}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>Nenhum serviço de bem-estar realizado.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
export default PetHistoryModal;