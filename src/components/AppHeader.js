// Arquivo completo e atualizado para: src/components/AppHeader.js

import React, { useState, useEffect, useRef } from 'react';

function getFirstName(fullName) {
    if (!fullName) return 'Usuário';
    return fullName.trim().split(' ')[0];
}

function AppHeader({ onNavigateToLogin, onNavigateToSignup, isLoggedIn, userData, onLogout, onNavigateToDashboard, onNavigateToHome, onNavigateToPetCadastro, onNavigateToMeusPets, onNavigateToMeuPerfil }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null); // Cria a referência para o menu

    const handlePlaceholderClick = (feature) => {
        alert(`A funcionalidade "${feature}" será implementada em breve!`);
        setIsDropdownOpen(false);
    };

    // --- LÓGICA PARA FECHAR O MENU AO CLICAR FORA ---
    useEffect(() => {
        // Função que será chamada em qualquer clique na página
        function handleClickOutside(event) {
            // Se o menu estiver aberto e o clique foi fora do elemento do menu...
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false); // ...fecha o menu.
            }
        }

        // Adiciona o ouvinte de eventos quando o componente é montado
        document.addEventListener("mousedown", handleClickOutside);
        
        // Função de limpeza: remove o ouvinte quando o componente é desmontado
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]); // O efeito depende da referência do dropdown

    return (
        <header className="header">
            <nav className="nav container">
                <a href="#" className="nav-brand" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>
                    <div className="icon">🐾</div>
                    PetLife
                </a>

                <ul className="nav-menu">
                    <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>Início</a></li>
                    {isLoggedIn && (
                        <>
                            <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToDashboard(); }}>Dashboard</a></li>
                            <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToMeusPets(); }}>Meus Pets</a></li>
                        </>
                    )}
                    <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); handlePlaceholderClick('Agendamento'); }}>Agendamento</a></li>
                    <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); handlePlaceholderClick('Produtos'); }}>Produtos</a></li>
                </ul>

                <div className="nav-buttons">
                    {isLoggedIn ? (
                        // Associa a referência ao container do menu
                        <div className="user-menu" ref={dropdownRef}>
                            <button className="user-menu-button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                {`Olá, ${getFirstName(userData?.nome)}`}
                                {/* Ícone de seta para indicar que é um dropdown */}
                                <span style={{ fontSize: '0.8rem' }}> </span>
                            </button>

                            {isDropdownOpen && (
                                <ul className="dropdown-menu">
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToMeuPerfil(); setIsDropdownOpen(false); }}>
                                            <span className="icon">👤</span> Meu Perfil
                                        </a>
                                    </li>
                                    <li className="dropdown-divider"></li> {/* Linha divisória */}
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
