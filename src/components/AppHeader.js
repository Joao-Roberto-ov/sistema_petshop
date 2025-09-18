import React from 'react';

function getFirstName(fullName) {
    if (!fullName) return 'Usuário';
    return fullName.trim().split(' ')[0];
}

function AppHeader({ onNavigateToLogin, onNavigateToSignup, isLoggedIn, userData, onLogout, onNavigateToDashboard, onNavigateToHome }) {
    const handlePlaceholderClick = (feature) => {
        alert(`A funcionalidade "${feature}" será implementada em breve!`);
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

                    {isLoggedIn && (
                        <>
                            <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToDashboard(); }}>Dashboard</a></li>
                            <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); handlePlaceholderClick('Agendamentos'); }}>Agendamentos</a></li>
                        </>
                    )}
                </ul>

                <div className="nav-buttons">
                    {isLoggedIn ? (
                        <>
                            <span className="user-welcome">{`Olá, ${getFirstName(userData?.nome)}`}</span>
                            <button className="btn-sair" onClick={onLogout}>Sair</button>
                        </>
                    ) : (
                        <>
                            {}
                            {}
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