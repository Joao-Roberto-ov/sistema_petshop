import React, { useState } from 'react';
import axios from '../../api/axios';

function PetCadastroScreen({ onNavigateToHome, cliente, onBack }) {
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

    // Capitaliza primeira letra de cada palavra
    const capitalizeName = (name) => {
        if (!name) return '';
        return name.toLowerCase().split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'nome') {
            setFormData({...formData, [name]: capitalizeName(value)});
        } else {
            setFormData({...formData, [name]: value});
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validação de idade e peso negativos
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
                setError("Você não está autenticado. Faça login novamente.");
                setTimeout(() => setError(''), 3000);
                setLoading(false);
                return;
            }

            const dadosParaEnviar = {
                ...formData,
                idade: parseInt(formData.idade), // Garante que é número
                peso: formData.peso ? parseFloat(formData.peso) : null, // Garante que é número ou null
            };

            let url = '/pets';

            // Verifica se está cadastrando como funcionário
            if (cliente) {
                url = '/pets/funcionario'; // Rota para funcionário cadastrar pet para cliente
                dadosParaEnviar.cliente_id = cliente.id; // Adiciona o ID do cliente
            }

            await axios.post(url, dadosParaEnviar, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setSuccess(`Pet '${formData.nome}' cadastrado com sucesso!`);
            setTimeout(() => setSuccess(''), 3000);
            setFormData({ // Limpa o formulário
                nome: '',
                tipo: 'Cão',
                raca: '',
                idade: '',
                peso: '',
                sexo_biologico: '',
                observacoes: ''
            });

        } catch (err) {
            let errorMessage = 'Erro ao cadastrar o pet.'; // Mensagem padrão
            if (err.response?.data?.detail) {
                if (Array.isArray(err.response.data.detail)) {
                    errorMessage = err.response.data.detail[0]?.msg || errorMessage;
                }
                else if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                }
            }
            setError(errorMessage); // Salva apenas a string da mensagem no estado
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
                    {/* Exibe o nome do cliente se estiver cadastrando como funcionário */}
                    <p>{cliente ? `Para o cliente: ${cliente.nome}` : 'Preencha as informações do seu companheiro.'}</p>
                </div>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
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
                        <input type="text" name="raca" className="form-input" value={formData.raca} onChange={handleInputChange} required />
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
                        <label className="form-label">Peso (kg) (Opcional)</label>
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
                        <label className="form-label">Observações (Alergias, Comportamento) (Opcional)</label>
                        <textarea
                            name="observacoes"
                            className="form-input"
                            value={formData.observacoes}
                            onChange={handleInputChange}
                            rows="4"
                            placeholder="Ex: Alérgico a frango, Ansioso com outros cães..."
                        ></textarea>
                    </div>

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Cadastrando...' : 'Cadastrar Pet'}
                    </button>
                </form>
                <div className="login-footer">
                    {/* O botão voltar navega de forma diferente dependendo se é cliente ou funcionário */}
                    <a href="#" onClick={(e) => { e.preventDefault(); cliente ? (onBack ? onBack() : onNavigateToHome()) : onNavigateToHome(); }}>
                        Voltar
                    </a>
                </div>
            </div>
        </div>
    );
}
export default PetCadastroScreen;