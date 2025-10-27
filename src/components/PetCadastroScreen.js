import React, { useState } from 'react';
import axios from '../api/axios';

function PetCadastroScreen({ onNavigateToHome, cliente, onBack }) {
    const [formData, setFormData] = useState({ 
        nome: '', 
        especie: 'Cão', 
        raca: '', 
        idade: '', 
        peso: '', 
        sexo_biologico: '', 
        observacoes: '' 
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    //capitaliza primeira letra de cada palavra
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

        //validaçao de idade e peso negativos
        if (parseInt(formData.idade) < 0) {
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
                idade: parseInt(formData.idade),
                peso: formData.peso ? parseFloat(formData.peso) : null,
            };

            let url = '/pets';

            if (cliente) {
                // Se for cadastro por funcionário, usa a rota específica e adiciona o cliente_id
                url = '/pets/funcionario';
                dadosParaEnviar.cliente_id = cliente.id;
            }

            await axios.post(url, dadosParaEnviar, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setSuccess(`Pet '${formData.nome}' cadastrado com sucesso!`);
	            setTimeout(() => setSuccess(''), 3000);
            setFormData({ 
                nome: '', 
                especie: 'Cão', 
                raca: '', 
                idade: '', 
                peso: '', 
                sexo_biologico: '', 
                observacoes: '' 
            });
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao cadastrar o pet.');
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
	                        <label className="form-label">Espécie *</label>
	                        <select
	                            name="especie"
	                            className="form-input"
	                            value={formData.especie}
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
                        ></textarea>
                    </div>

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Cadastrando...' : 'Cadastrar Pet'}
                    </button>
                </form>
                <div className="login-footer">
                    <a href="#" onClick={(e) => { e.preventDefault(); cliente ? onBack() : onNavigateToHome(); }}>
                        Voltar {cliente ? `para o Perfil de ${cliente.nome}` : 'para o Início'}
                    </a>
                </div>
            </div>
        </div>
    );
}
export default PetCadastroScreen;
