import React, { useState, useEffect, useMemo } from 'react';
import axios, { 
    obterRelatorioProdutosMaisVendidos, exportarRelatorioProdutosCSV, exportarRelatorioProdutosPDF,
    obterRelatorioServicosMaisSolicitados, exportarRelatorioServicosCSV, exportarRelatorioServicosPDF
} from '../../api/axios';
import VendaDetalhesModal from '../Vendas/VendaDetalhesModal';
import './Dashboard.css';
import './DashboardGestor.css';

// Ícone de Olho (para ver itens)
const IconEye = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const formatarValor = (valor) => {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatarDataHora = (isoString) => {
    if (!isoString) return '-';
    const data = new Date(isoString);
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
    });
};

const getDataLimite = (filtro) => {
    const agora = new Date();
    const dataLimite = new Date();

    switch (filtro) {
        case '7dias':
            dataLimite.setDate(agora.getDate() + 7);
            return { inicio: agora, fim: dataLimite };
        case '14dias':
            dataLimite.setDate(agora.getDate() + 14);
            return { inicio: agora, fim: dataLimite };
        case 'mes':
            const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
            const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
            return { inicio: inicioMes, fim: fimMes };
        case 'todos':
        default:
            return { inicio: null, fim: null };
    }
};

const getStatusClass = (status) => {
    if (!status) return 'desconhecido';
    
    const statusNormalizado = status.toLowerCase().trim();
    
    if (statusNormalizado === 'c/ ausência' || statusNormalizado === 'c/ ausencia') {
        return 'c-ausencia';
    }
    if (statusNormalizado === 'agendado') {
        return 'agendado';
    }
    if (statusNormalizado === 'cancelado') {
        return 'cancelado';
    }
    if (statusNormalizado === 'realizado') {
        return 'realizado';
    }
    if (statusNormalizado === 'pago') {
        return 'pago';
    }
    if (statusNormalizado === 'pendente') {
        return 'pendente';
    }
    
    return statusNormalizado.replace(/[\s/]/g, '-');
};

