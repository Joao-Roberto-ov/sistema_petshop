import React, { useState, useEffect, useRef } from 'react';

function getFirstName(fullName) {
    if (!fullName) return 'Usuário';
    return fullName.trim().split(' ')[0];
}

function AppHeader({ onNavigateToLogin, onNavigateToSignup, isLoggedIn, userData, onLogout, onNavigateToDashboard, onNavigateToHome, onNavigateToPetCadastro, onNavigateToMeusPets, onNavigateToMeuPerfil }) {
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
                        <div className="user-menu" ref={dropdownRef}>
                            <button className="user-menu-button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                {`Olá, ${getFirstName(userData?.nome)}`}
                            </button>

                            {isDropdownOpen && (
                                <ul className="dropdown-menu">
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToMeuPerfil(); setIsDropdownOpen(false); }}>
                                            <span className="icon">👤</span> Meu Perfil
                                        </a>
                                    </li>
                                    <li className="dropdown-divider"></li>
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