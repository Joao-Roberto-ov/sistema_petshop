import React from 'react';

function VendaDetalhesModal({ venda, onClose }) {
    if (!venda) return null;

    // Transforma a string "1x Item A, 2x Item B" em um array para lista
    const listaItens = venda.itens ? venda.itens.split(', ') : [];

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100
        },
        content: {
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            position: 'relative',
            maxHeight: '80vh',
            overflowY: 'auto'
        },
        closeBtn: {
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#666'
        },
        header: {
            borderBottom: '1px solid #eee',
            paddingBottom: '1rem',
            marginBottom: '1rem'
        },
        list: {
            listStyle: 'none',
            padding: 0,
            margin: 0
        },
        listItem: {
            padding: '0.75rem',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        badge: {
            background: '#e0f2fe',
            color: '#0284c7',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '0.9rem'
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.content} onClick={e => e.stopPropagation()}>
                <button style={styles.closeBtn} onClick={onClose}>&times;</button>

                <div style={styles.header}>
                    <h3 style={{margin: 0, color: '#333'}}>Detalhes da Venda #{venda.id}</h3>
                    <p style={{margin: '0.5rem 0 0', color: '#666'}}>Cliente: {venda.cliente_nome}</p>
                </div>

                <h4 style={{color: '#4a9b8e', marginBottom: '0.5rem'}}>Itens do Pedido:</h4>

                {listaItens.length === 0 ? (
                    <p>Nenhum item registrado.</p>
                ) : (
                    <ul style={styles.list}>
                        {listaItens.map((item, index) => {
                            // Tenta separar "2x" do "Nome" para estilizar
                            const parts = item.match(/^(\d+x)\s(.*)/);
                            const qtd = parts ? parts[1] : '';
                            const nome = parts ? parts[2] : item;

                            return (
                                <li key={index} style={styles.listItem}>
                                    <span>{nome}</span>
                                    {qtd && <span style={styles.badge}>{qtd}</span>}
                                </li>
                            );
                        })}
                    </ul>
                )}

                <div style={{marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px solid #eee', textAlign: 'right'}}>
                    <strong>Total: </strong>
                    <span style={{fontSize: '1.2rem', color: '#27ae60'}}>
                        {venda.total ? Number(venda.total).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : 'R$ 0,00'}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default VendaDetalhesModal;