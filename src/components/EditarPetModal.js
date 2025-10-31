import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

const gerarOpcoesPeso = () => {
    const opcoes = [];
    for (let i = 0; i < 30; i += 2) {
        const optionValue = `${i} - ${i + 2} kg`;
        opcoes.push({ value: optionValue, label: optionValue });
    }
    opcoes.push({ value: 'Outro valor', label: 'Outro valor (digitar)' });
    return opcoes;
};
const pesoOptions = gerarOpcoesPeso();
const capitalizeAndCleanInput = (value) => {
    if (!value) return '';
    let cleanedValue = value.replace(/[^a-zA-Z\s]/g, '');
    return cleanedValue.replace(/(^|\s)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
};

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

const EditarPetModal = ({ pet, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        nome: '',
        tipo: '',
        raca: '',
        sexo_biologico: '',
        idade: '',
        observacoes: '',
    });

    const [pesoSelecionado, setPesoSelecionado] = useState('');
    const [pesoOutroValor, setPesoOutroValor] = useState('');
    const [mostrarInputPeso, setMostrarInputPeso] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (pet) {
            setFormData({
                nome: pet.nome || '',
                tipo: pet.tipo || '',
                raca: pet.raca || '',
                sexo_biologico: pet.sexo_biologico || '',
                idade: pet.idade || '',
                observacoes: pet.observacoes || '',
            });

            const petPeso = pet.peso;
            let foundOption = false;

            if (petPeso !== null && petPeso !== undefined) {
                const pesoStr = String(petPeso);
                for (const option of pesoOptions) {
                    if (option.value === 'Outro valor') continue;
                    const rangeStart = option.value.split(' ')[0]; // ex: "4"
                    if (rangeStart === pesoStr) {
                        setPesoSelecionado(option.value);
                        setMostrarInputPeso(false);
                        setPesoOutroValor('');
                        foundOption = true;
                        break;
                    }
                }

                if (!foundOption) {
                    setPesoSelecionado('Outro valor');
                    setMostrarInputPeso(true);
                    setPesoOutroValor(pesoStr);
                }
            } else {

                setPesoSelecionado('');
                setMostrarInputPeso(false);
                setPesoOutroValor('');
            }
        }
    }, [pet]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'nome' || name === 'raca') {
            setFormData(prev => ({ ...prev, [name]: capitalizeAndCleanInput(value) }));
        } else if (name === 'idade') {
            const digitsOnly = value.replace(/\D/g, '');
            setFormData(prev => ({ ...prev, [name]: digitsOnly }));
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
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validação da idade
        const idadeNum = parseInt(formData.idade);
        if (isNaN(idadeNum) || idadeNum < 0) { // Permite 0 anos (filhote)
            setError('A idade deve ser um número válido (0 ou mais).');
            setLoading(false);
            return;
        }

        //logica de peso
        let pesoFinal = null;
        if (mostrarInputPeso) {
            const pesoNum = parseFloat(pesoOutroValor);
            if (isNaN(pesoNum) || pesoNum < 0) {
                setError('O peso informado em "Outro valor" é inválido ou negativo.');
                setLoading(false);
                return;
            }
             if (pesoNum === 0 && mostrarInputPeso) {
                setError('O peso em "Outro valor" deve ser maior que zero.');
                setLoading(false);
                return;
             }
            pesoFinal = pesoNum;
        } else if (pesoSelecionado && pesoSelecionado !== 'Outro valor' && pesoSelecionado !== '') {
            try {
                // Pega o primeiro número da faixa
                pesoFinal = parseFloat(pesoSelecionado.split(' ')[0]);
            } catch {
                console.warn("Não foi possível extrair peso da faixa selecionada:", pesoSelecionado);
            }
        }

        const nomeFinal = formData.nome.trim().replace(/\s{2,}/g, ' ');
        const racaFinal = formData.raca.trim().replace(/\s{2,}/g, ' ');

        if (!nomeFinal || !racaFinal) {
             setError('Nome e Raça não podem consistir apenas de espaços ou caracteres inválidos.');
             setLoading(false);
             return;
        }

        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('userData'));
            const cargoId = userData?.cargo_id;
            const cargo = userData?.cargo?.toLowerCase();

            const isGestor = cargoId === 1 || cargo === 'gestor' || cargo === 'administrador';

            let endpoint;
            if (isGestor) {
                endpoint = `/admin/pets/${pet.id}`;
            } else {
                endpoint = `/pets/${pet.id}`;
            }

            // Dados que vao para o banco
            const dataToUpdate = {
                ...formData,
                nome: nomeFinal,
                raca: racaFinal,
                idade: idadeNum,
                peso: pesoFinal,
            };

            console.log('Enviando atualização para:', endpoint, dataToUpdate);

            const response = await axios.put(endpoint, dataToUpdate, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setSuccess('Pet atualizado com sucesso!');
            // Atualiza o pet na UI
            onUpdate(response.data);
        } catch (err) {
            console.error('Erro ao atualizar pet:', err);
            if (err.response?.status === 403) {
                setError('Acesso negado: ' + (err.response.data?.detail || 'Você não tem permissão para editar este pet.'));
            } else if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError(err.message || 'Erro ao atualizar pet. Verifique os dados e tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!pet) return null;

    return (
        <div className="modal-backdrop" style={modalBackdropStyle}>
            <div className="modal-content" style={modalContentStyle}>
                <button
                    onClick={onClose}
                    style={closeButtonStyle}
                    title="Fechar"
                >
                    ×
                </button>

                <h2 style={modalTitleStyle}>Editar Pet: {pet.nome}</h2>

                <div style={petInfoStyle}>
                    <p><strong>Dono:</strong> {pet.dono?.nome || 'N/A'}</p>
                    <p><strong>ID do Pet:</strong> {pet.id}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Linha 1: Nome e Tipo */}
                    <div style={formRowStyle}>
                        <div style={formGroupStyle}>
                            <label style={labelStyle} htmlFor="nome">Nome *</label>
                            <input
                                style={inputStyle}
                                type="text"
                                id="nome"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="Apenas letras e espaços"
                            />
                        </div>
                        <div style={formGroupStyle}>
                            <label style={labelStyle} htmlFor="tipo">Espécie (Tipo) *</label>
                            <select
                                style={inputStyle}
                                id="tipo"
                                name="tipo"
                                value={formData.tipo}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            >
                                <option value="">Selecione a espécie</option>
                                <option value="Cão">Cão</option>
                                <option value="Gato">Gato</option>
                            </select>
                        </div>
                    </div>

                    {/* raça e sexo biologico */}
                    <div style={formRowStyle}>
                        <div style={formGroupStyle}>
                            <label style={labelStyle} htmlFor="raca">Raça *</label>
                            <input
                                style={inputStyle}
                                type="text"
                                id="raca"
                                name="raca"
                                value={formData.raca}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="Apenas letras e espaços"
                            />
                        </div>
                        <div style={formGroupStyle}>
                            <label style={labelStyle} htmlFor="sexo_biologico">Sexo Biológico</label>
                            <select
                                style={inputStyle}
                                id="sexo_biologico"
                                name="sexo_biologico"
                                value={formData.sexo_biologico}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">Selecione</option>
                                <option value="Macho">Macho</option>
                                <option value="Fêmea">Fêmea</option>
                            </select>
                        </div>
                    </div>

                    {/* idade e peso */}
                    <div style={formRowStyle}>
                        <div style={formGroupStyle}>
                            <label style={labelStyle} htmlFor="idade">Idade (anos) *</label>
                            <input
                                style={inputStyle}
                                type="number"
                                id="idade"
                                name="idade"
                                value={formData.idade}
                                onChange={handleChange}
                                min="1"
                                max="50"
                                required
                                disabled={loading}
                                placeholder="Maior que 0"
                            />
                        </div>
                        <div style={formGroupStyle}>
                            <label style={labelStyle} htmlFor="pesoSelecionado">Peso (kg)</label>
                            <select
                                style={inputStyle}
                                id="pesoSelecionado"
                                name="pesoSelecionado"
                                value={pesoSelecionado}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">Selecione (Opcional)</option>
                                {pesoOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* input de peso no caso de outros valores */}
                    {mostrarInputPeso && (
                        <div style={{ ...formGroupStyle, marginBottom: '20px' }}>
                            <label style={labelStyle} htmlFor="pesoOutroValor">Digite o peso exato (kg):</label>
                            <input
                                style={inputStyle}
                                type="number"
                                step="0.1"
                                id="pesoOutroValor"
                                name="pesoOutroValor"
                                value={pesoOutroValor}
                                onChange={handleChange}
                                placeholder="Ex: 5.5"
                                inputMode="decimal"
                                required
                                disabled={loading}
                            />
                        </div>
                    )}

                    {/* observações */}
                    <div style={formGroupStyle}>
                        <label style={labelStyle} htmlFor="observacoes">Observações</label>
                        <textarea
                            style={{ ...inputStyle, minHeight: '80px' }}
                            id="observacoes"
                            name="observacoes"
                            value={formData.observacoes}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="Observações sobre o pet..."
                        />
                    </div>

                    {error && (
                        <div style={errorStyle}>
                            <strong>Erro:</strong> {error}
                        </div>
                    )}
                    {success && (
                        <div style={successStyle}>
                            <strong>Sucesso:</strong> {success}
                        </div>
                    )}

                    <div style={buttonGroupStyle}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={cancelButtonStyle}
                            disabled={loading}
                        >
                            {success ? 'Fechar' : 'Cancelar'}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...submitButtonStyle,
                                opacity: loading ? 0.6 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Estilos
const modalBackdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
};

const modalContentStyle = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
};

