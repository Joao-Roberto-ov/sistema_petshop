import React, { useState } from 'react';
import axios from '../api/axios';

function CadastroPetFuncionario({ clienteId, clienteNome, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        nome: '',
        tipo: 'Cão',
        raca: '',
        idade: '',
        peso: '',
        sexo_biologico: '',
        observacoes: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Capitaliza a primeira letra de cada palavra
    const capitalizeName = (name) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .split(' ')
            .filter(word => word.trim() !== '')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: name === 'nome' ? capitalizeName(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // 🧩 Validações simples
        if (formData.idade && parseInt(formData.idade) < 0) {
setError('A idade não pode ser negativa.');
	            setTimeout(() => setError(''), 3000);
	            setLoading(false);
	            return;
        }

        if (formData.peso && parseFloat(formData.peso) < 0) {
setError('O peso não pode ser negativo.');
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
                idade: formData.idade ? parseInt(formData.idade) : null,
                peso: formData.peso ? parseFloat(formData.peso) : null,
                cliente_id: clienteId
            };

            await axios.post('/pets/funcionario', dadosParaEnviar, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(`Pet ${formData.nome} cadastrado com sucesso relacionado ao cliente ${clienteNome}`);
		            setTimeout(() => {
		                setSuccess('');
		                onSuccess?.(); // Chama o onSuccess após a mensagem desaparecer
		            }, 3000);
            setFormData({
                nome: '',
                tipo: 'Cão',
                raca: '',
                idade: '',
                peso: '',
                sexo_biologico: '',
                observacoes: ''
            });

            onSuccess?.(); // chamada opcional segura
        } catch (err) {
            const message =
                err.response?.data?.detail ||
                err.response?.data?.message ||
'Erro ao cadastrar o pet.';
	            setError(message);
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
                    <div className="form-group">
                        <label className="form-label">Nome *</label>
                        <input
                            type="text"
                            name="nome"
                            className="form-input"
                            value={formData.nome}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

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

                    <div className="form-group">
                        <label className="form-label">Raça *</label>
                        <input
                            type="text"
                            name="raca"
                            className="form-input"
                            value={formData.raca}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Idade (anos) *</label>
                        <input
                            type="number"
                            name="idade"
                            className="form-input"
                            value={formData.idade}
                            onChange={handleInputChange}
                            min="0"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Peso (kg)</label>
                        <input
                            type="number"
                            name="peso"
                            step="0.1"
                            className="form-input"
                            value={formData.peso}
                            onChange={handleInputChange}
                            min="0"
                        />
                    </div>

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

                    <div
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'flex-end'
                        }}
                    >
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Cadastrando...' : 'Cadastrar Pet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CadastroPetFuncionario;