function DashboardGestor({ userData, onLogout, onNavigateToHome }) {
    // --- Estados para o Relatório de Produtos Mais Vendidos ---
    const [relatorioProdutos, setRelatorioProdutos] = useState([]);
    const [dataInicioRelatorio, setDataInicioRelatorio] = useState('');
    const [dataFimRelatorio, setDataFimRelatorio] = useState('');
    const [loadingRelatorio, setLoadingRelatorio] = useState(false);
    const [erroRelatorio, setErroRelatorio] = useState('');
    const [ultimaAtualizacao, setUltimaAtualizacao] = useState('');

    // --- Estados para o Relatório de Serviços Mais Solicitados ---
    const [relatorioServicos, setRelatorioServicos] = useState([]);
    const [loadingServicos, setLoadingServicos] = useState(false);
    const [erroServicos, setErroServicos] = useState('');
    const [ultimaAtualizacaoServicos, setUltimaAtualizacaoServicos] = useState('');
    const [filtroStatusServicos, setFiltroStatusServicos] = useState('todos');

    // --- Funções Auxiliares ---
    const formatarDataParaInput = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const dLocal = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
        const month = '' + (dLocal.getMonth() + 1);
        const day = '' + dLocal.getDate();
        const year = dLocal.getFullYear();

        return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
    };

    const carregarRelatorioProdutos = async (inicio, fim) => {
        if (!inicio || !fim) {
            setErroRelatorio('Selecione as datas de início e fim.');
            setRelatorioProdutos([]);
            return;
        }
        
        setLoadingRelatorio(true);
        setErroRelatorio('');
        
        try {
            const data = await obterRelatorioProdutosMaisVendidos(inicio, fim);
            setRelatorioProdutos(data);
            setUltimaAtualizacao(new Date().toLocaleTimeString('pt-BR'));
            
            const totalPedidos = data.reduce((sum, item) => sum + (item.total_pedidos || 0), 0);
            const totalUnidades = data.reduce((sum, item) => sum + (item.quantidade_vendida || 0), 0);
            
        } catch (err) {
            console.error(" Erro ao carregar relatório de produtos:", err);
            setErroRelatorio('Erro ao carregar o relatório. Verifique o console para detalhes.');
            setRelatorioProdutos([]);
        } finally {
            setLoadingRelatorio(false);
        }
    };

    const carregarRelatorioServicos = async (inicio, fim, statusFiltro = filtroStatusServicos) => {
        if (!inicio || !fim) {
            setErroServicos('Selecione as datas de início e fim.');
            setRelatorioServicos([]);
            return;
        }
        
        setLoadingServicos(true);
        setErroServicos('');
        
        try {
            // Adiciona o filtro de status na chamada da API
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                data_inicio: inicio,
                data_fim: fim
            });
            
            if (statusFiltro && statusFiltro !== 'todos') {
                // Mapeia os valores do frontend para o backend
                let filtroBackend = statusFiltro;
                if (statusFiltro === 'com ausencia') {
                    filtroBackend = 'C/ Ausência';
                } else if (statusFiltro === 'agendados') {
                    filtroBackend = 'Agendado';
                } else if (statusFiltro === 'cancelados') {
                    filtroBackend = 'Cancelado';
                }
                params.append('filtro_status', filtroBackend);
            }
            
            const response = await axios.get(`/vendas/relatorio/servicos-mais-solicitados?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setRelatorioServicos(response.data);
            setUltimaAtualizacaoServicos(new Date().toLocaleTimeString('pt-BR'));
            
            
        } catch (err) {
            console.error(" Erro ao carregar relatório de serviços:", err);
            setErroServicos('Erro ao carregar o relatório. Verifique o console para detalhes.');
            setRelatorioServicos([]);
        } finally {
            setLoadingServicos(false);
        }
    };

    // --- Lógica de Exportação ---
    const handleExportacaoProdutos = async (formato) => {
        if (!dataInicioRelatorio || !dataFimRelatorio) {
            alert("Selecione as datas de início e fim para exportar.");
            return;
        }

        setLoadingRelatorio(true);
        setErroRelatorio('');
        try {
            let response;
            let filename = `relatorio_produtos_${dataInicioRelatorio}_${dataFimRelatorio}`;

            if (formato === 'csv') {
                response = await exportarRelatorioProdutosCSV(dataInicioRelatorio, dataFimRelatorio);
                filename += '.csv';
            } else if (formato === 'pdf') {
                response = await exportarRelatorioProdutosPDF(dataInicioRelatorio, dataFimRelatorio);
                filename += '.pdf';
            } else {
                throw new Error("Formato de exportação inválido.");
            }

            // Criar URL para download
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error(`❌ Erro ao exportar ${formato} para produtos:`, err);
            alert(`Erro ao exportar o relatório de produtos para ${formato}. Verifique o console.`);
        } finally {
            setLoadingRelatorio(false);
        }
    };

    const handleExportacaoServicos = async (formato) => {
        if (!dataInicioRelatorio || !dataFimRelatorio) {
            alert("Selecione as datas de início e fim para exportar.");
            return;
        }

        setLoadingServicos(true);
        setErroServicos('');
        try {
            let response;
            let filename = `relatorio_servicos_${dataInicioRelatorio}_${dataFimRelatorio}_${filtroStatusServicos}`;

            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                data_inicio: dataInicioRelatorio,
                data_fim: dataFimRelatorio
            });
            
            if (filtroStatusServicos && filtroStatusServicos !== 'todos') {
                // Mapeia os valores do frontend para o backend
                let filtroBackend = filtroStatusServicos;
                if (filtroStatusServicos === 'com ausencia') {
                    filtroBackend = 'C/ Ausência';
                } else if (filtroStatusServicos === 'agendados') {
                    filtroBackend = 'Agendado';
                } else if (filtroStatusServicos === 'cancelados') {
                    filtroBackend = 'Cancelado';
                }
                params.append('filtro_status', filtroBackend);
            }

            if (formato === 'csv') {
                response = await axios.get(`/vendas/relatorio/servicos-mais-solicitados/csv?${params}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    responseType: 'blob'
                });
                filename += '.csv';
            } else if (formato === 'pdf') {
                response = await axios.get(`/vendas/relatorio/servicos-mais-solicitados/pdf?${params}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    responseType: 'blob'
                });
                filename += '.pdf';
            } else {
                throw new Error("Formato de exportação inválido.");
            }

            // Criar URL para download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error(`❌ Erro ao exportar ${formato} para serviços:`, err);
            alert(`Erro ao exportar o relatório de serviços para ${formato}. Verifique o console.`);
        } finally {
            setLoadingServicos(false);
        }
    };

    // --- Efeito para carregar o relatório inicial (Mês Atual) ---
    useEffect(() => {
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

        const inicioFormatado = formatarDataParaInput(inicioMes);
        const fimFormatado = formatarDataParaInput(fimMes);

        setDataInicioRelatorio(inicioFormatado);
        setDataFimRelatorio(fimFormatado);
        carregarRelatorioProdutos(inicioFormatado, fimFormatado);
        carregarRelatorioServicos(inicioFormatado, fimFormatado);
    }, []);

    // --- Função para recarregar os relatórios ---
    const recarregarRelatorioProdutos = () => {
        if (dataInicioRelatorio && dataFimRelatorio) {
            carregarRelatorioProdutos(dataInicioRelatorio, dataFimRelatorio);
        }
    };

    const recarregarRelatorioServicos = () => {
        if (dataInicioRelatorio && dataFimRelatorio) {
            carregarRelatorioServicos(dataInicioRelatorio, dataFimRelatorio);
        }
    };

    const [todosAgendamentos, setTodosAgendamentos] = useState([]);
    const [todasVendas, setTodasVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filtroTempo, setFiltroTempo] = useState('mes');
    const [filtroStatusAgendamento, setFiltroStatusAgendamento] = useState('todos');
    const [filtroStatusVenda, setFiltroStatusVenda] = useState('todos');
    const [filtroBuscaVendas, setFiltroBuscaVendas] = useState('');

    const [vendaSelecionada, setVendaSelecionada] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                if (!token) { throw new Error("Token não encontrado."); }

                const [respAgendamentos, respVendas] = await Promise.all([
                    axios.get('/agendamentos/todos-gestor', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    axios.get('/vendas/', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const agendamentosOrdenados = (respAgendamentos.data || []).sort((a, b) =>
                    new Date(b.data_hora_inicio) - new Date(a.data_hora_inicio)
                );
                setTodosAgendamentos(agendamentosOrdenados);

                const vendasOrdenadas = (respVendas.data || []).sort((a, b) =>
                    new Date(b.criado_em) - new Date(a.criado_em)
                );
                setTodasVendas(vendasOrdenadas);

            

            } catch (err) {
                console.error(" Erro ao buscar dados do gestor:", err);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    setError('Sessão expirada ou acesso negado. Faça login novamente.');
                    onLogout();
                } else if (err.message === "Token não encontrado.") {
                    setError('Sessão inválida. Faça login novamente.');
                    onLogout();
                } else {
                    setError('Erro ao carregar os dados.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [onLogout]);

    const { 
        agendamentosFiltrados, 
        totalPrevisto, 
        totalServicosRealizados,
        contadoresStatus 
    } = useMemo(() => {
        const agora = new Date();
        const { inicio, fim } = getDataLimite(filtroTempo);

        let filtrados = todosAgendamentos;

        if (inicio && fim) {
            const inicioAjustado = filtroTempo === 'mes' ? inicio : new Date(inicio.setHours(0, 0, 0, 0));
            const fimAjustado = new Date(fim.setHours(23, 59, 59, 999));

            filtrados = todosAgendamentos.filter(ag => {
                const dataAg = new Date(ag.data_hora_inicio);
                return dataAg >= inicioAjustado && dataAg <= fimAjustado;
            });
        }

        if (filtroStatusAgendamento !== 'todos') {
            filtrados = filtrados.filter(ag => ag.status.toLowerCase() === filtroStatusAgendamento.toLowerCase());
        }

        let previsto = 0;
        let realizado = 0;
        
        // Contadores por status
        const contadores = {
            agendado: 0,
            'c/ ausência': 0,
            cancelado: 0,
            realizado: 0,
            outros: 0
        };

        const agendamentosParaCalculo = (inicio && fim)
            ? todosAgendamentos.filter(ag => {
                const dataAg = new Date(ag.data_hora_inicio);
                const inicioAjustado = filtroTempo === 'mes' ? inicio : new Date(inicio.setHours(0, 0, 0, 0));
                const fimAjustado = new Date(fim.setHours(23, 59, 59, 999));
                return dataAg >= inicioAjustado && dataAg <= fimAjustado;
            })
            : todosAgendamentos;

        agendamentosParaCalculo.forEach(ag => {
            const dataAg = new Date(ag.data_hora_inicio);
            const status = ag.status.toLowerCase();
            
            // Contagem por status
            if (status === 'agendado') {
                contadores.agendado++;
                if (dataAg > agora) {
                    previsto += ag.servico_preco || 0;
                }
            } else if (status === 'c/ ausência' || status === 'c/ ausencia') {
                contadores['c/ ausência']++;
                // "C/ Ausência" NÃO conta como previsto
            } else if (status === 'cancelado') {
                contadores.cancelado++;
                // Cancelado não conta
            } else if (status === 'realizado') {
                contadores.realizado++;
                realizado += ag.servico_preco || 0;
            } else {
                contadores.outros++;
            }
        });


        return { 
            agendamentosFiltrados: filtrados, 
            totalPrevisto: previsto, 
            totalServicosRealizados: realizado,
            contadoresStatus: contadores
        };

    }, [todosAgendamentos, filtroTempo, filtroStatusAgendamento]);

    // useMemo para Vendas
    const { vendasFiltradas, totalVendasPagas } = useMemo(() => {
        const { inicio, fim } = getDataLimite(filtroTempo);

        let vendasParaCalculo = todasVendas;

        if (inicio && fim) {
            const inicioAjustado = filtroTempo === 'mes' ? inicio : new Date(inicio.setHours(0, 0, 0, 0));
            const fimAjustado = new Date(fim.setHours(23, 59, 59, 999));

            vendasParaCalculo = todasVendas.filter(v => {
                const dataVenda = new Date(v.criado_em);
                return dataVenda >= inicioAjustado && dataVenda <= fimAjustado;
            });
        }

        const totalPagas = vendasParaCalculo
            .filter(v => v.status_pagamento && v.status_pagamento.toLowerCase() === 'pago')
            .reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);

        const filtradas = vendasParaCalculo.filter(v => {
            if (filtroStatusVenda !== 'todos' && v.status_pagamento.toLowerCase() !== filtroStatusVenda.toLowerCase()) {
                return false;
            }
            if (filtroBuscaVendas) {
                const f = filtroBuscaVendas.toLowerCase();
                return (
                    (v.cliente_nome && v.cliente_nome.toLowerCase().includes(f)) ||
                    (v.funcionario_nome && v.funcionario_nome.toLowerCase().includes(f)) ||
                    (v.forma_pagamento && v.forma_pagamento.toLowerCase().includes(f))
                );
            }
            return true;
        });

        return { vendasFiltradas: filtradas, totalVendasPagas: totalPagas };

    }, [todasVendas, filtroTempo, filtroStatusVenda, filtroBuscaVendas]);

    if (loading) {
        return <div className="loading-message">Carregando Dashboard do Gestor...</div>;
    }

    if (error && !loading) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="dashboard-container">
            {/* Modal de Detalhes da Venda */}
            <VendaDetalhesModal
                venda={vendaSelecionada}
                onClose={() => setVendaSelecionada(null)}
            />

            <div className="dashboard-gestor-header">
                <h1>Painel do Gestor</h1>
                <p>Visão geral dos agendamentos e performance.</p>
            </div>

            <div className="summary-cards">
                <div className="card card-previsto">
                    <h3>Serviços Previstos ({filtroTempo})</h3>
                    <p>{formatarValor(totalPrevisto)}</p>
                    <span>Apenas agendados futuros: {contadoresStatus?.agendado || 0}</span>
                </div>
                <div className="card card-realizado">
                    <h3>Serviços Concluídos ({filtroTempo})</h3>
                    <p>{formatarValor(totalServicosRealizados)}</p>
                    <span>Status: Realizado ({contadoresStatus?.realizado || 0})</span>
                </div>
                <div className="card card-realizado" style={{ borderColor: '#28a745' }}>
                    <h3>Vendas Pagas ({filtroTempo})</h3>
                    <p>{formatarValor(totalVendasPagas)}</p>
                    <span>Checkout + Balcão (status Pago)</span>
                </div>
                <div className="card card-total-agendamentos">
                    <h3>Total Agendamentos ({filtroTempo})</h3>
                    <p>{agendamentosFiltrados.length}</p>
                    <span>
                        Agendados: {contadoresStatus?.agendado || 0} | 
                        C/ Ausência: {contadoresStatus?.['c/ ausência'] || 0} |
                        Cancelados: {contadoresStatus?.cancelado || 0}
                    </span>
                </div>
            </div>

            {/* BOTÕES DE RELATÓRIOS - UM DO LADO DO OUTRO */}
            <div className="buttons-container" style={{ 
                display: 'flex', 
                gap: '1rem', 
                margin: '2rem 0',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                <button
                    className="btn-fluxo-caixa"
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'fluxo-caixa-report' }))}
                    style={{ flex: '1', minWidth: '250px', maxWidth: '300px' }}
                >
                    📊 Relatório de Fluxo de Caixa
                </button>
                <button
                    className="btn-relatorio-produtos"
                    onClick={() => {
                        document.getElementById('relatorio-produtos-mais-vendidos').scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{ flex: '1', minWidth: '250px', maxWidth: '300px' }}
                >
                    📈 Produtos Mais Vendidos
                </button>
                <button
                    className="btn-relatorio-servicos"
                    onClick={() => {
                        document.getElementById('relatorio-servicos-mais-solicitados').scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{ flex: '1', minWidth: '250px', maxWidth: '300px' }}
                >
                    🛁 Serviços Mais Solicitados
                </button>
            </div>

            <div className="table-filters">
                <div>
                    <label>Período (Geral):</label>
                    <select value={filtroTempo} onChange={(e) => setFiltroTempo(e.target.value)}>
                        <option value="7dias">Próximos 7 dias</option>
                        <option value="14dias">Próximos 14 dias</option>
                        <option value="mes">Mês Atual</option>
                        <option value="todos">Todos</option>
                    </select>
                </div>
            </div>

            {/* Tabela de Agendamentos */}
            <main className="dashboard-main" style={{ marginTop: '2rem' }}>
                <h2>Lista de Agendamentos ({filtroTempo})</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table className="agendamentos-table gestor-table">
                        <thead>
                            <tr>
                                <th>Data / Hora</th>
                                <th>Cliente</th>
                                <th>Pet</th>
                                <th>Serviço</th>
                                <th>Funcionário</th>
                                <th>Valor (R$)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agendamentosFiltrados.map(ag => (
                                <tr key={ag.id} className={`status-${getStatusClass(ag.status)}`}>
                                    <td className="agendamento-data">{formatarDataHora(ag.data_hora_inicio)}</td>
                                    <td>{ag.cliente_nome}</td>
                                    <td>{ag.pet_nome}</td>
                                    <td className="agendamento-servico">{ag.servico_nome}</td>
                                    <td>{ag.funcionario_nome || <span style={{ fontStyle: 'italic', color: '#888' }}>N/A</span>}</td>
                                    <td className="agendamento-valor">{formatarValor(ag.servico_preco)}</td>
                                    <td><span className={`agendamento-status ${getStatusClass(ag.status)}`}>{ag.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Tabela de Vendas */}
            <main className="dashboard-main" style={{ marginTop: '2rem' }}>
                <h2>Lista de Vendas e Compras ({filtroTempo})</h2>

                <div className="table-filters" style={{ maxWidth: '800px', display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ flex: '2 1 300px' }}>
                        <label>Buscar Vendas:</label>
                        <input
                            type="text"
                            placeholder="Cliente, funcionário, pgto..."
                            className="form-input"
                            value={filtroBuscaVendas}
                            onChange={(e) => setFiltroBuscaVendas(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <label>Status Venda:</label>
                        <select
                            value={filtroStatusVenda}
                            onChange={(e) => setFiltroStatusVenda(e.target.value)}
                            style={{ width: '100%' }}
                            className="form-input"
                        >
                            <option value="todos">Todos</option>
                            <option value="pago">Pago</option>
                            <option value="pendente">Pendente</option>
                        </select>
                    </div>
                </div>

                {vendasFiltradas.length === 0 ? (
                    <div className="no-agendamentos">
                        <p>Nenhuma venda encontrada para os filtros selecionados.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="agendamentos-table gestor-table">
                            <thead>
                                <tr>
                                    <th>Data / Hora</th>
                                    <th>Cliente</th>
                                    <th>Atendente (Balcão)</th>
                                    <th style={{ textAlign: 'center' }}>Itens</th>
                                    <th>Forma Pgto.</th>
                                    <th>Total (R$)</th>
                                    <th>Status Pgto.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendasFiltradas.map(v => (
                                    <tr key={v.id} className={`status-${getStatusClass(v.status_pagamento)}`}>
                                        <td className="agendamento-data">
                                            {formatarDataHora(v.criado_em)}
                                        </td>
                                        <td>{v.cliente_nome}</td>
                                        <td>{v.funcionario_nome}</td>

                                        {/* Botão de Itens */}
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                className="action-btn"
                                                style={{ background: '#f3f4f6', color: '#555', margin: '0 auto' }}
                                                onClick={() => setVendaSelecionada(v)}
                                                title="Ver itens"
                                            >
                                                <IconEye />
                                            </button>
                                        </td>

                                        <td>{v.forma_pagamento}</td>
                                        <td className="agendamento-valor">{formatarValor(v.total)}</td>
                                        <td>
                                            <span className={`agendamento-status ${getStatusClass(v.status_pagamento)}`}>
                                                {v.status_pagamento}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* --- Relatório de Produtos Mais Vendidos --- */}
            <section id="relatorio-produtos-mais-vendidos" className="dashboard-main" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>📈 Relatório de Produtos Mais Vendidos</h2>
                </div>
                
                <p>Selecione o período para gerar o relatório dos produtos mais vendidos por quantidade e receita.</p>
                
                {ultimaAtualizacao && (
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                        Última atualização: {ultimaAtualizacao}
                    </div>
                )}

                <div className="table-filters" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="data-inicio-relatorio">Data Início:</label>
                    <input
                        type="date"
                        id="data-inicio-relatorio"
                        value={dataInicioRelatorio}
                        onChange={(e) => setDataInicioRelatorio(e.target.value)}
                    />
                    <label htmlFor="data-fim-relatorio" style={{ marginLeft: '1rem' }}>Data Fim:</label>
                    <input
                        type="date"
                        id="data-fim-relatorio"
                        value={dataFimRelatorio}
                        onChange={(e) => setDataFimRelatorio(e.target.value)}
                    />
                    <button
                        className="btn-action-primary"
                        style={{ marginLeft: '1rem' }}
                        onClick={() => carregarRelatorioProdutos(dataInicioRelatorio, dataFimRelatorio)}
                        disabled={loadingRelatorio || !dataInicioRelatorio || !dataFimRelatorio}
                    >
                        {loadingRelatorio ? '🔄 Carregando...' : '📊 Gerar Relatório'}
                    </button>
                </div>

                {erroRelatorio && (
                    <div className="error-message">
                        {erroRelatorio}
                        <button 
                            onClick={recarregarRelatorioProdutos}
                            style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                        >
                            Tentar Novamente
                        </button>
                    </div>
                )}

                {relatorioProdutos.length > 0 && (
                    <>
                        <div className="export-buttons">
                            <button
                                className="btn-export"
                                onClick={() => handleExportacaoProdutos('csv')}
                                disabled={loadingRelatorio}
                            >
                                📥 Exportar CSV
                            </button>
                            <button
                                className="btn-export"
                                onClick={() => handleExportacaoProdutos('pdf')}
                                disabled={loadingRelatorio}
                            >
                                📥 Exportar PDF
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="agendamentos-table gestor-table">
                                <thead>
                                    <tr>
                                        <th>Produto</th>
                                        <th>Categoria</th>
                                        <th>Quantidade Vendida</th>
                                        <th>Total de Pedidos</th>
                                        <th>Receita Gerada</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {relatorioProdutos.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.nome_produto}</td>
                                            <td>{item.categoria}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                {item.quantidade_vendida}
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#2563eb', fontWeight: 'bold' }}>
                                                {item.total_pedidos || 'N/A'}
                                            </td>
                                            <td className="agendamento-valor">
                                                {formatarValor(item.receita_gerada)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                            Total de produtos no relatório: <strong>{relatorioProdutos.length}</strong> | 
                            Total de pedidos: <strong>{relatorioProdutos.reduce((sum, item) => sum + (item.total_pedidos || 0), 0)}</strong> | 
                            Total de unidades vendidas: <strong>{relatorioProdutos.reduce((sum, item) => sum + (item.quantidade_vendida || 0), 0)}</strong>
                        </div>
                    </>
                )}
                
                {relatorioProdutos.length === 0 && !loadingRelatorio && !erroRelatorio && (
                    <div className="no-agendamentos">
                        <p>Nenhum produto vendido encontrado no período selecionado.</p>
                        <button 
                            className="btn-action-primary"
                            onClick={() => carregarRelatorioProdutos(dataInicioRelatorio, dataFimRelatorio)}
                        >
                            Tentar Novamente
                        </button>
                    </div>
                )}
            </section>

        {/* --- Relatório de Serviços Mais Solicitados --- */}
        <section id="relatorio-servicos-mais-solicitados" className="dashboard-main" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>🛁 Relatório de Serviços Mais Solicitados</h2>
            </div>
            
            <p>Selecione o período para gerar o relatório dos serviços mais solicitados por número de execuções e faturamento.</p>
            
            {ultimaAtualizacaoServicos && (
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                    Última atualização: {ultimaAtualizacaoServicos}
                </div>
            )}

            <div className="table-filters" style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label htmlFor="data-inicio-servicos" style={{ whiteSpace: 'nowrap' }}>Data Início:</label>
                    <input
                        type="date"
                        id="data-inicio-servicos"
                        value={dataInicioRelatorio}
                        onChange={(e) => setDataInicioRelatorio(e.target.value)}
                        style={{ minWidth: '140px' }}
                    />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label htmlFor="data-fim-servicos" style={{ whiteSpace: 'nowrap' }}>Data Fim:</label>
                    <input
                        type="date"
                        id="data-fim-servicos"
                        value={dataFimRelatorio}
                        onChange={(e) => setDataFimRelatorio(e.target.value)}
                        style={{ minWidth: '140px' }}
                    />
                </div>
                
                {/* Seletor de Status e Botão lado a lado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
                    <label htmlFor="filtro-status-servicos" style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Status:</label>
                    <select
                        id="filtro-status-servicos"
                        value={filtroStatusServicos}
                        onChange={(e) => setFiltroStatusServicos(e.target.value)}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="todos">Todos</option>
                        <option value="agendados">Agendados</option>
                        <option value="com ausencia">C/ Ausência</option>
                        <option value="cancelados">Cancelados</option>
                    </select>
                    
                    <button
                        className="btn-action-primary"
                        onClick={() => carregarRelatorioServicos(dataInicioRelatorio, dataFimRelatorio)}
                        disabled={loadingServicos || !dataInicioRelatorio || !dataFimRelatorio}
                        style={{ whiteSpace: 'nowrap', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                        {loadingServicos ? '🔄 Carregando...' : '📊 Gerar Relatório'}
                    </button>
                </div>
            </div>

            {erroServicos && (
                <div className="error-message">
                    {erroServicos}
                    <button 
                        onClick={recarregarRelatorioServicos}
                        style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                        Tentar Novamente
                    </button>
                </div>
            )}

            {relatorioServicos.length > 0 && (
                <>
                    <div className="export-buttons">
                        <button
                            className="btn-export"
                            onClick={() => handleExportacaoServicos('csv')}
                            disabled={loadingServicos}
                        >
                            📥 Exportar CSV
                        </button>
                        <button
                            className="btn-export"
                            onClick={() => handleExportacaoServicos('pdf')}
                            disabled={loadingServicos}
                        >
                            📥 Exportar PDF
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="agendamentos-table gestor-table">
                            <thead>
                                <tr>
                                    <th>Serviço</th>
                                    <th>Qtd. Execuções</th>
                                    <th>Receita Gerada</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {relatorioServicos.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.nome_servico}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                            {item.quantidade_execucoes}
                                        </td>
                                        <td className="agendamento-valor">
                                            {formatarValor(item.receita_gerada)}
                                        </td>
                                        <td>
                                            <span className={`agendamento-status ${getStatusClass(item.status)}`}>
                                                {item.status || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                        Total de serviços no relatório: <strong>{relatorioServicos.length}</strong>
                    </div>
                </>
            )}
            
            {relatorioServicos.length === 0 && !loadingServicos && !erroServicos && (
                <div className="no-agendamentos">
                    <p>Nenhum serviço encontrado no período selecionado.</p>
                    <button 
                        className="btn-action-primary"
                        onClick={() => carregarRelatorioServicos(dataInicioRelatorio, dataFimRelatorio)}
                    >
                        Tentar Novamente
                    </button>
                </div>
            )}
        </section>
        </div>
    );
}

export default DashboardGestor;