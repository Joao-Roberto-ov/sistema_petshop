import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import '../../App.css';

function ListarFuncionarios({ onNavigateToHome }) {
    const [funcionarios, setFuncionarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroAtivo, setFiltroAtivo] = useState('todos');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!token || !userData || (userData.cargo !== 'gestor' && userData.cargo !== 'ADMINISTRADOR')) {
            alert('Acesso negado. Apenas administradores podem acessar esta página.');
            if (onNavigateToHome) onNavigateToHome();
            return;
        }
        carregarFuncionarios();
    }, [onNavigateToHome]);

    const carregarFuncionarios = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('/funcionario/listar', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setFuncionarios(response.data.data || []);
        } catch (err) {
            console.error('Erro ao carregar funcionários:', err);
            setError('Erro ao carregar lista de funcionários.');
        } finally {
            setLoading(false);
        }
    };

    const funcionariosFiltrados = funcionarios.filter(funcionario => {
        const matchSearch = funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           funcionario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           funcionario.cargo_funcao.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchStatus = filtroAtivo === 'todos' || 
                           (filtroAtivo === 'ativo' && funcionario.is_ativo) ||
                           (filtroAtivo === 'inativo' && !funcionario.is_ativo);
        
        return matchSearch && matchStatus;
    });

    const formatarTelefone = (telefone) => {
        if (!telefone) return 'Não informado';
        const numeros = telefone.replace(/\D/g, '');
        if (numeros.length === 11) {
            return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (numeros.length === 10) {
            return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return telefone;
    };

    const formatarCPF = (cpf) => {
        if (!cpf) return 'Não informado';
        const numeros = cpf.replace(/\D/g, '');
        return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    const formatarHorario = (horario) => {
        if (!horario) return 'Não informado';
        return horario.substring(0, 5); 
    };

    const formatarData = (dataString) => {
        if (!dataString) return 'Não informado';
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    };

    if (loading) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="loading">Carregando funcionários...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card" style={{ maxWidth: '1200px', width: '95%' }}>
                <div className="login-header">
                    <h1>Funcionários Cadastrados</h1>
                    <p>Lista de todos os funcionários registrados no sistema</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* Filtros e Busca */}
                <div className="filters-container" style={{ marginBottom: '20px' }}>
                    <div className="form-row">
                        <div className="form-group">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Buscar por nome, email ou cargo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <select
                                className="form-input"
                                value={filtroAtivo}
                                onChange={(e) => setFiltroAtivo(e.target.value)}
                            >
                                <option value="todos">Todos os funcionários</option>
                                <option value="ativo">Apenas ativos</option>
                                <option value="inativo">Apenas inativos</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Estatísticas */}
                <div className="stats-container" style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
                    <div className="stat-card">
                        <strong>Total: {funcionarios.length}</strong>
                    </div>
                    <div className="stat-card">
                        <strong>Ativos: {funcionarios.filter(f => f.is_ativo).length}</strong>
                    </div>
                    <div className="stat-card">
                        <strong>Inativos: {funcionarios.filter(f => !f.is_ativo).length}</strong>
                    </div>
                    <div className="stat-card">
                        <strong>Filtrados: {funcionariosFiltrados.length}</strong>
                    </div>
                </div>

                {/* Lista de Funcionários */}
                {funcionariosFiltrados.length === 0 ? (
                    <div className="no-data">
                        {funcionarios.length === 0 ? 
                            'Nenhum funcionário cadastrado.' : 
                            'Nenhum funcionário encontrado com os filtros aplicados.'
                        }
                    </div>
                ) : (
                    <div className="funcionarios-grid">
                        {funcionariosFiltrados.map(funcionario => (
                            <div key={funcionario.id} className="funcionario-card">
                                <div className="funcionario-header">
                                    <h3>{funcionario.nome}</h3>
                                    <span className={`status-badge ${funcionario.is_ativo ? 'ativo' : 'inativo'}`}>
                                        {funcionario.is_ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                                
                                <div className="funcionario-info">
                                    <div className="info-row">
                                        <strong>Cargo/Função:</strong> {funcionario.cargo_funcao}
                                    </div>
                                    <div className="info-row">
                                        <strong>E-mail:</strong> {funcionario.email}
                                    </div>
                                    <div className="info-row">
                                        <strong>Telefone:</strong> {formatarTelefone(funcionario.telefone)}
                                    </div>
                                    {funcionario.cpf && (
                                        <div className="info-row">
                                            <strong>CPF:</strong> {formatarCPF(funcionario.cpf)}
                                        </div>
                                    )}
                                    {funcionario.endereco && funcionario.endereco !== 'Não informado' && (
                                        <div className="info-row">
                                            <strong>Endereço:</strong> {funcionario.endereco}
                                        </div>
                                    )}
                                    <div className="info-row">
                                        <strong>Horário:</strong> {formatarHorario(funcionario.horario_inicio)} às {formatarHorario(funcionario.horario_fim)}
                                    </div>
                                    <div className="info-row">
                                        <strong>Dias de trabalho:</strong> {funcionario.dias_trabalho}
                                    </div>
                                    <div className="info-row">
                                        <strong>Cadastrado em:</strong> {formatarData(funcionario.data_cadastro)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="actions-container" style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button 
                        className="btn-secondary"
                        onClick={carregarFuncionarios}
                        style={{ marginRight: '10px' }}
                    >
                        Atualizar Lista
                    </button>
                    
                    {onNavigateToHome && (
                        <button 
                            className="btn-primary"
                            onClick={onNavigateToHome}
                        >
                            Voltar ao Início
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ListarFuncionarios;
