import React, { useState, useRef, useEffect } from "react";
import "./NotificacoesEstoque.css";

export default function NotificacoesEstoque({ itens }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="notif-container">
            
            {/* Badge */}
            <div className="notif-badge" onClick={() => setOpen(!open)}>
                {itens.length}
            </div>

            {/* Caixa */}
            {open && (
                <div className="notif-box">
                    <h4 className="notif-title">Estoque Baixo</h4>

                    {itens.length === 0 ? (
                        <p className="notif-empty">Nenhum item crítico.</p>
                    ) : (
                        itens.map((i, index) => (
                            <div key={index} className="notif-item">
                                <strong>{i.nome}</strong>
                                <br />
                                Estoque: {i.estoque} / Mínimo: {i.minimo}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
