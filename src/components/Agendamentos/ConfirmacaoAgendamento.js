import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { publicInstance } from '../../api/axios'; // Use instância publica (sem token)

function ConfirmacaoAgendamento() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const acao = searchParams.get('acao'); // 'confirmar' ou 'cancelar'
    const navigate = useNavigate();

    const [status, setStatus] = useState('processando');
    const [mensagem, setMensagem] = useState('');

    useEffect(() => {
        const processarAcao = async () => {
            try {
                if (acao === 'confirmar') {
                    await publicInstance.post(`/agendamentos/${id}/confirmar`);
                    setStatus('sucesso');
                    setMensagem('Obrigado! Sua presença foi confirmada.');
                } else if (acao === 'cancelar') {
                    // Para cancelar, geralmente exigimos login por segurança,
                    // mas se for link direto do email, podemos permitir ou redirecionar para login.
                    // Aqui vamos assumir que precisa logar para cancelar
                    setMensagem('Para cancelar, por favor faça login no sistema.');
                    setStatus('redirecionar');
                    setTimeout(() => navigate('/login'), 3000);
                }
            } catch (error) {
                setStatus('erro');
                setMensagem('Ocorreu um erro ao processar sua solicitação.');
            }
        };

        if (id && acao) processarAcao();
    }, [id, acao, navigate]);

    const styles = {
        container: { textAlign: 'center', padding: '50px', fontFamily: 'Arial' },
        card: { maxWidth: '500px', margin: '0 auto', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '10px', background: 'white' },
        icon: { fontSize: '48px', marginBottom: '20px', display: 'block' },
        success: { color: '#27ae60' },
        error: { color: '#c0392b' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {status === 'processando' && <p>Processando...</p>}

                {status === 'sucesso' && (
                    <div style={styles.success}>
                        <span style={styles.icon}>✅</span>
                        <h2>Tudo certo!</h2>
                        <p>{mensagem}</p>
                    </div>
                )}

                {status === 'erro' && (
                    <div style={styles.error}>
                        <span style={styles.icon}>❌</span>
                        <h2>Ops!</h2>
                        <p>{mensagem}</p>
                    </div>
                )}

                {status === 'redirecionar' && <p>{mensagem}</p>}
            </div>
        </div>
    );
}

export default ConfirmacaoAgendamento;