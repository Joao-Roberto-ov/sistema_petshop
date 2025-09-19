import React, { useState } from 'react';

function getFirstName(fullName) {
    if (!fullName) return 'Usuário';
    return fullName.trim().split(' ')[0];
}

function AppHeader({ onNavigateToLogin, onNavigateToSignup, isLoggedIn, userData, onLogout, onNavigateToDashboard, onNavigateToHome, onNavigateToPetCadastro, onNavigateToMeusPets }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const handlePlaceholderClick = (feature) => {
        alert(`A funcionalidade "${feature}" será implementada em breve!`);
        setIsDropdownOpen(false);
    };

    return (
        <header className="header">
            <nav className="nav container">
                <a href="#" className="nav-brand" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>
                    <div className="icon">🐾</div>
                    PetLife
                </a>

                <ul className="nav-menu">
                    <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>Início</a></li>
                    <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); handlePlaceholderClick('Agendamento'); }}>Agendamento</a></li>
                    <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); handlePlaceholderClick('Produtos'); }}>Produtos</a></li>
                </ul>

                <div className="nav-buttons">
                    {isLoggedIn ? (
                        <div className="user-menu">
                            <button className="user-menu-button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                {`Olá, ${getFirstName(userData?.nome)}`}
                            </button>

                            {isDropdownOpen && (
                                <ul className="dropdown-menu">
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigateToDashboard(); setIsDropdownOpen(false); }}>Meu Dashboard</a></li>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigateToPetCadastro(); setIsDropdownOpen(false); }}>Cadastrar Pet</a></li>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigateToMeusPets(); setIsDropdownOpen(false); }}>Meus Pets</a></li>
                                    <li><a href="#" onClick={(e) => handlePlaceholderClick("Meu Perfil")}>Meu Perfil</a></li>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setIsDropdownOpen(false); }}>Sair</a></li>
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