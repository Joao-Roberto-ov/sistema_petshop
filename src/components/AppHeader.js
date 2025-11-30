import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import "./AppHeader.css"

function getFirstName(fullName) {
    if (!fullName) return 'Usuário';
    return fullName.trim().split(' ')[0];
}

function AppHeader({
    onNavigateToLogin,
    onNavigateToSignup,
    isLoggedIn,
    userData,
    onLogout,
    onNavigateToDashboard,
    onNavigateToHome,
    onNavigateToPetCadastro,
    onNavigateToMeusPets,
    onNavigateToMeuPerfil,
    onNavigateToProdutos,
    onNavigateToServicosCliente
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [totalNotificacoes, setTotalNotificacoes] = useState(0);

    const cargoLower = userData?.cargo?.toLowerCase();
    const isAdmin = userData?.cargo === 'GESTOR' ||
                    userData?.cargo === 'ADMINISTRADOR' ||
                    cargoLower === 'gestor' ||
                    cargoLower === 'administrador';

    const isFuncionarioOuAdmin = userData?.cargo &&
        (userData.cargo === 'FUNCIONARIO' || userData.cargo === 'GESTOR');

    const nomeEmpresa = 'PetLife';
    const dropdownRef = useRef(null);

    const handleServicosClick = (e) => {
        e.preventDefault();
        if (onNavigateToServicosCliente) {
            onNavigateToServicosCliente();
        } else {
            console.warn("onNavigateToServicosCliente não foi fornecida ao AppHeader");
            alert('Erro: Função de navegação para serviços não definida.');
        }
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    // Verifica quantidade total de notificações (Sistema + Estoque)
    useEffect(() => {
        if (!isLoggedIn || !isAdmin) return;

        const checkNotificacoes = async () => {
            try {
                const token = localStorage.getItem('token');
                // Busca notificações gerais (agendamentos, cancelamentos)
                const resNotif = await axios.get('/notificacoes/', { headers: { Authorization: `Bearer ${token}` } });
                // Busca estoque baixo
                const resEstoque = await axios.get('/produtos/estoque-baixo', { headers: { Authorization: `Bearer ${token}` } });

                const total = (resNotif.data?.length || 0) + (resEstoque.data?.length || 0);
                setTotalNotificacoes(total);
            } catch (e) {
                console.error("Erro ao verificar notificações:", e);
            }
        };

        checkNotificacoes();
        // Verifica a cada 60s
        const interval = setInterval(checkNotificacoes, 60000);
        return () => clearInterval(interval);
    }, [isLoggedIn, isAdmin]);

    const handleProdutosClick = (e) => {
        e.preventDefault();

        if (!isLoggedIn) {
            onNavigateToProdutos('cliente');
        } else if (userData?.cargo === 'GESTOR') {
            onNavigateToProdutos('gestor');
        } else if (userData?.cargo === 'FUNCIONARIO') {
            onNavigateToProdutos('funcionario');
        } else {
            onNavigateToProdutos('cliente');
        }
    };

    return (
        <header className="header">
            <nav className="nav container">
                <a href="#" className="nav-brand" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>
                    <div className="icon">🐾</div>
                    {nomeEmpresa}
                </a>

                <ul className="nav-menu">
                    <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>Início</a></li>

                    {isLoggedIn && !isFuncionarioOuAdmin && (
                        <>
                            <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToDashboard(); }}>Dashboard</a></li>
                            <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToMeusPets(); }}>Meus Pets</a></li>
                            <li><a href="#" className="nav-link" onClick={handleServicosClick}>Serviços</a></li>
                        </>
                    )}

                    {isLoggedIn && isFuncionarioOuAdmin && (
                        <>
                            <li>
                                <a
                                    href="#"
                                    className="nav-link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.dispatchEvent(new CustomEvent('navigate', { detail: 'visualizarClientes' }));
                                    }}
                                >
                                    Clientes
                                </a>
                            </li>

                            {isAdmin && (
                                <>
                                    <li>
                                        <a
                                            href="#"
                                            className="nav-link"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.dispatchEvent(new CustomEvent('navigate', { detail: 'cadastro-funcionario-completo' }));
                                            }}
                                        >
                                            Cadastrar Funcionário
                                        </a>
                                    </li>

                                    <li>
                                        <a
                                            href="#"
                                            className="nav-link"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.dispatchEvent(new CustomEvent('navigate', { detail: 'listar-funcionarios' }));
                                            }}
                                        >
                                            Gerenciar Funcionários
                                        </a>
                                    </li>
                                </>
                            )}

                            <li><a href="#" className="nav-link" onClick={handleServicosClick}>Serviços</a></li>
                        </>
                    )}

                    <li>
                        <a
                            href="#"
                            className="nav-link"
                            onClick={handleProdutosClick}
                        >
                            Produtos
                        </a>
                    </li>

                    {!isLoggedIn && (
                        <li><a href="#" className="nav-link" onClick={handleServicosClick}>Serviços</a></li>
                    )}
                </ul>

                <div className="nav-buttons">
                    {isLoggedIn ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

                            {/* Botão de Notificações (Nova Tela) */}
                            {isAdmin && (
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'notificacoes' }))}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
                                        fontSize: '1.2rem', color: '#555', marginRight: '10px', display: 'flex', alignItems: 'center'
                                    }}
                                    title="Central de Notificações"
                                >
                                    🔔
                                    {totalNotificacoes > 0 && (
                                        <span style={{
                                            position: 'absolute', top: '-5px', right: '-5px',
                                            background: '#e74c3c', color: 'white', borderRadius: '50%',
                                            padding: '2px 5px', fontSize: '0.7rem', fontWeight: 'bold',
                                            minWidth: '18px', textAlign: 'center'
                                        }}>
                                            {totalNotificacoes}
                                        </span>
                                    )}
                                </button>
                            )}

                            <div className="user-menu" ref={dropdownRef} style={{ position: 'relative' }}>
                                <button className="user-menu-button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                    {`Olá, ${getFirstName(userData?.nome)}`}
                                    {isFuncionarioOuAdmin && (
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            fontSize: '0.75rem',
                                            padding: '0.2rem 0.5rem',
                                            backgroundColor: '#4a9b8e',
                                            borderRadius: '12px',
                                            color: 'white'
                                        }}>
                                            {userData.cargo}
                                        </span>
                                    )}
                                </button>

                                {isDropdownOpen && (
                                    <ul className="dropdown-menu">
                                        {!isFuncionarioOuAdmin && (
                                            <>
                                                <li>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToMeuPerfil(); setIsDropdownOpen(false); }}>
                                                        <span className="icon">👤</span> Meu Perfil
                                                    </a>
                                                </li>

                                                <li className="dropdown-divider"></li>
                                            </>
                                        )}

                                        {isFuncionarioOuAdmin && (
                                            <>
                                                <li>
                                                    <a href="#" onClick={(e) => {
                                                        e.preventDefault();
                                                        window.dispatchEvent(new CustomEvent('navigate', { detail: 'visualizarClientes' }));
                                                        setIsDropdownOpen(false);
                                                    }}>
                                                        <span className="icon">👤</span> Gerenciar Clientes
                                                    </a>
                                                </li>

                                                {isAdmin && (
                                                    <li>
                                                        <a href="#" onClick={(e) => {
                                                            e.preventDefault();
                                                            window.dispatchEvent(new CustomEvent('navigate', { detail: 'funcionario-cadastro-admin' }));
                                                            setIsDropdownOpen(false);
                                                        }}>
                                                            <span className="icon">➕</span> Cadastrar Funcionário
                                                        </a>
                                                    </li>
                                                )}

                                                <li className="dropdown-divider"></li>
                                            </>
                                        )}

                                        <li>
                                            <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setIsDropdownOpen(false); }}>
                                                <span className="icon">↪</span> Sair
                                            </a>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <a href="#" className="btn-entrar" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }}>Entrar</a>
                            <a href="#" className="btn-cadastrar" onClick={(e) => { e.preventDefault(); onNavigateToSignup(); }}>Cadastrar</a>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}

export default AppHeader;