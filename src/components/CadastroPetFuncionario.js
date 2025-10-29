import React, { useState } from 'react';
import axios from '../api/axios';

// Gera as opções de intervalo de peso
const gerarOpcoesPeso = () => {
    const opcoes = [];
    // REMOVIDA a linha que adicionava a opção vazia inicial
    // opcoes.push({ value: '', label: 'Selecione uma faixa ou Outro' });
    for (let i = 0; i < 30; i += 2) {
        const optionValue = `${i} - ${i + 2} kg`;
        opcoes.push({ value: optionValue, label: optionValue });
    }
    opcoes.push({ value: 'Outro valor', label: 'Outro valor (digitar)' });
    return opcoes;
};

function CadastroPetFuncionario({ clienteId, clienteNome, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        nome: '',
        tipo: 'Cão',
        raca: '',
        idade: '',
        sexo_biologico: '',
        observacoes: ''
    });
    // O estado inicial de pesoSelecionado agora é '', mas não haverá <option> com value=''
    const [pesoSelecionado, setPesoSelecionado] = useState('');
    const [pesoOutroValor, setPesoOutroValor] = useState('');
    const [mostrarInputPeso, setMostrarInputPeso] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const pesoOptions = gerarOpcoesPeso();

    // Remove caracteres não-letra (exceto espaço) e capitaliza o início das palavras.
    const capitalizeAndCleanInput = (value) => {
        if (!value) return '';
        let cleanedValue = value.replace(/[^a-zA-Z\s]/g, '');
        return cleanedValue.replace(/(^|\s)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'nome' || name === 'raca') {
            setFormData((prev) => ({
                ...prev,
                [name]: capitalizeAndCleanInput(value)
            }));
        } else if (name === 'idade') {
            const digitsOnly = value.replace(/\D/g, '');
            setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
        } else if (name === 'pesoSelecionado') {
            const selectedValue = value;
            setPesoSelecionado(selectedValue);
            if (selectedValue === 'Outro valor') {
                setMostrarInputPeso(true);
                setPesoOutroValor('');
            } else {
                setMostrarInputPeso(false);
                setPesoOutroValor('');
            }
        } else if (name === 'pesoOutroValor') {
            const numericValue = value
                .replace(/[^0-9.,]/g, '')
                .replace(',', '.');
             if (/^\d*\.?\d*$/.test(numericValue)) {
                 setPesoOutroValor(numericValue);
             }
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handler onKeyDown para o campo Idade
    const handleAgeKeyDown = (e) => {
        if ([46, 8, 9, 27, 13, 35, 36, 37, 39].includes(e.keyCode) ||
            (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
            (e.keyCode === 67 && (e.ctrlKey === true || e.metaKey === true)) ||
            (e.keyCode === 86 && (e.ctrlKey === true || e.metaKey === true)) ||
            (e.keyCode === 88 && (e.ctrlKey === true || e.metaKey === true))) {
                 return;
        }
        if (e.key.length === 1 && /\D/.test(e.key)) {
            e.preventDefault();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validação da idade
        const idadeNum = parseInt(formData.idade);
        if (isNaN(idadeNum) || idadeNum <= 0) {
            setError('A idade deve ser um número maior que zero.');
            setTimeout(() => setError(''), 3000);
            setLoading(false);
            return;
        }

        // Lógica de peso
        let pesoFinal = null;
        if (mostrarInputPeso) {
            const pesoNum = parseFloat(pesoOutroValor);
            if (isNaN(pesoNum) || pesoNum < 0) {
                setError('O peso informado em "Outro valor" é inválido ou negativo.');
                setTimeout(() => setError(''), 3000);
                setLoading(false);
                return;
            }
             if (pesoNum === 0 && mostrarInputPeso) {
                setError('O peso em "Outro valor" deve ser maior que zero.');
                setTimeout(() => setError(''), 3000);
                setLoading(false);
                return;
             }
            pesoFinal = pesoNum;
        } else if (pesoSelecionado && pesoSelecionado !== 'Outro valor' && pesoSelecionado !== '') {
            try {
                pesoFinal = parseFloat(pesoSelecionado.split(' ')[0]);
            } catch {
                console.warn("Não foi possível extrair peso da faixa selecionada:", pesoSelecionado);
            }
        }
        // Se pesoSelecionado for '', pesoFinal continua null (comportamento de campo opcional mantido)


        const nomeFinal = formData.nome.trim().replace(/\s{2,}/g, ' ');
        const racaFinal = formData.raca.trim().replace(/\s{2,}/g, ' ');

        if (!nomeFinal || !racaFinal) {
             setError('Nome e Raça não podem consistir apenas de espaços.');
             setTimeout(() => setError(''), 3000);
             setLoading(false);
             return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Você não está autenticado. Faça login novamente.');
                setTimeout(() => setError(''), 3000);
                setLoading(false);
                return;
            }

            const dadosParaEnviar = {
                ...formData,
                nome: nomeFinal,
                raca: racaFinal,
                idade: idadeNum,
                peso: pesoFinal,
                cliente_id: clienteId
            };

            await axios.post('/pets/funcionario', dadosParaEnviar, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(`Pet ${nomeFinal} cadastrado com sucesso para o cliente ${clienteNome}`);
            setTimeout(() => {
                setSuccess('');
                setFormData({
                    nome: '', tipo: 'Cão', raca: '', idade: '', sexo_biologico: '', observacoes: ''
                });
                setPesoSelecionado(''); // Reseta o select
                setPesoOutroValor('');
                setMostrarInputPeso(false);
                if (onSuccess) onSuccess();
            }, 3000);

        } catch (err) {
            let errorMessage = 'Erro ao cadastrar o pet.';
            if (err.response?.data?.detail) {
                if (Array.isArray(err.response.data.detail)) {
                    errorMessage = err.response.data.detail[0]?.msg || errorMessage;
                } else if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                }
            }
            setError(errorMessage);
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Cadastrar Novo Pet</h1>
                    <p>
                        Cadastrando pet para: <strong>{clienteNome}</strong>
                    </p>
                </div>

                {error && <div className="error-message fixed-top-right">{error}</div>}
                {success && <div className="success-message fixed-top-right">{success}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Campo Nome */}
                    <div className="form-group">
                        <label className="form-label">Nome *</label>
                        <input
                            type="text"
                            name="nome"
                            className="form-input"
                            value={formData.nome}
                            onChange={handleInputChange}
                            required
                            placeholder="Apenas letras e espaços"
                        />
                    </div>

                    {/* Campo Tipo */}
                    <div className="form-group">
                        <label className="form-label">Tipo *</label>
                        <select
                            name="tipo"
                            className="form-input"
                            value={formData.tipo}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="Cão">Cão</option>
                            <option value="Gato">Gato</option>
                        </select>
                    </div>

                    {/* Campo Raça */}
                    <div className="form-group">
                        <label className="form-label">Raça *</label>
                        <input
                            type="text"
                            name="raca"
                            className="form-input"
                            value={formData.raca}
                            onChange={handleInputChange}
                            required
                            placeholder="Apenas letras e espaços"
                        />
                    </div>

                    {/* Campo Idade */}
                    <div className="form-group">
                        <label className="form-label">Idade (anos) *</label>
                        <input
                            type="number"
                            name="idade"
                            className="form-input"
                            value={formData.idade}
                            onChange={handleInputChange}
                            onKeyDown={handleAgeKeyDown}
                            min="1"
                            required
                            placeholder="Maior que zero"
                        />
                    </div>

                    {/* Campo Peso <select> */}
                    <div className="form-group">
                        <label className="form-label">Peso (kg)</label>
                        <select
                            name="pesoSelecionado"
                            className="form-input"
                            value={pesoSelecionado}
                            onChange={handleInputChange}
                        >
                            {/* --- Opção inicial removida daqui --- */}
                            {/* Renderiza as opções geradas */}
                            {pesoOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Campo Peso Numérico (condicional) */}
                    {mostrarInputPeso && (
                        <div className="form-group">
                            <label className="form-label">Digite o peso exato (kg):</label>
                            <input
                                type="text"
                                name="pesoOutroValor"
                                className="form-input"
                                value={pesoOutroValor}
                                onChange={handleInputChange}
                                placeholder="Ex: 5.5 ou 5,5"
                                inputMode="decimal"
                                required
                            />
                        </div>
                    )}

                    {/* Campo Sexo */}
                    <div className="form-group">
                        <label className="form-label">Sexo *</label>
                        <select
                            name="sexo_biologico"
                            className="form-input"
                            value={formData.sexo_biologico}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Selecione</option>
                            <option value="Macho">Macho</option>
                            <option value="Fêmea">Fêmea</option>
                        </select>
                    </div>

                    {/* Campo Observações */}
                    <div className="form-group">
                        <label className="form-label">Observações (alergias, comportamento)</label>
                        <textarea
                            name="observacoes"
                            className="form-input"
                            value={formData.observacoes}
                            onChange={handleInputChange}
                            rows="3"
                            placeholder="Informe observações relevantes sobre o pet..."
                        ></textarea>
                    </div>

                    {/* Botões */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={onCancel}
                            disabled={loading}
                            style={{ padding: '0.75rem 1.5rem' }}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading} style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
                            {loading ? 'Cadastrando...' : 'Cadastrar Pet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CadastroPetFuncionario;