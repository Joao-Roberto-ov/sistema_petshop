import React, { useState, useEffect, useRef } from 'react';

function getFirstName(fullName) {
    if (!fullName) return 'Usuário';
    return fullName.trim().split(' ')[0];
}

// ATUALIZAÇÃO 1: Adicionada a nova prop "onNavigateToProdutos"
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
    onNavigateToProdutos
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handlePlaceholderClick = (feature) => {
        alert(`A funcionalidade "${feature}" será implementada em breve!`);
        setIsDropdownOpen(false);
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

    const isFuncionarioOuAdmin = userData?.cargo &&
        (userData.cargo === 'FUNCIONARIO' || userData.cargo === 'GESTOR');

    const isAdmin = userData?.cargo === 'GESTOR';

    // ATUALIZAÇÃO 2: Adicionada a nova função de clique para "Produtos"
    const handleProdutosClick = (e) => {
        e.preventDefault();

        // Redireciona baseado no tipo de usuário
        if (!isLoggedIn) {
            // Se não está logado, vai para produtos do cliente
            onNavigateToProdutos('cliente');
        } else if (userData?.cargo === 'GESTOR') {
            onNavigateToProdutos('gestor');
        } else if (userData?.cargo === 'FUNCIONARIO') {
            onNavigateToProdutos('funcionario');
        } else {
            // Cliente logado
            onNavigateToProdutos('cliente');
        }
    };

    return (
        <header className="header">
            <nav className="nav container">
                <a href="#" className="nav-brand" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>
                    <div className="icon">🐾</div>
                    PetLife
                </a>

                {/* ATUALIZAÇÃO 3: A estrutura do menu foi reorganizada */}
                <ul className="nav-menu">
                    <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>Início</a></li>

                    {/* Links para Cliente Logado */}
                    {isLoggedIn && !isFuncionarioOuAdmin && (
                        <>
                            <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToDashboard(); }}>Dashboard</a></li>
                            <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToMeusPets(); }}>Meus Pets</a></li>
                        </>
                    )}

                    {/* Links para Funcionário/Gestor Logado */}
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
                                    👥 Clientes
                                </a>
                            </li>
                            {isAdmin && (
                                <li>
                                    <a
                                        href="#"
                                        className="nav-link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.dispatchEvent(new CustomEvent('navigate', { detail: 'funcionario-cadastro-admin' }));
                                        }}
                                    >
                                        ➕ Cadastrar Funcionário
                                    </a>
                                </li>
                            )}
                        </>
                    )}

                    {/* Botão de Produtos - Sempre Visível */}
                    <li>
                        <a
                            href="#"
                            className="nav-link"
                            onClick={handleProdutosClick}
                        >
                            🛒 Produtos
                        </a>
                    </li>

                    {/* Link de Agendamento - Visível apenas para deslogados */}
                    {!isLoggedIn && (
                        <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); handlePlaceholderClick('Agendamento'); }}>Agendamento</a></li>
                    )}
                </ul>

                <div className="nav-buttons">
                    {isLoggedIn ? (
                        <div className="user-menu" ref={dropdownRef}>
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
                                                    <span className="icon">👥</span> Gerenciar Clientes
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