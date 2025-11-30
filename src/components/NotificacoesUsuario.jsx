import React, { useState, useEffect, useRef } from "react";
import axios from "../api/axios";

export default function NotificacoesUsuario() {
    const [notificacoes, setNotificacoes] = useState([]);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const fetchNotificacoes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get("/notificacoes/", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotificacoes(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchNotificacoes();
        // Polling a cada 60s
        const interval = setInterval(fetchNotificacoes, 60000);
        return () => clearInterval(interval);
    }, []);

    const marcarComoLida = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/notificacoes/${id}/lida`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotificacoes(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    // Reutilizando CSS do NotificacoesEstoque para consistência
    return (
        <div ref={ref} className="notif-container" style={{ marginRight: '15px' }}>
            <div className="notif-badge" onClick={() => setOpen(!open)} style={{ background: '#f39c12' }}>
                {notificacoes.length}
            </div>

            {open && (
                <div className="notif-box">
                    <h4 className="notif-title">Notificações</h4>
                    {notificacoes.length === 0 ? (
                        <p className="notif-empty">Nenhuma nova notificação.</p>
                    ) : (
                        notificacoes.map((n) => (
                            <div key={n.id} className="notif-item">
                                <p style={{ margin: 0, fontSize: '0.85rem' }}>{n.mensagem}</p>
                                <small style={{ color: '#888' }}>{new Date(n.criado_em).toLocaleTimeString()}</small>
                                <button
                                    onClick={() => marcarComoLida(n.id)}
                                    style={{
                                        display: 'block', marginTop: '5px', background: 'none',
                                        border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '0.8rem'
                                    }}
                                >
                                    Marcar como lida
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}