const closeButtonStyle = {
    position: 'absolute',
    top: '15px',
    right: '20px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6c757d',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
};

const modalTitleStyle = {
    borderBottom: '2px solid #4a9b8e',
    paddingBottom: '15px',
    marginBottom: '20px',
    color: '#2c3e50',
    textAlign: 'center',
    fontSize: '1.5rem',
    marginRight: '30px',
};

const petInfoStyle = {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    borderLeft: '4px solid #4a9b8e',
};

const formRowStyle = {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
};

const formGroupStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
};

const labelStyle = {
    marginBottom: '8px',
    fontWeight: '600',
    color: '#495057',
    fontSize: '14px',
};

const inputStyle = {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
};

const buttonGroupStyle = {
    marginTop: '30px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
};

const submitButtonStyle = {
    padding: '12px 24px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#28a745',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
};

const cancelButtonStyle = {
    padding: '12px 24px',
    borderRadius: '6px',
    border: '1px solid #6c757d',
    backgroundColor: '#f8f9fa',
    color: '#495057',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const errorStyle = {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '6px',
    padding: '15px',
    marginTop: '20px',
    marginBottom: '10px',
};

const successStyle = {
    color: '#155724',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '6px',
    padding: '15px',
    marginTop: '20px',
    marginBottom: '10px',
};

// Adicionar hover effects
Object.assign(submitButtonStyle, {
    ':hover': {
        backgroundColor: '#218838',
        transform: 'translateY(-1px)',
    }
});

Object.assign(cancelButtonStyle, {
    ':hover': {
        backgroundColor: '#e2e6ea',
        transform: 'translateY(-1px)',
    }
});

Object.assign(closeButtonStyle, {
    ':hover': {
        backgroundColor: '#f8f9fa',
        color: '#495057',
    }
});

Object.assign(inputStyle, {
    ':focus': {
        outline: 'none',
        borderColor: '#4a9b8e',
        boxShadow: '0 0 0 3px rgba(74, 155, 142, 0.1)',
    }
});

export default EditarPetModal;