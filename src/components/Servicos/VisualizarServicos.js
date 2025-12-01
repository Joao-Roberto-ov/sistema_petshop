import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';

// Ícones SVG para os botões da tabela
const IconEdit = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const IconTrash = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3,6 5,6 21,6"></polyline>
        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

function VisualizarServicos({ onBack }) {
    const [servicos, setServicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        duracao: '',
        preco: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // Função para formatar preço em Real
    const formatarReal = (value) => {
        let numero = value.replace(/\D/g, '');
        numero = (Number(numero) / 100).toFixed(2);
        return numero.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // Função para converter minutos em horas e minutos (para exibição)
    const formatarDuracao = (minutos) => {
        const min = parseInt(minutos) || 0;
        if (min === 0) return '0 minutos';

        const horas = Math.floor(min / 60);
        const minutosRestantes = min % 60;

        if (horas === 0) {
            return `${minutosRestantes} minuto${minutosRestantes !== 1 ? 's' : ''}`;
        } else if (minutosRestantes === 0) {
            return `${horas} hora${horas !== 1 ? 's' : ''}`;
        } else {
            return `${horas} hora${horas !== 1 ? 's' : ''} e ${minutosRestantes} minuto${minutosRestantes !== 1 ? 's' : ''}`;
        }
    };

    useEffect(() => {
        fetchServicos();
    }, []);

    const fetchServicos = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('/servicos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const servicosOrdenados = response.data.sort((a, b) => a.id - b.id);
            setServicos(servicosOrdenados);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao buscar serviços.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'preco') {
            // Aplica máscara de Real
            const valorFormatado = formatarReal(value);
            setFormData(prev => ({ ...prev, [name]: valorFormatado }));
        } else if (name === 'duracao') {
            // Permite apenas números positivos
            const apenasNumeros = value.replace(/\D/g, '');
            setFormData(prev => ({ ...prev, [name]: apenasNumeros }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');
        setFormSuccess('');

        // Validações
        const duracaoNum = Number(formData.duracao);
        if (duracaoNum <= 0 || isNaN(duracaoNum)) {
            setFormError('A duração deve ser um número positivo maior que zero.');
            setFormLoading(false);
            return;
        }

        // Converte o preço formatado para número
        const precoLimpo = formData.preco.replace(/\./g, '').replace(',', '.');
        const precoNum = parseFloat(precoLimpo);

        if (precoNum <= 0 || isNaN(precoNum)) {
            setFormError('O preço deve ser um valor positivo maior que zero.');
            setFormLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const dadosParaEnviar = {
                nome: formData.nome || undefined,
                descricao: formData.descricao || undefined,
                duracao: duracaoNum,
                preco: precoNum
            };

            if (editingId) {
                await axios.put(`/servicos/${editingId}`, dadosParaEnviar, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFormSuccess(`Serviço '${formData.nome}' atualizado com sucesso!`);
            } else {
                await axios.post('/servicos', dadosParaEnviar, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFormSuccess(`Serviço '${formData.nome}' cadastrado com sucesso!`);
            }

            setFormData({ nome: '', descricao: '', duracao: '', preco: '' });
            setEditingId(null);
            setShowForm(false);
            fetchServicos();
        } catch (err) {
            let mensagemErro = 'Erro ao processar formulário.';
            if (err.response?.data?.detail) {
                mensagemErro = err.response.data.detail;
            }
            setFormError(mensagemErro);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditClick = (servico) => {
        setFormData({
            nome: servico.nome,
            descricao: servico.descricao || '',
            duracao: servico.duracao || '',
            preco: servico.preco ? servico.preco.toFixed(2).replace('.', ',') : ''
        });
        setEditingId(servico.id);
        setShowForm(true);
        setFormSuccess('');
        setFormError('');
    };

    const handleDeleteClick = async (servicoId) => {
        if (!window.confirm('Tem certeza que deseja deletar este serviço?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/servicos/${servicoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchServicos();
        } catch (err) {
            alert(err.response?.data?.detail || 'Erro ao deletar serviço.');
        }
    };

    if (loading) {
        return (
            <div className="login-container">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <h2>Carregando serviços...</h2>
                </div>
            </div>
        );
    }

    if (error && servicos.length === 0) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="error-message">{error}</div>
                    <button className="btn-submit" onClick={onBack}>Voltar</button>
                </div>
            </div>
        );
    }

    return (
        <>
            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">Gerenciar Serviços</h1>
                    <p className="animate-fade-in-up">
                        Visualize, edite e gerencie todos os serviços oferecidos pela clínica.
                    </p>
                    <div className="hero-buttons">
                        <button 
                            className="btn btn-outline-white hover-lift" 
                            onClick={() => {
                                setShowForm(!showForm);
                                if (!showForm) {
                                    setEditingId(null);
                                    setFormData({ nome: '', descricao: '', duracao: '', preco: '' });
                                    setFormError('');
                                    setFormSuccess('');
                                }
                            }}
                        >
                            {showForm ? '❌ Cancelar' : '➕ Cadastrar Novo Serviço'}
                        </button>
                        <button className="btn btn-outline-white hover-lift" onClick={onBack}>
                            ← Voltar
                        </button>
                    </div>
                </div>
            </section>

            {showForm && (
                <section className="section bg-light">
                    <div className="container">
                        <div className="login-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <div className="login-header">
                                <h2>{editingId ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}</h2>
                                <p>Preencha os dados abaixo</p>
                            </div>

                            {formError && <div className="error-message">{formError}</div>}
                            {formSuccess && <div className="success-message">{formSuccess}</div>}

                            <form onSubmit={handleFormSubmit}>
                                <div className="form-group">
                                    <label className="form-label">
                                        Nome do Serviço <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ex: Consulta Veterinária"
                                        value={formData.nome}
                                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Descrição</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Descrição do serviço (opcional)"
                                        value={formData.descricao}
                                        onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Duração (minutos) <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="duracao"
                                        className="form-input"
                                        placeholder="60"
                                        value={formData.duracao}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Preço <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="preco"
                                        className="form-input"
                                        placeholder="0,00"
                                        value={formData.preco}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn-submit"
                                    disabled={formLoading}
                                >
                                    {formLoading 
                                        ? (editingId ? 'Atualizando...' : 'Cadastrando...') 
                                        : (editingId ? 'Atualizar Serviço' : 'Cadastrar Serviço')
                                    }
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            )}

            <section className="section">
                <div className="container">
                    <div className="text-center" style={{marginBottom: '2rem'}}>
                        <h2 className="section-title">Serviços Cadastrados</h2>
                        <p className="section-description">
                            Total de {servicos.length} serviço{servicos.length !== 1 ? 's' : ''} cadastrado{servicos.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Tabela modernizada */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{
                                    background: 'linear-gradient(135deg, #4a9b8e 0%, #3d8b7e 100%)',
                                    color: 'white'
                                }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Nome</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Descrição</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Duração</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Preço</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '1rem' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {servicos.map((servico, index) => (
                                        <tr 
                                            key={servico.id} 
                                            style={{
                                                borderBottom: index === servicos.length - 1 ? 'none' : '1px solid #ecf0f1',
                                                transition: 'background 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ 
                                                padding: '1rem', 
                                                fontWeight: '600', 
                                                color: '#2c3e50' 
                                            }}>
                                                {servico.nome}
                                            </td>
                                            <td style={{ 
                                                padding: '1rem', 
                                                color: '#7f8c8d' 
                                            }}>
                                                {servico.descricao || '—'}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    background: '#e3f2fd',
                                                    color: '#1565c0',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500'
                                                }}>
                                                    {formatarDuracao(servico.duracao)}
                                                </span>
                                            </td>
                                            <td style={{ 
                                                padding: '1rem', 
                                                fontWeight: '600', 
                                                color: '#27ae60', 
                                                fontSize: '1.1rem' 
                                            }}>
                                                R$ {servico.preco.toFixed(2).replace('.', ',')}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button 
                                                        style={{
                                                            background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '0.5rem',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: '36px',
                                                            height: '36px'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.background = 'linear-gradient(135deg, #2980b9 0%, #1f5f8b 100%)';
                                                            e.target.style.transform = 'translateY(-1px)';
                                                            e.target.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
                                                            e.target.style.transform = 'translateY(0)';
                                                            e.target.style.boxShadow = 'none';
                                                        }}
                                                        onClick={() => handleEditClick(servico)}
                                                        title="Editar serviço"
                                                    >
                                                        <IconEdit />
                                                    </button>
                                                    <button 
                                                        style={{
                                                            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '0.5rem',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: '36px',
                                                            height: '36px'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.background = 'linear-gradient(135deg, #c0392b 0%, #922b21 100%)';
                                                            e.target.style.transform = 'translateY(-1px)';
                                                            e.target.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
                                                            e.target.style.transform = 'translateY(0)';
                                                            e.target.style.boxShadow = 'none';
                                                        }}
                                                        onClick={() => handleDeleteClick(servico.id)}
                                                        title="Deletar serviço"
                                                    >
                                                        <IconTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default VisualizarServicos;
